import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HTTP_INTERCEPTORS,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { catchError, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { TokenService } from './core/services/token.service';
import { RefreshTokenService } from './core/services/refresh-token.service';
import { ToastrService } from 'ngx-toastr';

// Create an HttpInterceptorFn that wraps our class-based interceptor
export const errorInterceptorFn: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 0) {
          errorMessage =
            'Cannot connect to the server. Please check your network connection.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
      }

      // Don't show toasts for 401 errors as they are handled by the auth interceptor
      if (error.status !== 401) {
        toastr.error(errorMessage, 'Error');
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const refreshTokenService = inject(RefreshTokenService);
  // Don't add token for login/register requests
  if (req.url.includes('login') || req.url.includes('register')) {
    return next(req);
  }

  // Add token to authenticated requests
  const token = tokenService.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('refresh-token')) {
        // Try to refresh the token
        return refreshTokenService.refreshToken().pipe(
          switchMap((tokens: { accessToken: string; refreshToken: string }) => {
            // Retry the request with the new token
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            });
            return next(newReq);
          }),
          catchError((refreshError: any) => {
            // If refresh fails, just clear tokens
            tokenService.removeTokens();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([errorInterceptorFn, authInterceptorFn])
    ),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,
  ],
};

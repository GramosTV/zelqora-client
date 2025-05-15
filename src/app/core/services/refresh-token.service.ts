import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class RefreshTokenService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap((tokens) => {
          this.tokenService.saveTokens(tokens.accessToken, tokens.refreshToken);
        }),
        catchError((error) => {
          // Clear tokens on refresh failure
          this.tokenService.removeTokens();
          return throwError(() => error);
        })
      );
  }
}

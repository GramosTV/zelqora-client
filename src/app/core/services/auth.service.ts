import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  User,
  UserRole,
  UserRegistrationDto,
  UserLoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from '../models/user.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private refreshTokenTimeout: any;
  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private refreshTokenService: RefreshTokenService,
    private router: Router
  ) {
    this.checkToken();
  }
  private checkToken(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        if (!this.tokenService.isTokenExpired(token)) {
          this.loadUserFromToken(token);
          this.startRefreshTokenTimer();
        } else {
          this.refreshToken().subscribe();
        }
      } catch (error) {
        this.logout();
      }
    }
  }
  private loadUserFromToken(token: string): void {
    const decodedToken = this.tokenService.decodeToken(token);
    if (decodedToken) {
      // Check if we have the user info in localStorage
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          this.currentUserSubject.next(user);
          // Still fetch the latest user info in the background
          this.getUserProfile(
            decodedToken.sub || decodedToken.nameid || decodedToken.userId
          ).subscribe();
        } catch (e) {
          // JSON parse error, fetch the user profile
          this.getUserProfile(
            decodedToken.sub || decodedToken.nameid || decodedToken.userId
          ).subscribe();
        }
      } else {
        // Fetch the user details using the decoded token information
        // In .NET Core JWT tokens, the user ID is often stored in 'sub', 'nameid' or 'userId'
        this.getUserProfile(
          decodedToken.sub || decodedToken.nameid || decodedToken.userId
        ).subscribe();
      }
    }
  }
  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${userId}`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }),
      catchError((error) => {
        console.error(`Error fetching user profile for ID: ${userId}`, error);
        return throwError(
          () =>
            new Error('Failed to load user profile. Please try again later.')
        );
      })
    );
  }
  login(email: string, password: string): Observable<User> {
    const loginDto: UserLoginDto = { email, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginDto).pipe(
      tap((response) => {
        this.tokenService.saveTokens(
          response.accessToken,
          response.refreshToken
        );
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.startRefreshTokenTimer();
      }),
      map((response) => response.user),
      catchError((error) => {
        return throwError(
          () => new Error(error.error?.message || 'Invalid email or password')
        );
      })
    );
  }
  register(userData: UserRegistrationDto): Observable<User> {
    // Create a proper registration DTO that matches the backend expectations
    // The incoming userData is already a UserRegistrationDto
    const registrationData: UserRegistrationDto = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role !== undefined ? userData.role : UserRole.PATIENT,
      specialization: userData.specialization,
    };

    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/register`,
        registrationData
      )
      .pipe(
        tap((response) => {
          this.tokenService.saveTokens(
            response.accessToken,
            response.refreshToken
          );
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          this.startRefreshTokenTimer();
        }),
        map((response) => response.user),
        catchError((error) => {
          return throwError(
            () => new Error(error.error?.message || 'Registration failed')
          );
        })
      );
  }

  logout(): void {
    // Call the API to invalidate the refresh token on the server
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.clearAuthData(),
      error: () => this.clearAuthData(),
    });
  }
  private clearAuthData(): void {
    this.tokenService.removeTokens(); // This handles access and refresh tokens
    localStorage.removeItem('currentUser');
    this.stopRefreshTokenTimer();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
  refreshToken(): Observable<TokenResponse> {
    return this.refreshTokenService.refreshToken().pipe(
      tap((tokens) => {
        // Only start the refresh token timer here
        this.startRefreshTokenTimer();
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenService.getRefreshToken();
  }
  private startRefreshTokenTimer(): void {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      // Get token expiration from TokenService
      const decodedToken = this.tokenService.decodeToken(token);
      if (!decodedToken || !decodedToken.exp) return;

      // Calculate expiration date from JWT exp claim (seconds since epoch)
      const expires = new Date(decodedToken.exp * 1000);
      if (!expires) return;

      // Set refresh timer to occur 30 seconds before token expires
      const timeout = expires.getTime() - Date.now() - 30 * 1000;
      this.stopRefreshTokenTimer();
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken().subscribe();
      }, Math.max(0, timeout));
    } catch (error) {
      console.error('Error starting refresh token timer', error);
    }
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
  forgotPassword(email: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/request-password-reset`, {
        email,
      })
      .pipe(
        catchError((error) => {
          console.error('Error requesting password reset', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Failed to request password reset. Please try again.'
              )
          );
        })
      );
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/reset-password`, {
        token,
        password,
      })
      .pipe(
        catchError((error) => {
          console.error('Error resetting password', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Failed to reset password. Please try again.'
              )
          );
        })
      );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const currentUser = this.currentUserSubject.value;
    return !!currentUser && currentUser.role === role;
  }
}

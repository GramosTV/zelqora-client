import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

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
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {
    this.checkToken();
  }

  private checkToken(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        if (!this.jwtHelper.isTokenExpired(token)) {
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
    const decodedToken = this.jwtHelper.decodeToken(token);
    if (decodedToken) {
      // Fetch the user details using the decoded token information
      this.getUserProfile(decodedToken.sub).subscribe();
    }
  }

  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${userId}`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
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

  register(user: Partial<User>): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/users/register`, user)
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.stopRefreshTokenTimer();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<TokenResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((tokens) => {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          this.startRefreshTokenTimer();
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private startRefreshTokenTimer(): void {
    const token = this.getAccessToken();
    if (!token) return;

    try {
      // Get token expiration date
      const expires = this.jwtHelper.getTokenExpirationDate(token);
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
    return this.http.post<any>(`${this.apiUrl}/request-password-reset`, {
      email,
    });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, {
      token,
      password,
    });
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

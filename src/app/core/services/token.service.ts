import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private jwtHelper: JwtHelperService) {}

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  removeTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }

  isTokenExpired(token: string): boolean {
    return this.jwtHelper.isTokenExpired(token);
  }

  decodeToken(token: string): any {
    return this.jwtHelper.decodeToken(token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}

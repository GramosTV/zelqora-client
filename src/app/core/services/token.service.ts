import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private jwtHelper: JwtHelperService) {}
  public getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  public saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  public removeTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
  public isTokenExpired(token: string): boolean {
    return this.jwtHelper.isTokenExpired(token);
  }
  public decodeToken(token: string): any {
    return this.jwtHelper.decodeToken(token);
  }
  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
}

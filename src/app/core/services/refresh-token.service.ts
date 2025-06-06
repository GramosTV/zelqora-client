import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { RefreshTokenDto } from '../models/user.model';

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

  public refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    const refreshTokenDto: RefreshTokenDto = { refreshToken };
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/refresh-token`, refreshTokenDto)
      .pipe(
        tap((tokens) => {
          this.tokenService.saveTokens(tokens.accessToken, tokens.refreshToken);
        }),
        catchError((error) => {
          this.tokenService.removeTokens();
          return throwError(() => error);
        })
      );
  }
}

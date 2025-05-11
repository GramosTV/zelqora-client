import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getDoctors(): Observable<User[]> {
    const params = new HttpParams().set('role', UserRole.DOCTOR);
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getPatients(): Observable<User[]> {
    const params = new HttpParams().set('role', UserRole.PATIENT);
    return this.http.get<User[]>(this.apiUrl, { params });
  }
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData);
  }

  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateProfilePicture(id: string, formData: FormData): Observable<User> {
    return this.http.post<User>(
      `${this.apiUrl}/${id}/profile-picture`,
      formData
    );
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
  }
}

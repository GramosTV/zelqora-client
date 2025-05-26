import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  User,
  UserRole,
  UserUpdateDto,
  UserRegistrationDto,
  DoctorDto,
} from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching all users', error);
        return throwError(
          () => new Error('Failed to load users. Please try again later.')
        );
      })
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching user with ID: ${id}`, error);
        return throwError(
          () => new Error('Failed to load user. Please try again later.')
        );
      })
    );
  }

  getDoctors(): Observable<User[]> {
    const params = new HttpParams().set('role', UserRole.DOCTOR);
    return this.http.get<User[]>(`${this.apiUrl}/doctors`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching doctors', error);
        return throwError(
          () => new Error('Failed to load doctors. Please try again later.')
        );
      })
    );
  }

  // Add new method to get simplified doctor list for the picker
  getDoctorList(): Observable<DoctorDto[]> {
    return this.http.get<DoctorDto[]>(`${this.apiUrl}/doctors-list`).pipe(
      catchError((error) => {
        console.error('Error fetching doctor list', error);
        return throwError(
          () => new Error('Failed to load doctor list. Please try again later.')
        );
      })
    );
  }

  getPatients(): Observable<User[]> {
    const params = new HttpParams().set('role', UserRole.PATIENT);
    return this.http.get<User[]>(`${this.apiUrl}/patients`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching patients', error);
        return throwError(
          () => new Error('Failed to load patients. Please try again later.')
        );
      })
    );
  }
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    // Create a UserUpdateDto with only the allowed fields
    const updateDto: UserUpdateDto = {};

    if (userData.firstName !== undefined)
      updateDto.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateDto.lastName = userData.lastName;
    if (userData.email !== undefined) updateDto.email = userData.email;
    if (userData.specialization !== undefined)
      updateDto.specialization = userData.specialization;

    return this.http.patch<User>(`${this.apiUrl}/${id}`, updateDto).pipe(
      catchError((error) => {
        console.error(`Error updating user with ID: ${id}`, error);
        return throwError(
          () => new Error('Failed to update user. Please try again later.')
        );
      })
    );
  }
  createUser(
    userData: Partial<User> & { password?: string }
  ): Observable<User> {
    // Create a UserRegistrationDto for user creation
    const registrationDto: UserRegistrationDto = {
      email: userData.email!,
      password: userData.password || 'DefaultPassword123!', // Provide a default or require it
      firstName: userData.firstName!,
      lastName: userData.lastName!,
      role: userData.role !== undefined ? userData.role : UserRole.PATIENT,
      specialization: userData.specialization,
    };

    return this.http.post<User>(this.apiUrl, registrationDto).pipe(
      catchError((error) => {
        console.error('Error creating user', error);
        return throwError(
          () => new Error('Failed to create user. Please try again later.')
        );
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting user with ID: ${id}`, error);
        return throwError(
          () => new Error('Failed to delete user. Please try again later.')
        );
      })
    );
  }

  updateProfilePicture(id: string, formData: FormData): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/${id}/profile-picture`, formData)
      .pipe(
        catchError((error) => {
          console.error(
            `Error updating profile picture for user with ID: ${id}`,
            error
          );
          return throwError(
            () =>
              new Error(
                'Failed to update profile picture. Please try again later.'
              )
          );
        })
      );
  }

  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError((error) => {
        console.error('Error searching users', error);
        return throwError(
          () => new Error('Failed to search users. Please try again later.')
        );
      })
    );
  }
}

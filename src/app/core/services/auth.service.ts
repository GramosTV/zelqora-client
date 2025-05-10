import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Mock user data
  private users: User[] = [
    {
      id: '1',
      email: 'doctor@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.DOCTOR,
      specialization: 'Cardiology',
      profilePicture: 'assets/images/doctor.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'patient@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.PATIENT,
      profilePicture: 'assets/images/patient.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<User> {
    // In a real application, you would call an API to validate credentials
    const foundUser = this.users.find((user) => user.email === email);

    if (foundUser) {
      // Mock successful login
      return of(foundUser).pipe(
        delay(800), // Simulate network delay
        tap((user) => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
    }

    return throwError(() => new Error('Invalid email or password'));
  }

  register(user: Partial<User>): Observable<User> {
    // In a real application, you would call an API to register the user
    const newUser: User = {
      id: Math.random().toString(36).substring(2),
      email: user.email!,
      firstName: user.firstName!,
      lastName: user.lastName!,
      role: user.role || UserRole.PATIENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add the new user to our mock database
    this.users.push(newUser);

    return of(newUser).pipe(
      delay(800), // Simulate network delay
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
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

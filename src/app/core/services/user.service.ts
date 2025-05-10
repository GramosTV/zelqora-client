import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Mock user data - in a real app, you'd fetch this from an API
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
    {
      id: '4',
      email: 'doctor2@example.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      role: UserRole.DOCTOR,
      specialization: 'Dermatology',
      profilePicture: 'assets/images/doctor2.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor() {}

  getAllUsers(): Observable<User[]> {
    return of(this.users).pipe(delay(500));
  }

  getUserById(id: string): Observable<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    return of(user).pipe(delay(500));
  }

  getDoctors(): Observable<User[]> {
    const doctors = this.users.filter((u) => u.role === UserRole.DOCTOR);
    return of(doctors).pipe(delay(500));
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    const index = this.users.findIndex((u) => u.id === id);

    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...userData,
        updatedAt: new Date(),
      };

      return of(this.users[index]).pipe(delay(500));
    }

    throw new Error('User not found');
  }
}

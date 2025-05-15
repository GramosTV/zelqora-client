import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users', () => {
    const mockUsers: User[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.DOCTOR,
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: UserRole.PATIENT,
      },
    ];

    service.getAllUsers().subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should handle error when get all users fails', () => {
    service.getAllUsers().subscribe({
      next: () => fail('Should have failed with 500 error'),
      error: (error) => {
        expect(error).toBeTruthy();
        expect(error.message).toContain('Failed to load users');
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    req.flush('Server error', {
      status: 500,
      statusText: 'Internal Server Error',
    });
  });

  it('should get user by id', () => {
    const mockUser: User = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.DOCTOR,
    };

    service.getUserById('1').subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should create a new user', () => {
    const newUser: Partial<User> = {
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      role: UserRole.PATIENT,
    };

    const createdUser: User = {
      id: '3',
      ...newUser,
    } as User;

    service.createUser(newUser).subscribe((user) => {
      expect(user).toEqual(createdUser);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(createdUser);
  });

  it('should update a user', () => {
    const userId = '1';
    const updates: Partial<User> = {
      firstName: 'Updated',
    };

    const updatedUser: User = {
      id: userId,
      firstName: 'Updated',
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.DOCTOR,
    };

    service.updateUser(userId, updates).subscribe((user) => {
      expect(user).toEqual(updatedUser);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${userId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updates);
    req.flush(updatedUser);
  });

  it('should delete a user', () => {
    const userId = '1';

    service.deleteUser(userId).subscribe((response) => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${userId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should search users', () => {
    const query = 'john';
    const mockUsers: User[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.DOCTOR,
      },
    ];

    service.searchUsers(query).subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/users/search?search=${query}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});

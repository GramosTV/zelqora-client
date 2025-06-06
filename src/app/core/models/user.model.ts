export enum UserRole {
  PATIENT = 0,
  DOCTOR = 1,
  ADMIN = 2,
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  specialization?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistrationDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  specialization?: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface UserUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface DoctorDto {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

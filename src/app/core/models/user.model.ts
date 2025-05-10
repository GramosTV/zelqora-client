export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  specialization?: string; // For doctors
  createdAt: Date;
  updatedAt: Date;
}

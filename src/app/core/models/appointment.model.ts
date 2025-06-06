import { User } from './user.model';

export enum AppointmentStatus {
  PENDING = 0,
  CONFIRMED = 1,
  CANCELLED = 2,
  COMPLETED = 3,
}

export interface Appointment {
  id: string;
  title: string;
  patientId: string;
  doctorId: string;
  patient?: User;
  doctor?: User;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDto {
  title: string;
  patientId: string;
  doctorId: string;
  startTime: Date | string;
  endTime: Date | string;
  status: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentDto {
  title?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
}

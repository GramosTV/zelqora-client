import { User } from './user.model';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
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

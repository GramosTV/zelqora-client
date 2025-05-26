import { User } from './user.model';
import { Appointment } from './appointment.model';

export interface Reminder {
  id: string;
  userId: string;
  appointmentId: string;
  title: string;
  message: string;
  reminderDate: Date;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  appointment?: Appointment;
}

export interface CreateReminderDto {
  userId: string;
  appointmentId: string;
  title: string;
  message: string;
  reminderDate: Date | string; // Keep as Date | string for flexibility in creation, service will handle conversion
}

export interface UpdateReminderDto {
  isRead: boolean;
}

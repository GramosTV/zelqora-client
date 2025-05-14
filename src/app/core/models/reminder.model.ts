import { User } from './user.model';
import { Appointment } from './appointment.model';

export interface Reminder {
  id: string;
  userId: string;
  appointmentId: string;
  title: string;
  message: string;
  reminderDate: Date | string;
  isRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: User;
  appointment?: Appointment;
}

export interface CreateReminderDto {
  userId: string;
  appointmentId: string;
  title: string;
  message: string;
  reminderDate: Date | string;
}

export interface UpdateReminderDto {
  isRead: boolean;
}

import { AppointmentStatus } from '../models/appointment.model';
import { UserRole } from '../models/user.model';

export function getAppointmentStatusString(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.PENDING:
      return 'Pending';
    case AppointmentStatus.CONFIRMED:
      return 'Confirmed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    default:
      return '';
  }
}

export function getUserRoleString(role: UserRole): string {
  switch (role) {
    case UserRole.PATIENT:
      return 'Patient';
    case UserRole.DOCTOR:
      return 'Doctor';
    case UserRole.ADMIN:
      return 'Admin';
    default:
      return '';
  }
}

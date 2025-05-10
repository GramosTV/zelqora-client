import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from './appointment.service';
import { AuthService } from './auth.service';

export interface Reminder {
  id: string;
  appointmentId: string;
  userId: string;
  message: string;
  reminderDate: Date;
  isRead: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  private reminders: Reminder[] = [];
  private remindersSubject = new BehaviorSubject<Reminder[]>([]);
  public reminders$ = this.remindersSubject.asObservable();

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService
  ) {
    // Initialize with default reminders
    this.generateInitialReminders();
  }

  private generateInitialReminders(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.appointmentService
      .getAppointmentsByUser(currentUser.id)
      .subscribe((appointments) => {
        // Generate reminders for upcoming appointments
        const now = new Date();
        const upcomingAppointments = appointments.filter(
          (app) => new Date(app.startTime) > now
        );

        upcomingAppointments.forEach((appointment) => {
          // Create a reminder 24 hours before appointment
          const reminderDate = new Date(appointment.startTime);
          reminderDate.setDate(reminderDate.getDate() - 1);

          if (reminderDate > now) {
            this.addReminder(appointment, reminderDate);
          }

          // Also add a reminder 1 hour before
          const hourReminderDate = new Date(appointment.startTime);
          hourReminderDate.setHours(hourReminderDate.getHours() - 1);

          if (hourReminderDate > now) {
            this.addReminder(appointment, hourReminderDate, true);
          }
        });

        this.remindersSubject.next(this.reminders);
      });
  }

  private addReminder(
    appointment: Appointment,
    reminderDate: Date,
    isHourReminder = false
  ): void {
    const message = isHourReminder
      ? `Your appointment "${appointment.title}" is in 1 hour.`
      : `Don't forget your appointment "${
          appointment.title
        }" tomorrow at ${this.formatTime(appointment.startTime)}.`;

    const reminder: Reminder = {
      id: Math.random().toString(36).substring(2),
      appointmentId: appointment.id,
      userId: this.authService.getCurrentUser()?.id || '',
      message,
      reminderDate,
      isRead: false,
      createdAt: new Date(),
    };

    this.reminders.push(reminder);
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getReminders(): Observable<Reminder[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);

    return of(this.reminders.filter((r) => r.userId === currentUser.id)).pipe(
      delay(500),
      map((reminders) =>
        reminders.sort(
          (a, b) =>
            new Date(a.reminderDate).getTime() -
            new Date(b.reminderDate).getTime()
        )
      )
    );
  }

  getUnreadRemindersCount(): Observable<number> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(0);

    return of(
      this.reminders.filter((r) => r.userId === currentUser.id && !r.isRead)
        .length
    ).pipe(delay(300));
  }

  markAsRead(reminderId: string): Observable<boolean> {
    const index = this.reminders.findIndex((r) => r.id === reminderId);

    if (index !== -1) {
      this.reminders[index].isRead = true;
      this.remindersSubject.next(this.reminders);
      return of(true).pipe(delay(300));
    }

    return of(false).pipe(delay(300));
  }

  markAllAsRead(): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(false);

    this.reminders
      .filter((r) => r.userId === currentUser.id)
      .forEach((r) => (r.isRead = true));

    this.remindersSubject.next(this.reminders);
    return of(true).pipe(delay(300));
  }

  deleteReminder(reminderId: string): Observable<boolean> {
    const index = this.reminders.findIndex((r) => r.id === reminderId);

    if (index !== -1) {
      this.reminders.splice(index, 1);
      this.remindersSubject.next(this.reminders);
      return of(true).pipe(delay(300));
    }

    return of(false).pipe(delay(300));
  }

  createReminderForAppointment(
    appointment: Appointment,
    reminderDate: Date,
    message?: string
  ): Observable<Reminder> {
    const reminderMessage =
      message || `Reminder for your appointment "${appointment.title}"`;

    const reminder: Reminder = {
      id: Math.random().toString(36).substring(2),
      appointmentId: appointment.id,
      userId: this.authService.getCurrentUser()?.id || '',
      message: reminderMessage,
      reminderDate,
      isRead: false,
      createdAt: new Date(),
    };

    this.reminders.push(reminder);
    this.remindersSubject.next(this.reminders);

    return of(reminder).pipe(delay(300));
  }
}

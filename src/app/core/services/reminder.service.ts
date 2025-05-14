import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
} from '../models/reminder.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  private apiUrl = `${environment.apiUrl}/reminders`;
  private reminderSubject = new BehaviorSubject<Reminder[]>([]);
  public reminders$ = this.reminderSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Load initial reminders if user is logged in
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.getReminders().subscribe();
      }
    });
  }

  getReminders(): Observable<Reminder[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.http
      .get<Reminder[]>(`${this.apiUrl}/user/${currentUser.id}`)
      .pipe(
        map((reminders) => {
          // Sort reminders by date (newest first) and read status (unread first)
          return reminders.sort((a, b) => {
            // First sort by read status
            if (a.isRead !== b.isRead) {
              return a.isRead ? 1 : -1;
            }
            // Then by date (newest first)
            return (
              new Date(b.reminderDate).getTime() -
              new Date(a.reminderDate).getTime()
            );
          });
        }),
        tap((reminders) => {
          this.reminderSubject.next(reminders);
        })
      );
  }

  getReminderById(id: string): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.apiUrl}/${id}`);
  }

  getUpcomingReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/upcoming`);
  }

  getUnreadReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/unread`);
  }

  getUnreadRemindersCount(): Observable<number> {
    return this.getUnreadReminders().pipe(map((reminders) => reminders.length));
  }

  getRemindersByAppointment(appointmentId: string): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(
      `${this.apiUrl}/appointment/${appointmentId}`
    );
  }
  createReminder(reminder: CreateReminderDto): Observable<Reminder> {
    return this.http.post<Reminder>(this.apiUrl, reminder).pipe(
      tap(() => {
        // Refresh the list after creation
        this.getReminders().subscribe();
      })
    );
  }

  createCustomReminder(
    appointmentId: string,
    message: string,
    reminderDate: Date | string
  ): Observable<Reminder> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable((observer) => {
        observer.error('User not authenticated');
      });
    }

    const reminderDto: CreateReminderDto = {
      userId: currentUser.id,
      appointmentId: appointmentId,
      title: 'Appointment Reminder',
      message: message,
      reminderDate: reminderDate,
    };

    return this.createReminder(reminderDto);
  }

  markAsRead(id: string): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        // Update the subject with the reminder marked as read
        const currentReminders = this.reminderSubject.value;
        const updatedReminders = currentReminders.map((reminder) =>
          reminder.id === id ? { ...reminder, isRead: true } : reminder
        );
        this.reminderSubject.next(updatedReminders);
      })
    );
  }

  markAllAsRead(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return new Observable((observer) => {
        observer.error('User not authenticated');
      });
    }

    // We need to implement this endpoint on the backend
    return this.http
      .patch<any>(`${this.apiUrl}/mark-all-read`, { userId: currentUser.id })
      .pipe(
        tap(() => {
          // Update all reminders as read in our local subject
          const currentReminders = this.reminderSubject.value;
          const updatedReminders = currentReminders.map((reminder) => ({
            ...reminder,
            isRead: true,
          }));
          this.reminderSubject.next(updatedReminders);
        })
      );
  }

  deleteReminder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove the deleted reminder from the subject
        const currentReminders = this.reminderSubject.value;
        this.reminderSubject.next(
          currentReminders.filter((reminder) => reminder.id !== id)
        );
      })
    );
  }
}

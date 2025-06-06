import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
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
  private initialized = false;
  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe((user) => {
      if (user && !this.initialized) {
        this.initialized = true;
        this.getReminders().subscribe();
      } else if (!user) {
        this.initialized = false;
        this.reminderSubject.next([]);
      }
    });
  }
  public getReminders(): Observable<Reminder[]> {
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
          // Convert date strings to Date objects
          const processedReminders = reminders.map((r) => ({
            ...r,
            reminderDate: new Date(r.reminderDate),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          }));
          // Sort reminders by date (newest first) and read status (unread first)
          return processedReminders.sort((a, b) => {
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
        }),
        catchError((error) => {
          console.error('Error fetching reminders', error);
          return throwError(
            () => new Error('Failed to load reminders. Please try again later.')
          );
        })
      );
  }
  public getReminderById(id: string): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.apiUrl}/${id}`).pipe(
      map((r) => ({
        ...r,
        reminderDate: new Date(r.reminderDate),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })),
      catchError((error) => {
        console.error(`Error fetching reminder with ID: ${id}`, error);
        return throwError(
          () => new Error('Failed to load reminder. Please try again later.')
        );
      })
    );
  }

  public getUpcomingReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/upcoming`).pipe(
      map((reminders) =>
        reminders.map((r) => ({
          ...r,
          reminderDate: new Date(r.reminderDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }))
      ),
      catchError((error) => {
        console.error('Error fetching upcoming reminders', error);
        return throwError(
          () =>
            new Error(
              'Failed to load upcoming reminders. Please try again later.'
            )
        );
      })
    );
  }

  public getUnreadReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.apiUrl}/unread`).pipe(
      map((reminders) =>
        reminders.map((r) => ({
          ...r,
          reminderDate: new Date(r.reminderDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }))
      ),
      catchError((error) => {
        console.error('Error fetching unread reminders', error);
        return throwError(
          () =>
            new Error(
              'Failed to load unread reminders. Please try again later.'
            )
        );
      })
    );
  }
  public getUnreadRemindersCount(): Observable<number> {
    return this.getUnreadReminders().pipe(map((reminders) => reminders.length));
  }
  public getRemindersByAppointment(
    appointmentId: string
  ): Observable<Reminder[]> {
    return this.http
      .get<Reminder[]>(`${this.apiUrl}/appointment/${appointmentId}`)
      .pipe(
        map((reminders) =>
          reminders.map((r) => ({
            ...r,
            reminderDate: new Date(r.reminderDate),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          }))
        ),
        catchError((error) => {
          console.error(
            `Error fetching reminders for appointment ID: ${appointmentId}`,
            error
          );
          return throwError(
            () =>
              new Error(
                'Failed to load appointment reminders. Please try again later.'
              )
          );
        })
      );
  }
  public createReminder(reminder: CreateReminderDto): Observable<Reminder> {
    const reminderToSend = {
      ...reminder,
      reminderDate: new Date(reminder.reminderDate).toISOString(),
    };
    return this.http.post<Reminder>(this.apiUrl, reminderToSend).pipe(
      tap(() => {
        this.getReminders().subscribe();
      }),
      map((r) => ({
        ...r,
        reminderDate: new Date(r.reminderDate),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })),
      catchError((error) => {
        console.error('Error creating reminder', error);
        return throwError(
          () => new Error('Failed to create reminder. Please try again later.')
        );
      })
    );
  }
  public createCustomReminder(
    appointmentId: string,
    message: string,
    reminderDate: Date | string
  ): Observable<Reminder> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    // First verify that the appointment exists
    return this.http
      .get<any>(`${environment.apiUrl}/appointments/${appointmentId}`)
      .pipe(
        switchMap((_appointment) => {
          const reminderDto: CreateReminderDto = {
            userId: currentUser.id,
            appointmentId,
            title: 'Appointment Reminder',
            message,
            reminderDate, // Will be converted by createReminder
          };

          return this.createReminder(reminderDto);
        }),
        catchError((error) => {
          console.error(
            `Error: Appointment with ID ${appointmentId} not found`,
            error
          );
          return throwError(
            () => new Error(`Appointment with ID ${appointmentId} not found`)
          );
        })
      );
  }
  public markAsRead(id: string): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const currentReminders = this.reminderSubject.value;
        const updatedReminders = currentReminders.map((reminder) =>
          reminder.id === id
            ? { ...reminder, isRead: true, updatedAt: new Date() }
            : reminder
        );
        this.reminderSubject.next(updatedReminders);
      }),
      map((r) => ({
        ...r,
        reminderDate: new Date(r.reminderDate),
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })),
      catchError((error) => {
        console.error(`Error marking reminder ${id} as read`, error);
        return throwError(
          () =>
            new Error(
              'Failed to mark reminder as read. Please try again later.'
            )
        );
      })
    );
  }
  public markAllAsRead(): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http.patch<any>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        const currentReminders = this.reminderSubject.value;
        const updatedReminders = currentReminders.map((reminder) => ({
          ...reminder,
          isRead: true,
          updatedAt: new Date(),
        }));
        this.reminderSubject.next(updatedReminders);
      }),
      // No specific reminder object to map here, backend returns a count
      catchError((error) => {
        console.error('Error marking all reminders as read', error);
        return throwError(
          () =>
            new Error(
              'Failed to mark all reminders as read. Please try again later.'
            )
        );
      })
    );
  }
  public deleteReminder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentReminders = this.reminderSubject.value;
        this.reminderSubject.next(
          currentReminders.filter((reminder) => reminder.id !== id)
        );
      }),
      catchError((error) => {
        console.error(`Error deleting reminder ${id}`, error);
        return throwError(
          () => new Error('Failed to delete reminder. Please try again later.')
        );
      })
    );
  }
}

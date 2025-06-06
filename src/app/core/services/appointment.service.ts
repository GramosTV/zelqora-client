import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateAppointmentStatusDto,
} from '../models/appointment.model';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient, private authService: AuthService) {}
  public getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching all appointments', error);
        return throwError(
          () =>
            new Error('Failed to load appointments. Please try again later.')
        );
      })
    );
  }
  public getAppointmentsByUser(userId: string): Observable<Appointment[]> {
    const currentUser = this.authService.currentUserSubject.value;

    if (!currentUser) {
      return this.http.get<Appointment[]>(`${this.apiUrl}/user/${userId}`).pipe(
        catchError((error) => {
          console.error(
            `Error fetching appointments for user ${userId}`,
            error
          );
          return throwError(
            () =>
              new Error('Failed to load appointments. Please try again later.')
          );
        })
      );
    }
    if (currentUser.role === UserRole.DOCTOR) {
      return this.http
        .get<Appointment[]>(`${this.apiUrl}/doctor/${userId}`)
        .pipe(
          catchError((error) => {
            console.error(
              `Error fetching doctor appointments for ${userId}`,
              error
            );
            return throwError(
              () =>
                new Error(
                  'Failed to load appointments. Please try again later.'
                )
            );
          })
        );
    } else if (currentUser.role === UserRole.PATIENT) {
      return this.http
        .get<Appointment[]>(`${this.apiUrl}/patient/${userId}`)
        .pipe(
          catchError((error) => {
            console.error(
              `Error fetching patient appointments for ${userId}`,
              error
            );
            return throwError(
              () =>
                new Error(
                  'Failed to load appointments. Please try again later.'
                )
            );
          })
        );
    } else {
      return this.getAllAppointments();
    }
  }
  public getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching appointment with id ${id}`, error);
        return throwError(
          () =>
            new Error(
              'Failed to load appointment details. Please try again later.'
            )
        );
      })
    );
  }
  public createAppointment(
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const appointmentDto: CreateAppointmentDto = {
      title: appointment.title!,
      patientId: appointment.patientId!,
      doctorId: appointment.doctorId!,
      startTime: appointment.startTime!,
      endTime: appointment.endTime!,
      notes: appointment.notes,
      status:
        appointment.status !== undefined
          ? appointment.status
          : AppointmentStatus.PENDING,
    };

    return this.http.post<Appointment>(this.apiUrl, appointmentDto).pipe(
      catchError((error) => {
        console.error('Error creating appointment', error);
        return throwError(
          () =>
            new Error('Failed to create appointment. Please try again later.')
        );
      })
    );
  }
  public updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const updateDto: UpdateAppointmentDto = {};
    if (appointment.title !== undefined) updateDto.title = appointment.title;
    if (appointment.startTime !== undefined)
      updateDto.startTime = appointment.startTime;
    if (appointment.endTime !== undefined)
      updateDto.endTime = appointment.endTime;
    if (appointment.notes !== undefined) updateDto.notes = appointment.notes;
    if (appointment.status !== undefined) {
      updateDto.status = appointment.status;
    }

    return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, updateDto).pipe(
      catchError((error) => {
        console.error(`Error updating appointment with id ${id}`, error);
        return throwError(
          () =>
            new Error('Failed to update appointment. Please try again later.')
        );
      })
    );
  }

  public deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting appointment with id ${id}`, error);
        return throwError(
          () =>
            new Error('Failed to delete appointment. Please try again later.')
        );
      })
    );
  }
  public updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): Observable<Appointment> {
    const statusDto: UpdateAppointmentStatusDto = { status };
    return this.http
      .patch<Appointment>(`${this.apiUrl}/${id}/status`, statusDto)
      .pipe(
        catchError((error) => {
          console.error(
            `Error updating appointment status for id ${id}`,
            error
          );
          return throwError(
            () =>
              new Error(
                'Failed to update appointment status. Please try again later.'
              )
          );
        })
      );
  }
  private mapStatusToNumber(status?: AppointmentStatus): number {
    if (status === undefined) return 0;

    switch (status) {
      case AppointmentStatus.PENDING:
        return 0;
      case AppointmentStatus.CONFIRMED:
        return 1;
      case AppointmentStatus.CANCELLED:
        return 2;
      case AppointmentStatus.COMPLETED:
        return 3;
      default:
        const exhaustiveCheck: never = status;
        return exhaustiveCheck;
    }
  }

  public getUpcomingAppointments(): Observable<Appointment[]> {
    const params = new HttpParams().set('upcoming', 'true');
    return this.http.get<Appointment[]>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching upcoming appointments', error);
        return throwError(
          () =>
            new Error(
              'Failed to load upcoming appointments. Please try again later.'
            )
        );
      })
    );
  }

  public getTodaysAppointments(): Observable<Appointment[]> {
    const params = new HttpParams().set('today', 'true');
    return this.http.get<Appointment[]>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        console.error("Error fetching today's appointments", error);
        return throwError(
          () =>
            new Error(
              "Failed to load today's appointments. Please try again later."
            )
        );
      })
    );
  }
  public getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<Appointment[]>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        console.error(
          `Error fetching appointments between ${startDate} and ${endDate}`,
          error
        );
        return throwError(
          () =>
            new Error(
              'Failed to load appointments for the selected date range. Please try again later.'
            )
        );
      })
    );
  }
  private getApiStatusValue(status: AppointmentStatus): number {
    return Number(status);
  }
}

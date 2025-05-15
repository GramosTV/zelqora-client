import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient, private authService: AuthService) {}
  getAllAppointments(): Observable<Appointment[]> {
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
  getAppointmentsByUser(userId: string): Observable<Appointment[]> {
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

    // If user is a doctor, get appointments where they're the doctor
    // If user is a patient, get appointments where they're the patient
    // If user is an admin, get all appointments
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
  getAppointmentById(id: string): Observable<Appointment> {
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
  createAppointment(
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    // Create the appointmentDto object to match the API's expectation
    const appointmentDto = {
      title: appointment.title,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      notes: appointment.notes,
      status: this.mapStatusToNumber(appointment.status),
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
  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    // Create a DTO object for the API
    const updateDto: any = {
      title: appointment.title,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      notes: appointment.notes,
    };

    // Map the status if present
    if (appointment.status !== undefined) {
      updateDto.status = this.mapStatusToNumber(appointment.status);
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

  deleteAppointment(id: string): Observable<void> {
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
  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): Observable<Appointment> {
    return this.updateAppointment(id, { status });
  }

  // Helper method to map string status to numeric enum for backend
  private mapStatusToNumber(status?: AppointmentStatus): number {
    if (!status) return 0; // Default to Pending (0)

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
        return 0;
    }
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
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

  getTodaysAppointments(): Observable<Appointment[]> {
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

  getAppointmentsByDateRange(
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
}

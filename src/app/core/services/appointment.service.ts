import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Appointment[]>(this.apiUrl);
  }
  getAppointmentsByUser(userId: string): Observable<Appointment[]> {
    const currentUser = this.authService.currentUserSubject.value;

    if (!currentUser) {
      return this.http.get<Appointment[]>(`${this.apiUrl}/user/${userId}`);
    }

    // If user is a doctor, get appointments where they're the doctor
    // If user is a patient, get appointments where they're the patient
    // If user is an admin, get all appointments
    if (currentUser.role === UserRole.DOCTOR) {
      return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${userId}`);
    } else if (currentUser.role === UserRole.PATIENT) {
      return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${userId}`);
    } else {
      return this.getAllAppointments();
    }
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  createAppointment(
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, appointment);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): Observable<Appointment> {
    return this.updateAppointment(id, { status });
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
    const params = new HttpParams().set('upcoming', 'true');
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  getTodaysAppointments(): Observable<Appointment[]> {
    const params = new HttpParams().set('today', 'true');
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date
  ): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }
}

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Appointment, AppointmentStatus } from '../models/appointment.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  // Mock appointment data
  private appointments: Appointment[] = [
    {
      id: '1',
      title: 'Annual Checkup',
      patientId: '2',
      doctorId: '1',
      startTime: new Date('2025-05-15T09:00:00'),
      endTime: new Date('2025-05-15T09:30:00'),
      status: AppointmentStatus.CONFIRMED,
      notes: 'Regular annual checkup',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Follow-up Consultation',
      patientId: '2',
      doctorId: '1',
      startTime: new Date('2025-05-20T14:00:00'),
      endTime: new Date('2025-05-20T14:30:00'),
      status: AppointmentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(private authService: AuthService) {}

  getAllAppointments(): Observable<Appointment[]> {
    return of(this.appointments).pipe(delay(500));
  }

  getAppointmentsByUser(userId: string): Observable<Appointment[]> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return of([]);
    }

    let filteredAppointments: Appointment[];

    // Filter based on user role
    if (currentUser.role === 'doctor') {
      filteredAppointments = this.appointments.filter(
        (a) => a.doctorId === userId
      );
    } else if (currentUser.role === 'patient') {
      filteredAppointments = this.appointments.filter(
        (a) => a.patientId === userId
      );
    } else {
      // Admin can see all appointments
      filteredAppointments = this.appointments;
    }

    return of(filteredAppointments).pipe(delay(500));
  }

  getAppointmentById(id: string): Observable<Appointment | undefined> {
    const appointment = this.appointments.find((a) => a.id === id);
    return of(appointment).pipe(delay(500));
  }

  createAppointment(
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substring(2),
      title: appointment.title!,
      patientId: appointment.patientId!,
      doctorId: appointment.doctorId!,
      startTime: appointment.startTime!,
      endTime: appointment.endTime!,
      status: AppointmentStatus.PENDING,
      notes: appointment.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.push(newAppointment);
    return of(newAppointment).pipe(delay(500));
  }

  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const index = this.appointments.findIndex((a) => a.id === id);

    if (index !== -1) {
      this.appointments[index] = {
        ...this.appointments[index],
        ...appointment,
        updatedAt: new Date(),
      };
      return of(this.appointments[index]).pipe(delay(500));
    }

    throw new Error('Appointment not found');
  }

  deleteAppointment(id: string): Observable<boolean> {
    const index = this.appointments.findIndex((a) => a.id === id);

    if (index !== -1) {
      this.appointments.splice(index, 1);
      return of(true).pipe(delay(500));
    }

    return of(false).pipe(delay(500));
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus
  ): Observable<Appointment> {
    return this.updateAppointment(id, { status });
  }
}

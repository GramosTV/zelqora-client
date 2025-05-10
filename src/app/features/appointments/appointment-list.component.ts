import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Appointment,
  AppointmentStatus,
} from '../../core/models/appointment.model';
import { User, UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
  ],
  styles: [
    `
      .status-confirmed {
        background-color: #e3f2fd !important;
        color: #1976d2 !important;
      }
      .status-pending {
        background-color: #fff8e1 !important;
        color: #f57c00 !important;
      }
      .status-cancelled {
        background-color: #ffebee !important;
        color: #d32f2f !important;
      }
      .status-completed {
        background-color: #e8f5e9 !important;
        color: #388e3c !important;
      }
    `,
  ],
  template: `
    <div class="appointment-list">
      <header class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Appointments</h1>
          <p class="text-gray-600">Manage your appointments</p>
        </div>
        <div class="space-x-2">
          <button
            mat-stroked-button
            color="primary"
            routerLink="/appointments/reminders"
          >
            <mat-icon class="mr-1">notifications</mat-icon>
            Reminders
          </button>
          <button
            mat-stroked-button
            color="primary"
            routerLink="/appointments/calendar"
          >
            <mat-icon class="mr-1">calendar_today</mat-icon>
            Calendar
          </button>
          <button
            mat-raised-button
            color="primary"
            routerLink="/appointments/new"
          >
            <mat-icon class="mr-1">add</mat-icon>
            New Appointment
          </button>
        </div>
      </header>

      <mat-card>
        <mat-tab-group>
          <mat-tab label="Upcoming">
            <div class="p-4">
              <table
                mat-table
                [dataSource]="upcomingAppointments"
                class="w-full"
              >
                <!-- Title Column -->
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let appointment">
                    {{ appointment.title }}
                  </td>
                </ng-container>

                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                  <td mat-cell *matCellDef="let appointment">
                    <div>{{ appointment.startTime | date : 'MMM d, y' }}</div>
                    <div class="text-sm text-gray-600">
                      {{ appointment.startTime | date : 'h:mm a' }} -
                      {{ appointment.endTime | date : 'h:mm a' }}
                    </div>
                  </td>
                </ng-container>

                <!-- Patient/Doctor Column -->
                <ng-container matColumnDef="person">
                  <th mat-header-cell *matHeaderCellDef>
                    {{
                      currentUser?.role === UserRole.DOCTOR
                        ? 'Patient'
                        : 'Doctor'
                    }}
                  </th>
                  <td mat-cell *matCellDef="let appointment">
                    {{ getPersonName(appointment) }}
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let appointment">
                    <mat-chip-set>
                      <mat-chip
                        [color]="getStatusColor(appointment.status)"
                        selected
                      >
                        {{ appointment.status | titlecase }}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let appointment">
                    <button
                      mat-icon-button
                      color="primary"
                      [routerLink]="['/appointments', appointment.id]"
                      matTooltip="View Details"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button
                      *ngIf="appointment.status === AppointmentStatus.PENDING"
                      mat-icon-button
                      color="accent"
                      (click)="
                        updateStatus(
                          appointment.id,
                          AppointmentStatus.CONFIRMED
                        )
                      "
                      matTooltip="Confirm"
                    >
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button
                      *ngIf="appointment.status !== AppointmentStatus.CANCELLED"
                      mat-icon-button
                      color="warn"
                      (click)="
                        updateStatus(
                          appointment.id,
                          AppointmentStatus.CANCELLED
                        )
                      "
                      matTooltip="Cancel"
                    >
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>

              <div
                *ngIf="upcomingAppointments.length === 0"
                class="py-8 text-center text-gray-500"
              >
                <mat-icon class="text-5xl mb-2 opacity-30">event_busy</mat-icon>
                <p>No upcoming appointments</p>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Past">
            <div class="p-4">
              <table mat-table [dataSource]="pastAppointments" class="w-full">
                <!-- Title Column -->
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Title</th>
                  <td mat-cell *matCellDef="let appointment">
                    {{ appointment.title }}
                  </td>
                </ng-container>

                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                  <td mat-cell *matCellDef="let appointment">
                    <div>{{ appointment.startTime | date : 'MMM d, y' }}</div>
                    <div class="text-sm text-gray-600">
                      {{ appointment.startTime | date : 'h:mm a' }} -
                      {{ appointment.endTime | date : 'h:mm a' }}
                    </div>
                  </td>
                </ng-container>

                <!-- Patient/Doctor Column -->
                <ng-container matColumnDef="person">
                  <th mat-header-cell *matHeaderCellDef>
                    {{
                      currentUser?.role === UserRole.DOCTOR
                        ? 'Patient'
                        : 'Doctor'
                    }}
                  </th>
                  <td mat-cell *matCellDef="let appointment">
                    {{ getPersonName(appointment) }}
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let appointment">
                    <mat-chip-set>
                      <mat-chip
                        [color]="getStatusColor(appointment.status)"
                        selected
                      >
                        {{ appointment.status | titlecase }}
                      </mat-chip>
                    </mat-chip-set>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let appointment">
                    <button
                      mat-icon-button
                      color="primary"
                      [routerLink]="['/appointments', appointment.id]"
                      matTooltip="View Details"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>

              <div
                *ngIf="pastAppointments.length === 0"
                class="py-8 text-center text-gray-500"
              >
                <mat-icon class="text-5xl mb-2 opacity-30">history</mat-icon>
                <p>No past appointments</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  pastAppointments: Appointment[] = [];

  displayedColumns: string[] = ['title', 'date', 'person', 'status', 'actions'];

  currentUser: User | null = null;
  UserRole = UserRole;
  AppointmentStatus = AppointmentStatus;

  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAppointments();
  }
  loadAppointments(): void {
    if (!this.currentUser) return;

    this.appointmentService
      .getAppointmentsByUser(this.currentUser.id)
      .subscribe((appointments: Appointment[]) => {
        this.appointments = appointments;

        const now = new Date();

        // Split appointments into upcoming and past
        this.upcomingAppointments = appointments
          .filter((app: Appointment) => new Date(app.startTime) > now)
          .sort(
            (a: Appointment, b: Appointment) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

        this.pastAppointments = appointments
          .filter((app: Appointment) => new Date(app.startTime) <= now)
          .sort(
            (a: Appointment, b: Appointment) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
      });
  }

  getPersonName(appointment: Appointment): string {
    if (!this.currentUser) return '';

    // If current user is a doctor, show patient name
    if (this.currentUser.role === UserRole.DOCTOR) {
      return `Patient #${appointment.patientId}`;
    }

    // If current user is a patient, show doctor name
    return `Dr. #${appointment.doctorId}`;
  }
  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case AppointmentStatus.PENDING:
        return 'bg-amber-100 text-amber-800';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case AppointmentStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return '';
    }
  }
  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'primary'; // Blue
      case AppointmentStatus.PENDING:
        return 'accent'; // Amber/Orange
      case AppointmentStatus.CANCELLED:
        return 'warn'; // Red
      case AppointmentStatus.COMPLETED:
        return 'success'; // Green
      default:
        return '';
    }
  }

  updateStatus(appointmentId: string, status: AppointmentStatus): void {
    this.appointmentService
      .updateAppointmentStatus(appointmentId, status)
      .subscribe(() => {
        // Refresh appointments after status update
        this.loadAppointments();
      });
  }
}

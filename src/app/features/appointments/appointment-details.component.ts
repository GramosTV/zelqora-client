import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import {
  Appointment,
  AppointmentStatus,
} from '../../core/models/appointment.model';
import { User, UserRole } from '../../core/models/user.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  styleUrls: ['./appointment-status-colors.css'],
  template: `
    <div class="appointment-details" *ngIf="appointment">
      <header class="mb-6 flex justify-between items-start">
        <div>
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-800 mr-4">
              {{ appointment.title }}
            </h1>
            <mat-chip-set>
              <mat-chip class="status-{{ appointment.status }}">
                {{ appointment.status | titlecase }}
              </mat-chip>
            </mat-chip-set>
          </div>
          <p class="text-gray-600 mt-2">Appointment Details</p>
        </div>
        <div>
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button
              mat-menu-item
              routerLink="/appointments/edit/{{ appointment.id }}"
            >
              <mat-icon>edit</mat-icon>
              <span>Edit Appointment</span>
            </button>

            <button
              *ngIf="appointment.status === AppointmentStatus.PENDING"
              mat-menu-item
              (click)="updateStatus(AppointmentStatus.CONFIRMED)"
            >
              <mat-icon color="primary">check_circle</mat-icon>
              <span>Confirm</span>
            </button>

            <button
              *ngIf="
                appointment.status !== AppointmentStatus.COMPLETED &&
                appointment.status !== AppointmentStatus.CANCELLED
              "
              mat-menu-item
              (click)="updateStatus(AppointmentStatus.COMPLETED)"
            >
              <mat-icon color="accent">done_all</mat-icon>
              <span>Mark as Completed</span>
            </button>

            <button
              *ngIf="appointment.status !== AppointmentStatus.CANCELLED"
              mat-menu-item
              (click)="updateStatus(AppointmentStatus.CANCELLED)"
            >
              <mat-icon color="warn">cancel</mat-icon>
              <span>Cancel</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <mat-card class="md:col-span-2">
          <mat-card-header>
            <mat-card-title>Appointment Information</mat-card-title>
          </mat-card-header>
          <mat-card-content class="mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-medium text-gray-500">Date</h3>
                <p class="text-base">
                  {{ appointment.startTime | date : 'fullDate' }}
                </p>
              </div>

              <div>
                <h3 class="text-sm font-medium text-gray-500">Time</h3>
                <p class="text-base">
                  {{ appointment.startTime | date : 'shortTime' }} -
                  {{ appointment.endTime | date : 'shortTime' }}
                </p>
              </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <div *ngIf="appointment.notes" class="mt-4">
              <h3 class="text-sm font-medium text-gray-500">Notes</h3>
              <p class="text-base mt-2 whitespace-pre-line">
                {{ appointment.notes }}
              </p>
            </div>

            <div *ngIf="!appointment.notes" class="mt-4">
              <p class="text-gray-500 italic">
                No notes provided for this appointment
              </p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title
              >{{ isDoctor ? 'Patient' : 'Doctor' }} Details</mat-card-title
            >
          </mat-card-header>
          <mat-card-content class="mt-4">
            <div *ngIf="otherPerson; else loadingPerson" class="text-center">
              <div class="mb-4">
                <div
                  *ngIf="otherPerson.profilePicture; else defaultAvatar"
                  class="h-24 w-24 rounded-full bg-cover bg-center mx-auto"
                  [style.background-image]="
                    'url(' + otherPerson.profilePicture + ')'
                  "
                ></div>
                <ng-template #defaultAvatar>
                  <div
                    class="h-24 w-24 rounded-full bg-blue-200 flex items-center justify-center mx-auto"
                  >
                    <mat-icon class="text-5xl text-blue-800"
                      >account_circle</mat-icon
                    >
                  </div>
                </ng-template>
              </div>

              <h3 class="font-medium text-lg">
                {{ isDoctor ? '' : 'Dr.' }} {{ otherPerson.firstName }}
                {{ otherPerson.lastName }}
              </h3>

              <p
                *ngIf="!isDoctor && otherPerson.specialization"
                class="text-gray-600 mb-4"
              >
                {{ otherPerson.specialization }}
              </p>

              <div class="mt-4 space-y-2">
                <button
                  mat-stroked-button
                  color="primary"
                  routerLink="/messaging"
                  class="w-full"
                >
                  <mat-icon class="mr-2">mail</mat-icon>
                  Send Message
                </button>
              </div>
            </div>

            <ng-template #loadingPerson>
              <div class="text-center py-6">
                <p class="text-gray-500">Loading...</p>
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <div
      *ngIf="!appointment && !error"
      class="flex items-center justify-center h-64"
    >
      <mat-spinner></mat-spinner>
    </div>

    <mat-card *ngIf="error" class="mt-4 bg-red-50">
      <mat-card-content class="text-center py-6">
        <mat-icon class="text-red-500 text-4xl mb-2">error</mat-icon>
        <h3 class="text-lg font-medium text-red-800">Error</h3>
        <p class="text-red-600">{{ error }}</p>
        <button
          mat-raised-button
          color="primary"
          routerLink="/appointments"
          class="mt-4"
        >
          Back to Appointments
        </button>
      </mat-card-content>
    </mat-card>
  `,
})
export class AppointmentDetailsComponent implements OnInit {
  appointmentId: string | null = null;
  appointment: Appointment | null = null;
  currentUser: User | null = null;
  otherPerson: User | null = null;
  isDoctor = false;
  error: string | null = null;

  AppointmentStatus = AppointmentStatus;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isDoctor = this.currentUser?.role === UserRole.DOCTOR;

    this.route.paramMap.subscribe((params) => {
      this.appointmentId = params.get('id');
      if (this.appointmentId) {
        this.loadAppointment();
      }
    });
  }

  loadAppointment(): void {
    if (!this.appointmentId) return;

    this.appointmentService.getAppointmentById(this.appointmentId).subscribe({
      next: (appointment) => {
        if (!appointment) {
          this.error = 'Appointment not found';
          return;
        }

        this.appointment = appointment;

        // Load the other person (doctor or patient)
        this.loadOtherPerson();
      },
      error: (err) => {
        this.error = 'Failed to load appointment details';
        console.error(err);
      },
    });
  }

  loadOtherPerson(): void {
    if (!this.appointment || !this.currentUser) return;

    const otherId = this.isDoctor
      ? this.appointment.patientId
      : this.appointment.doctorId;

    this.userService.getUserById(otherId).subscribe({
      next: (user) => {
        this.otherPerson = user || null;
      },
      error: (err) => {
        console.error('Error loading user details', err);
      },
    });
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

  updateStatus(status: AppointmentStatus): void {
    if (!this.appointmentId) return;

    this.appointmentService
      .updateAppointmentStatus(this.appointmentId, status)
      .subscribe({
        next: (updatedAppointment) => {
          this.appointment = updatedAppointment;
        },
        error: (err) => {
          console.error('Error updating appointment status', err);
        },
      });
  }
}

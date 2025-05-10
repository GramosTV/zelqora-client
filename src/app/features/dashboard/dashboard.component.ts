import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { MessageService } from '../../core/services/message.service';
import { User, UserRole } from '../../core/models/user.model';
import {
  Appointment,
  AppointmentStatus,
} from '../../core/models/appointment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    RouterModule,
    DatePipe,
  ],
  template: `
    <div class="dashboard">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {{ currentUser?.firstName || 'User' }}!
        </h1>
        <p class="text-gray-600">{{ welcomeMessage }}</p>
      </header>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <mat-card class="bg-blue-50 border-t-4 border-blue-500">
          <mat-card-content>
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-full p-3 mr-4">
                <mat-icon class="text-blue-500">event</mat-icon>
              </div>
              <div>
                <div class="text-3xl font-bold">
                  {{ upcomingAppointments.length }}
                </div>
                <div class="text-sm text-gray-600">Upcoming Appointments</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="bg-green-50 border-t-4 border-green-500">
          <mat-card-content>
            <div class="flex items-center">
              <div class="bg-green-100 rounded-full p-3 mr-4">
                <mat-icon class="text-green-500">check_circle</mat-icon>
              </div>
              <div>
                <div class="text-3xl font-bold">
                  {{ completedAppointments.length }}
                </div>
                <div class="text-sm text-gray-600">Completed Appointments</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="bg-yellow-50 border-t-4 border-yellow-500">
          <mat-card-content>
            <div class="flex items-center">
              <div class="bg-yellow-100 rounded-full p-3 mr-4">
                <mat-icon class="text-yellow-500">schedule</mat-icon>
              </div>
              <div>
                <div class="text-3xl font-bold">
                  {{ pendingAppointments.length }}
                </div>
                <div class="text-sm text-gray-600">Pending Appointments</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="bg-purple-50 border-t-4 border-purple-500">
          <mat-card-content>
            <div class="flex items-center">
              <div class="bg-purple-100 rounded-full p-3 mr-4">
                <mat-icon class="text-purple-500">mail</mat-icon>
              </div>
              <div>
                <div class="text-3xl font-bold">{{ unreadMessages }}</div>
                <div class="text-sm text-gray-600">Unread Messages</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Upcoming Appointments -->
      <mat-card class="mb-8">
        <mat-card-header>
          <mat-card-title class="text-lg">Upcoming Appointments</mat-card-title>
        </mat-card-header>
        <mat-card-content class="px-4">
          <div
            *ngIf="upcomingAppointments.length === 0"
            class="py-8 text-center text-gray-500"
          >
            <mat-icon class="text-5xl mb-2 opacity-30">event_busy</mat-icon>
            <p>No upcoming appointments</p>
          </div>

          <div
            *ngFor="
              let appointment of upcomingAppointments.slice(0, 3);
              let last = last
            "
            class="py-4"
            [class.border-b]="!last"
          >
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-medium">{{ appointment.title }}</h3>
                <p class="text-sm text-gray-600">
                  {{ appointment.startTime | date : 'MMM d, y, h:mm a' }} -
                  {{ appointment.endTime | date : 'h:mm a' }}
                </p>
                <p
                  class="text-sm"
                  [ngClass]="{
                    'text-blue-600':
                      appointment.status === AppointmentStatus.CONFIRMED,
                    'text-yellow-600':
                      appointment.status === AppointmentStatus.PENDING
                  }"
                >
                  {{ appointment.status | titlecase }}
                </p>
              </div>
              <button
                mat-stroked-button
                color="primary"
                [routerLink]="['/appointments', appointment.id]"
              >
                View Details
              </button>
            </div>
          </div>

          <div *ngIf="upcomingAppointments.length > 3" class="mt-4 text-center">
            <a routerLink="/appointments" mat-button color="primary"
              >View All Appointments</a
            >
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick Actions -->
      <mat-card>
        <mat-card-header>
          <mat-card-title class="text-lg">Quick Actions</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
          >
            <button
              mat-raised-button
              color="primary"
              routerLink="/appointments/new"
              class="h-16"
            >
              <mat-icon class="mr-2">add</mat-icon>
              Book Appointment
            </button>

            <button
              mat-raised-button
              color="accent"
              routerLink="/messaging"
              class="h-16"
            >
              <mat-icon class="mr-2">mail</mat-icon>
              Messages
            </button>

            <button
              mat-raised-button
              color="warn"
              routerLink="/profile"
              class="h-16"
            >
              <mat-icon class="mr-2">person</mat-icon>
              Update Profile
            </button>

            <button
              *ngIf="isDoctor || isAdmin"
              mat-raised-button
              color="primary"
              routerLink="/appointments/calendar"
              class="h-16"
            >
              <mat-icon class="mr-2">calendar_today</mat-icon>
              View Calendar
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  welcomeMessage: string = '';
  upcomingAppointments: Appointment[] = [];
  completedAppointments: Appointment[] = [];
  pendingAppointments: Appointment[] = [];
  unreadMessages: number = 0;

  isDoctor: boolean = false;
  isPatient: boolean = false;
  isAdmin: boolean = false;

  AppointmentStatus = AppointmentStatus;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.isDoctor = this.currentUser.role === UserRole.DOCTOR;
      this.isPatient = this.currentUser.role === UserRole.PATIENT;
      this.isAdmin = this.currentUser.role === UserRole.ADMIN;

      // Set welcome message based on role
      this.setWelcomeMessage();

      // Load appointments
      this.loadAppointments();

      // Load unread messages count
      this.messageService
        .getUnreadMessages(this.currentUser.id)
        .subscribe((messages) => {
          this.unreadMessages = messages.length;
        });
    }
  }

  private setWelcomeMessage(): void {
    if (!this.currentUser) return;

    const currentTime = new Date().getHours();
    let greeting = 'Good morning';

    if (currentTime >= 12 && currentTime < 18) {
      greeting = 'Good afternoon';
    } else if (currentTime >= 18) {
      greeting = 'Good evening';
    }

    if (this.isDoctor) {
      this.welcomeMessage = `${greeting}, Dr. ${this.currentUser.lastName}. Here's your dashboard overview.`;
    } else if (this.isPatient) {
      this.welcomeMessage = `${greeting}, ${this.currentUser.firstName}. Welcome to your health dashboard.`;
    } else {
      this.welcomeMessage = `${greeting}, ${this.currentUser.firstName}. Here's the system overview.`;
    }
  }

  private loadAppointments(): void {
    if (!this.currentUser) return;

    this.appointmentService
      .getAppointmentsByUser(this.currentUser.id)
      .subscribe((appointments) => {
        const now = new Date();

        // Filter appointments by status
        this.upcomingAppointments = appointments.filter(
          (app) =>
            new Date(app.startTime) > now &&
            (app.status === AppointmentStatus.CONFIRMED ||
              app.status === AppointmentStatus.PENDING)
        );

        this.completedAppointments = appointments.filter(
          (app) => app.status === AppointmentStatus.COMPLETED
        );

        this.pendingAppointments = appointments.filter(
          (app) => app.status === AppointmentStatus.PENDING
        );

        // Sort upcoming appointments by date (nearest first)
        this.upcomingAppointments.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });
  }
}

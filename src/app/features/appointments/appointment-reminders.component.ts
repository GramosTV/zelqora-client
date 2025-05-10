import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import {
  ReminderService,
  Reminder,
} from '../../core/services/reminder.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-reminders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    RouterModule,
  ],
  template: `
    <div class="container mx-auto p-6">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold">Appointment Reminders</h2>
              <button
                mat-button
                color="primary"
                *ngIf="reminders.length > 0"
                (click)="markAllAsRead()"
              >
                <mat-icon class="mr-1">done_all</mat-icon>
                Mark all as read
              </button>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div
            *ngIf="reminders.length === 0"
            class="flex flex-col items-center justify-center p-8 text-gray-500"
          >
            <mat-icon style="font-size: 48px; height: 48px; width: 48px;"
              >notifications_off</mat-icon
            >
            <p class="mt-4">You have no reminders</p>
            <button
              mat-stroked-button
              color="primary"
              class="mt-4"
              routerLink="/appointments/calendar"
            >
              View Calendar
            </button>
          </div>

          <mat-list *ngIf="reminders.length > 0">
            <ng-container *ngFor="let reminder of reminders; let last = last">
              <mat-list-item
                class="py-2"
                [ngClass]="{ 'bg-blue-50': !reminder.isRead }"
              >
                <div class="flex w-full items-start">
                  <div class="flex-shrink-0 mr-4">
                    <mat-icon
                      [ngClass]="{
                        'text-amber-500': !reminder.isRead,
                        'text-gray-500': reminder.isRead
                      }"
                    >
                      notifications
                    </mat-icon>
                  </div>
                  <div class="flex-grow">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-semibold">
                          {{ reminder.message }}
                          <span
                            *ngIf="!reminder.isRead"
                            class="ml-2 text-xs bg-blue-500 text-white py-0.5 px-2 rounded-full"
                          >
                            New
                          </span>
                        </h3>
                        <p class="text-sm text-gray-600">
                          Reminder for: {{ getReminderDateFormatted(reminder) }}
                        </p>
                      </div>
                      <div class="flex">
                        <button
                          mat-icon-button
                          color="primary"
                          (click)="markAsRead(reminder.id)"
                          *ngIf="!reminder.isRead"
                        >
                          <mat-icon>check</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteReminder(reminder.id)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>

                    <div
                      *ngIf="
                        getAppointment(reminder.appointmentId) as appointment
                      "
                      class="mt-2"
                    >
                      <a
                        [routerLink]="['/appointments', appointment.id]"
                        class="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        <mat-icon class="text-sm mr-1">event</mat-icon>
                        View appointment details
                      </a>
                    </div>
                  </div>
                </div>
              </mat-list-item>
              <mat-divider *ngIf="!last"></mat-divider>
            </ng-container>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AppointmentRemindersComponent implements OnInit {
  reminders: Reminder[] = [];
  appointments: { [key: string]: Appointment } = {};

  constructor(
    private reminderService: ReminderService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    this.reminderService.getReminders().subscribe((reminders) => {
      this.reminders = reminders;

      // Load appointment details for each reminder
      const appointmentIds = [
        ...new Set(reminders.map((r) => r.appointmentId)),
      ];
      appointmentIds.forEach((id) => {
        this.appointmentService
          .getAppointmentById(id)
          .subscribe((appointment) => {
            if (appointment) {
              this.appointments[id] = appointment;
            }
          });
      });
    });
  }

  getAppointment(id: string): Appointment | undefined {
    return this.appointments[id];
  }

  getReminderDateFormatted(reminder: Reminder): string {
    const appointment = this.appointments[reminder.appointmentId];
    if (!appointment) return '';

    const date = new Date(appointment.startTime);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  markAsRead(id: string): void {
    this.reminderService.markAsRead(id).subscribe(() => {
      this.loadReminders();
    });
  }

  markAllAsRead(): void {
    this.reminderService.markAllAsRead().subscribe(() => {
      this.loadReminders();
    });
  }

  deleteReminder(id: string): void {
    this.reminderService.deleteReminder(id).subscribe(() => {
      this.loadReminders();
    });
  }
}

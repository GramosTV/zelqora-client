import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ReminderService,
  Reminder,
} from '../../core/services/reminder.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-reminders',
  standalone: true,  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatTabsModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule,
    RouterModule,
  ],
  styleUrls: ['./appointment-status-colors.css'],
  styles: [`
    .reminder-list .mat-mdc-list-item {
      height: auto;
      margin-bottom: 8px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    
    ::ng-deep .mat-mdc-list-item-unscoped-content {
      width: 100%;
      padding: 8px 0;
    }
  `],  template: `
    <div class="container mx-auto p-6">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Appointment Reminders</h1>
        <p class="text-gray-600">View and manage your upcoming appointment reminders</p>
      </header>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="flex justify-between items-center flex-wrap">
              <div class="flex items-center space-x-4">
                <!-- Filter dropdown -->
                <mat-form-field appearance="outline" class="w-36">
                  <mat-label>Filter by</mat-label>
                  <mat-select [(ngModel)]="selectedFilter" (selectionChange)="onFilterChange()">
                    <mat-option value="all">All Reminders</mat-option>
                    <mat-option value="unread">Unread Only</mat-option>
                    <mat-option value="upcoming">Upcoming Only</mat-option>
                  </mat-select>
                </mat-form-field>
                
                <!-- Sort dropdown -->
                <mat-form-field appearance="outline" class="w-36">
                  <mat-label>Sort by</mat-label>
                  <mat-select [(ngModel)]="selectedSort" (selectionChange)="onFilterChange()">
                    <mat-option value="newest">Newest First</mat-option>
                    <mat-option value="oldest">Oldest First</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div>
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
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Loading state -->
          <div
            *ngIf="isLoading"
            class="flex flex-col items-center justify-center p-8 text-gray-500"
          >
            <mat-icon
              style="font-size: 48px; height: 48px; width: 48px;"
              class="animate-pulse"
            >
              schedule
            </mat-icon>
            <p class="mt-4">Loading reminders...</p>
          </div>          <!-- Empty state -->
          <div
            *ngIf="!isLoading && reminders.length === 0"
            class="flex flex-col items-center justify-center p-8 text-gray-500"
          >
            <mat-icon style="font-size: 48px; height: 48px; width: 48px;"
              >notifications_off</mat-icon
            >
            <!-- Show different message based on filter -->
            <ng-container *ngIf="selectedFilter === 'all' && allReminders.length === 0">
              <p class="mt-4 text-lg">You have no reminders</p>
              <p class="text-sm text-center mt-2 max-w-md">
                Reminders will appear here when you have upcoming appointments. 
                Create a new appointment to get started.
              </p>
              <div class="flex space-x-4 mt-4">
                <button
                  mat-stroked-button
                  color="primary"
                  routerLink="/appointments/calendar"
                >
                  <mat-icon class="mr-1">calendar_today</mat-icon>
                  View Calendar
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
            </ng-container>
            
            <!-- No matches for filters -->
            <ng-container *ngIf="selectedFilter !== 'all' || (selectedFilter === 'all' && allReminders.length > 0)">
              <p class="mt-4 text-lg">No reminders match your filters</p>
              <p class="text-sm text-center mt-2">
                Try changing your filter settings to see more reminders.
              </p>
              <button
                mat-stroked-button
                color="primary"
                class="mt-4"
                (click)="selectedFilter = 'all'; onFilterChange()"
              >
                Show All Reminders ({{ allReminders.length }})
              </button>
            </ng-container>
          </div><mat-list *ngIf="!isLoading && reminders.length > 0" class="reminder-list">
            <ng-container *ngFor="let reminder of reminders; let last = last">
              <mat-list-item
                class="py-3"
                [ngClass]="{ 'bg-blue-50 border-l-4 border-blue-500': !reminder.isRead }"
              >
                <div class="flex w-full items-start">
                  <div class="flex-shrink-0 mr-4">
                    <mat-icon
                      [ngClass]="{
                        'text-blue-600': !reminder.isRead,
                        'text-gray-400': reminder.isRead
                      }"
                      [matTooltip]="reminder.isRead ? 'Read' : 'Unread'"
                    >
                      {{ reminder.isRead ? 'notifications_none' : 'notifications_active' }}
                    </mat-icon>
                  </div>
                  <div class="flex-grow">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-semibold" [ngClass]="{'text-blue-800': !reminder.isRead}">
                          {{ reminder.message }}
                          <span
                            *ngIf="!reminder.isRead"
                            class="ml-2 text-xs bg-blue-500 text-white py-0.5 px-2 rounded-full"
                          >
                            New
                          </span>
                        </h3>
                        <p class="text-sm text-gray-600 mt-1">
                          <mat-icon class="align-text-bottom text-xs mr-1">schedule</mat-icon>
                          {{ getReminderDateFormatted(reminder) }}
                        </p>
                      </div>
                      <div class="flex space-x-1">
                        <button
                          mat-icon-button
                          color="primary"
                          (click)="markAsRead(reminder.id)"
                          *ngIf="!reminder.isRead"
                          matTooltip="Mark as read"
                        >
                          <mat-icon>check_circle</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteReminder(reminder.id)"
                          matTooltip="Delete reminder"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>

                    <div
                      *ngIf="getAppointment(reminder.appointmentId) as appointment"
                      class="mt-3 flex flex-wrap items-center justify-between"
                    >
                      <div class="flex items-center">
                        <mat-chip-set>
                          <mat-chip [class]="getStatusClass(reminder.appointmentId)">
                            {{ appointment.status | titlecase }}
                          </mat-chip>
                        </mat-chip-set>
                        <span class="text-sm ml-2">{{ appointment.title }}</span>
                      </div>
                      <a
                        [routerLink]="['/appointments', appointment.id]"
                        class="text-sm text-blue-600 hover:underline flex items-center ml-auto"
                        matTooltip="View full appointment details"
                      >
                        <mat-icon class="text-sm mr-1">event</mat-icon>
                        View details
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
  allReminders: Reminder[] = []; // Store all reminders for filtering
  appointments: { [key: string]: Appointment } = {};
  isLoading: boolean = true;
  
  // Filter options
  selectedFilter: 'all' | 'unread' | 'upcoming' = 'all';
  selectedSort: 'newest' | 'oldest' = 'newest';
  
  // For easy access in template
  AppointmentStatus = AppointmentStatus;
  
  constructor(
    private reminderService: ReminderService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.loadReminders();

    // Subscribe to reminders observable to get real-time updates
    this.reminderService.reminders$.subscribe(() => {
      this.loadReminders();
    });
  }  loadReminders(): void {
    this.isLoading = true;
    this.reminderService.getReminders().subscribe((reminders) => {
      this.allReminders = reminders;
      
      // Apply filtering
      this.applyFilters();

      // Reset appointments cache when reloading
      this.appointments = {};

      // Load appointment details for each reminder
      const appointmentIds = [
        ...new Set(this.allReminders.map((r) => r.appointmentId)),
      ];

      if (appointmentIds.length === 0) {
        this.isLoading = false;
        return;
      }

      let loadedCount = 0;
      appointmentIds.forEach((id) => {
        this.appointmentService.getAppointmentById(id).subscribe({
          next: (appointment) => {
            if (appointment) {
              this.appointments[id] = appointment;
            }

            // Mark as loaded when all appointments are fetched
            loadedCount++;
            if (loadedCount === appointmentIds.length) {
              this.isLoading = false;
            }
          },
          error: () => {
            loadedCount++;
            if (loadedCount === appointmentIds.length) {
              this.isLoading = false;
            }
          },
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
  
  applyFilters(): void {
    let filteredReminders = [...this.allReminders];
    
    // Apply filter based on selected option
    switch(this.selectedFilter) {
      case 'unread':
        filteredReminders = filteredReminders.filter(r => !r.isRead);
        break;
      case 'upcoming':
        // Filter only upcoming reminders (reminder date is in the future)
        const now = new Date();
        filteredReminders = filteredReminders.filter(r => new Date(r.reminderDate) > now);
        break;
      case 'all':
      default:
        // No filtering needed
        break;
    }
    
    // Apply sorting
    filteredReminders.sort((a, b) => {
      const dateA = new Date(a.reminderDate).getTime();
      const dateB = new Date(b.reminderDate).getTime();
      
      if (this.selectedSort === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });
    
    this.reminders = filteredReminders;
  }
  
  // Method to handle filter change
  onFilterChange(): void {
    this.applyFilters();
  }
  
  // Method to get status class for appointment
  getStatusClass(appointmentId: string): string {
    const appointment = this.appointments[appointmentId];
    if (!appointment) return '';
    
    return 'status-' + appointment.status.toLowerCase();
  }
}

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { MessageService } from '../../core/services/message.service';
import { ReminderService } from '../../core/services/reminder.service';
import { Reminder } from '../../core/models/reminder.model';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/user.model';
import {
  Appointment,
  AppointmentStatus,
} from '../../core/models/appointment.model';
import { getAppointmentStatusString } from '../../core/utils/enum-helpers';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    RouterModule,
    DatePipe,
  ],
  styleUrls: ['../appointments/appointment-status-colors.css'],
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
            <a
              *ngIf="upcomingAppointments.length > 0"
              class="text-xs text-blue-600 hover:underline mt-2 block text-right"
              routerLink="/appointments"
            >
              View all →
            </a>
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
            <div class="text-xs text-green-600 mt-2 text-right">
              {{
                completedAppointments.length > 0 ? 'Good progress!' : 'None yet'
              }}
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="bg-amber-50 border-t-4 border-amber-500">
          <mat-card-content>
            <div class="flex items-center">
              <div class="bg-amber-100 rounded-full p-3 mr-4">
                <mat-icon class="text-amber-500">notifications</mat-icon>
              </div>
              <div>
                <div class="text-3xl font-bold">
                  {{ unreadReminders }}
                </div>
                <div class="text-sm text-gray-600">Unread Reminders</div>
              </div>
            </div>
            <a
              *ngIf="unreadReminders > 0"
              class="text-xs text-amber-600 hover:underline mt-2 block text-right"
              routerLink="/appointments/reminders"
            >
              View reminders →
            </a>
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
            <a
              *ngIf="unreadMessages > 0"
              class="text-xs text-purple-600 hover:underline mt-2 block text-right"
              routerLink="/messaging"
            >
              View messages →
            </a>
          </mat-card-content>
        </mat-card>
      </div>
      <!-- Main Content -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Upcoming Appointments -->
        <mat-card class="md:col-span-2">
          <mat-card-header>
            <mat-card-title class="text-lg"
              >Upcoming Appointments</mat-card-title
            >
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
                let last = last;
                trackBy: trackByAppointmentId
              "
              class="py-4 hover:bg-gray-50 transition-colors rounded px-2"
              [class.border-b]="!last"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="font-medium">{{ appointment.title }}</h3>
                    <mat-chip-set>
                      <mat-chip
                        [ngClass]="getStatusClass(appointment.status)"
                        matTooltip="Appointment status: {{
                          getAppointmentStatusString(appointment.status)
                        }}"
                      >
                        {{
                          getAppointmentStatusString(appointment.status)
                            | titlecase
                        }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>

                  <p class="text-sm text-gray-600 flex items-center mb-1">
                    <mat-icon
                      class="text-gray-400 mr-1"
                      style="font-size: 16px; height: 16px; width: 16px;"
                      >schedule</mat-icon
                    >
                    {{ appointment.startTime | date : 'MMM d, y, h:mm a' }} -
                    {{ appointment.endTime | date : 'h:mm a' }}
                  </p>
                  <div
                    class="flex items-center text-sm text-gray-600 mb-1"
                    *ngIf="isPatient && appointment.doctorId"
                  >
                    <mat-icon
                      class="text-gray-400 mr-1"
                      style="font-size: 16px; height: 16px; width: 16px;"
                      >person</mat-icon
                    >
                    <span>{{ getPersonName(appointment.doctorId, true) }}</span>
                  </div>

                  <div
                    class="flex items-center text-sm text-gray-600 mb-1"
                    *ngIf="isDoctor && appointment.patientId"
                  >
                    <mat-icon
                      class="text-gray-400 mr-1"
                      style="font-size: 16px; height: 16px; width: 16px;"
                      >person</mat-icon
                    >
                    <span>{{
                      getPersonName(appointment.patientId, false)
                    }}</span>
                  </div>

                  <div
                    *ngIf="appointment.notes"
                    class="mt-2 bg-gray-50 border-l-4 border-gray-200 p-2 rounded"
                  >
                    <p class="text-xs text-gray-600">
                      <mat-icon
                        class="text-gray-400 mr-1 align-middle"
                        style="font-size: 14px; height: 14px; width: 14px;"
                        >note</mat-icon
                      >
                      {{ appointment.notes }}
                    </p>
                  </div>
                </div>

                <div class="ml-4 flex flex-col gap-2">
                  <button
                    mat-stroked-button
                    color="primary"
                    [routerLink]="['/appointments', appointment.id]"
                    matTooltip="View full appointment details"
                  >
                    <mat-icon class="text-sm mr-1">visibility</mat-icon>
                    View
                  </button>

                  <button
                    *ngIf="appointment.status === AppointmentStatus.PENDING"
                    mat-stroked-button
                    color="accent"
                    [routerLink]="['/appointments', appointment.id]"
                    matTooltip="Confirm this appointment"
                  >
                    <mat-icon class="text-sm mr-1">check_circle</mat-icon>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
            <div
              *ngIf="upcomingAppointments.length > 3"
              class="mt-4 text-center"
            >
              <a routerLink="/appointments" mat-button color="primary"
                >View All Appointments</a
              >
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Reminders Column -->
        <mat-card>
          <mat-card-header>
            <mat-card-title class="text-lg">Reminders</mat-card-title>
            <div class="flex-grow"></div>
            <button
              mat-icon-button
              color="primary"
              (click)="loadReminders()"
              matTooltip="Refresh reminders"
              class="mr-2"
            >
              <mat-icon>refresh</mat-icon>
            </button>
            <a
              mat-icon-button
              color="primary"
              routerLink="/appointments/reminders"
              matTooltip="View all reminders"
            >
              <mat-icon>launch</mat-icon>
            </a>
          </mat-card-header>
          <mat-card-content class="px-4">
            <div
              *ngIf="upcomingReminders.length === 0"
              class="py-6 text-center text-gray-500"
            >
              <mat-icon class="text-4xl mb-2 opacity-30"
                >notifications_off</mat-icon
              >
              <p>No upcoming reminders</p>
              <button
                mat-flat-button
                color="primary"
                class="mt-3"
                (click)="createTestReminder(); loadReminders()"
              >
                <mat-icon class="mr-1">add_alert</mat-icon>
                Create test reminder
              </button>
              <a
                class="text-xs text-blue-600 hover:underline mt-4 inline-block"
                routerLink="/appointments/reminders"
              >
                View all reminders →
              </a>
            </div>
            <div
              *ngFor="
                let reminder of upcomingReminders;
                trackBy: trackByReminderId
              "
              class="py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded px-2 transition-colors"
              [ngClass]="{ 'bg-blue-50': !reminder.isRead }"
            >
              <div class="flex items-start">
                <mat-icon
                  [matTooltip]="
                    reminder.isRead ? 'Read reminder' : 'Unread reminder'
                  "
                  [ngClass]="{
                    'text-blue-600': !reminder.isRead,
                    'text-gray-400': reminder.isRead
                  }"
                  class="mr-2"
                >
                  {{
                    reminder.isRead
                      ? 'notifications_none'
                      : 'notifications_active'
                  }}
                </mat-icon>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <p
                      [ngClass]="{ 'font-medium': !reminder.isRead }"
                      class="text-sm"
                    >
                      {{ reminder.message }}
                    </p>
                    <mat-icon
                      *ngIf="!reminder.isRead"
                      class="text-blue-500 text-xs ml-2"
                      >fiber_new</mat-icon
                    >
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ getRelativeDate(reminder.reminderDate) }} at
                    {{ reminder.reminderDate | date : 'shortTime' }}
                  </p>
                  <div *ngIf="reminder.appointmentId" class="mt-2">
                    <a
                      mat-button
                      color="primary"
                      class="text-xs py-0 px-2 h-6"
                      [routerLink]="['/appointments', reminder.appointmentId]"
                      matTooltip="View the appointment details"
                    >
                      <mat-icon class="text-sm mr-1">visibility</mat-icon>
                      View appointment
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="mt-4 flex justify-center"
              *ngIf="upcomingReminders.length > 0"
            >
              <button
                *ngIf="unreadReminders > 0"
                mat-stroked-button
                color="primary"
                class="mr-2"
                routerLink="/appointments/reminders"
              >
                View {{ unreadReminders }} Unread Reminder{{
                  unreadReminders === 1 ? '' : 's'
                }}
              </button>

              <button
                mat-button
                color="basic"
                routerLink="/appointments/reminders"
              >
                All Reminders
                <mat-icon class="ml-1">chevron_right</mat-icon>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
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
              class="h-16 flex flex-col items-center justify-center"
            >
              <mat-icon>add_circle</mat-icon>
              <span class="mt-1">New Appointment</span>
            </button>

            <button
              mat-raised-button
              color="accent"
              routerLink="/appointments/calendar"
              class="h-16 flex flex-col items-center justify-center"
            >
              <mat-icon>calendar_today</mat-icon>
              <span class="mt-1">Calendar View</span>
            </button>
            <button
              mat-raised-button
              routerLink="/messaging"
              class="h-16 flex flex-col items-center justify-center"
              [ngClass]="{
                'bg-purple-100 text-purple-800': unreadMessages === 0,
                'bg-purple-600 text-white': unreadMessages > 0
              }"
              [matBadge]="unreadMessages > 0 ? unreadMessages.toString() : ''"
              [matBadgeHidden]="unreadMessages === 0"
              matBadgePosition="above after"
              matBadgeColor="accent"
            >
              <mat-icon>mail</mat-icon>
              <span class="mt-1">Messages</span>
            </button>
            <button
              mat-raised-button
              routerLink="/appointments/reminders"
              class="h-16 flex flex-col items-center justify-center"
              [ngClass]="{
                'bg-amber-100 text-amber-800': unreadReminders === 0,
                'bg-amber-600 text-white': unreadReminders > 0
              }"
              [matBadge]="unreadReminders > 0 ? unreadReminders.toString() : ''"
              [matBadgeHidden]="unreadReminders === 0"
              matBadgePosition="above after"
              matBadgeColor="warn"
            >
              <mat-icon>notifications</mat-icon>
              <span class="mt-1">Reminders</span>
            </button>

            <button
              *ngIf="isAdmin"
              mat-raised-button
              color="primary"
              routerLink="/admin/users"
              class="h-16 flex flex-col items-center justify-center"
            >
              <mat-icon>admin_panel_settings</mat-icon>
              <span class="mt-1">Admin Panel</span>
            </button>

            <button
              mat-raised-button
              color="primary"
              routerLink="/profile"
              class="h-16 flex flex-col items-center justify-center bg-blue-50 text-blue-800"
            >
              <mat-icon>person</mat-icon>
              <span class="mt-1">My Profile</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  public currentUser: User | null = null;
  public welcomeMessage: string = '';
  public upcomingAppointments: Appointment[] = [];
  public completedAppointments: Appointment[] = [];
  public pendingAppointments: Appointment[] = [];
  public cancelledAppointments: Appointment[] = [];
  public unreadMessages: number = 0;
  public unreadReminders: number = 0;
  public upcomingReminders: Reminder[] = [];

  public isDoctor: boolean = false;
  public isPatient: boolean = false;
  public isAdmin: boolean = false;
  private readonly destroy$ = new Subject<void>();

  public readonly AppointmentStatus = AppointmentStatus;
  public readonly getAppointmentStatusString = getAppointmentStatusString;

  constructor(
    private readonly authService: AuthService,
    private readonly appointmentService: AppointmentService,
    private readonly messageService: MessageService,
    private readonly reminderService: ReminderService,
    private readonly userService: UserService,
    private readonly cdr: ChangeDetectorRef
  ) {}
  public ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.isDoctor = this.currentUser.role === UserRole.DOCTOR;
      this.isPatient = this.currentUser.role === UserRole.PATIENT;
      this.isAdmin = this.currentUser.role === UserRole.ADMIN;
      this.setWelcomeMessage();
      this.loadAppointments();

      this.messageService
        .getUnreadMessages(this.currentUser.id)
        .pipe(take(1), takeUntil(this.destroy$))
        .subscribe((messages) => {
          this.unreadMessages = messages.length;
          this.cdr.markForCheck();
        });

      if (this.upcomingReminders.length === 0) {
        this.createTestReminder();
      }

      this.loadReminders();

      this.reminderService.reminders$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (reminders) => {
          this.unreadReminders = reminders.filter((r) => !r.isRead).length;

          const now = new Date();
          const oneWeekLater = new Date();
          oneWeekLater.setDate(now.getDate() + 7);

          this.upcomingReminders = reminders
            .map((reminder) => ({
              ...reminder,
              reminderDate:
                reminder.reminderDate instanceof Date
                  ? reminder.reminderDate
                  : new Date(reminder.reminderDate),
            }))
            .filter((r) => {
              const reminderTime = r.reminderDate.getTime();
              return (
                reminderTime >= now.getTime() &&
                reminderTime <= oneWeekLater.getTime()
              );
            })
            .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
            .slice(0, 3); // Take only the 3 most imminent reminders

          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error from reminders$ observable:', err),
      });
    }
  }
  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointments) => {
          const now = new Date();
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

          this.cancelledAppointments = appointments.filter(
            (app) => app.status === AppointmentStatus.CANCELLED
          );
          this.upcomingAppointments.sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading appointments:', err);
        },
      });
  }
  public loadReminders(): void {
    if (!this.currentUser) return;

    this.reminderService
      .getUnreadRemindersCount()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.unreadReminders = count;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading unread reminders count:', err);
          this.unreadReminders = 0;
        },
      });
    this.reminderService
      .getReminders()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (reminders) => {
          console.log('Reminders received:', reminders);

          if (reminders.length === 0) {
            console.log('No reminders received, creating test reminder');
            this.createTestReminder();
            return;
          }
          const now = new Date();
          const oneWeekLater = new Date();
          oneWeekLater.setDate(now.getDate() + 7);

          this.upcomingReminders = reminders
            .map((reminder) => ({
              ...reminder,
              reminderDate:
                reminder.reminderDate instanceof Date
                  ? reminder.reminderDate
                  : new Date(reminder.reminderDate),
            }))
            .filter((r) => {
              const reminderTime = r.reminderDate.getTime();
              return (
                reminderTime >= now.getTime() &&
                reminderTime <= oneWeekLater.getTime()
              );
            })
            .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
            .slice(0, 3); // Take only the 3 most imminent reminders

          console.log(
            'Upcoming reminders after filtering:',
            this.upcomingReminders
          );

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading reminders:', err);
          this.upcomingReminders = [];
        },
      });
  }
  public createTestReminder(): void {
    if (!this.currentUser) return;
    this.appointmentService.getUpcomingAppointments().subscribe({
      next: (appointments) => {
        if (appointments && appointments.length > 0) {
          const now = new Date();
          const reminderDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

          this.reminderService
            .createCustomReminder(
              appointments[0].id,
              'Reminder for your upcoming appointment today',
              reminderDate
            )
            .subscribe();
          if (appointments.length > 1) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);

            this.reminderService
              .createCustomReminder(
                appointments[1].id,
                'Upcoming follow-up consultation tomorrow',
                tomorrow
              )
              .subscribe();
          }
        }
      },
      error: (err) => {
        console.error('Error loading appointments for reminders:', err);
      },
    });
  }

  // TrackBy functions for better performance
  public trackByAppointmentId(index: number, appointment: Appointment): string {
    return appointment.id;
  }

  public trackByReminderId(index: number, reminder: Reminder): string {
    return reminder.id;
  }

  // Helper method to format date relative to today
  public getRelativeDate(date: Date | string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    if (dateToCheck.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateToCheck.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (dateToCheck.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (
      dateToCheck > today &&
      dateToCheck < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    ) {
      return dateToCheck.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return dateToCheck.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year:
          dateToCheck.getFullYear() !== today.getFullYear()
            ? 'numeric'
            : undefined,
      });
    }
  }

  // Helper method to get formatted name for a doctor or patient
  public getPersonName(personId: string, isDoctor: boolean): string {
    if (!personId) return 'Unknown';

    // In a real application, this would use a cache or state management
    // to avoid multiple API calls for the same user
    // For now, return a simplified display name to avoid subscription issues in template
    return isDoctor
      ? `Dr. ${personId.substring(0, 8)}...`
      : `Patient ${personId.substring(0, 8)}...`;
  }

  public getStatusClass(status: AppointmentStatus): string {
    if (status === undefined || status === null) return '';
    return `status-${getAppointmentStatusString(status).toLowerCase()}`;
  }
}

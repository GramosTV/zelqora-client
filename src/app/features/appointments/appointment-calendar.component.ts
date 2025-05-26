import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { User, UserRole } from '../../core/models/user.model';
import {
  Appointment,
  AppointmentStatus,
} from '../../core/models/appointment.model';
import { getAppointmentStatusString } from '../../core/utils/enum-helpers';

// Import FullCalendar core and plugins
import {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
  EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FullCalendarModule,
  ],
  styleUrls: ['./appointment-status-colors.css'],
  template: `
    <div class="appointment-calendar">
      <header class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">
            Appointment Calendar
          </h1>
          <p class="text-gray-600">View and manage your appointments</p>
        </div>
        <button
          mat-raised-button
          color="primary"
          routerLink="/appointments/new"
        >
          <mat-icon class="mr-1">add</mat-icon>
          New Appointment
        </button>
      </header>

      <mat-card>
        <mat-card-content>
          <full-calendar [options]="calendarOptions"></full-calendar>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ::ng-deep .fc .fc-button-primary {
        background-color: #1976d2;
        border-color: #1976d2;
      }

      ::ng-deep .fc .fc-button-primary:disabled {
        background-color: rgba(25, 118, 210, 0.7);
        border-color: rgba(25, 118, 210, 0.7);
      }

      ::ng-deep .fc .fc-button-primary:hover {
        background-color: #1565c0;
        border-color: #1565c0;
      }

      ::ng-deep .fc-event {
        cursor: pointer;
        border-radius: 4px;
        font-size: 0.85em;
        padding: 3px;
      }

      ::ng-deep .fc-event-title {
        font-weight: 500;
      }

      ::ng-deep .fc-today-button {
        text-transform: capitalize;
      }

      ::ng-deep .fc-col-header-cell {
        background-color: #f5f5f5;
        font-weight: 500;
      }
      ::ng-deep .fc-event.status-confirmed {
        background-color: #e3f2fd !important;
        border-color: #bbdefb !important;
        color: #1976d2 !important;
      }

      ::ng-deep .fc-event.status-pending {
        background-color: #fff8e1 !important;
        border-color: #ffe082 !important;
        color: #f57c00 !important;
      }

      ::ng-deep .fc-event.status-cancelled {
        background-color: #ffebee !important;
        border-color: #ffcdd2 !important;
        color: #d32f2f !important;
        text-decoration: line-through;
      }

      ::ng-deep .fc-event.status-completed {
        background-color: #e8f5e9 !important;
        border-color: #c8e6c9 !important;
        color: #388e3c !important;
      }
    `,
  ],
})
export class AppointmentCalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  currentUser: User | null = null;
  appointments: Appointment[] = [];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    weekends: true,
    editable: true, // Allow events to be edited
    selectable: true, // Allow date selection for new appointments
    selectMirror: true,
    dayMaxEvents: true,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    eventClassNames: this.handleEventClassNames.bind(this),
    select: this.handleDateSelect.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    eventDidMount: this.handleEventDidMount.bind(this),
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
      startTime: '09:00',
      endTime: '17:00',
    },
    slotMinTime: '08:00',
    slotMaxTime: '19:00',
  };
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadAppointments();
  }

  loadAppointments(): void {
    if (!this.currentUser) return;

    this.appointmentService
      .getAppointmentsByUser(this.currentUser.id)
      .subscribe((appointments) => {
        this.appointments = appointments; // Format appointments for the calendar
        const events = this.appointments.map((appointment) => {
          return {
            id: appointment.id,
            title: this.formatEventTitle(appointment),
            start: new Date(appointment.startTime),
            end: new Date(appointment.endTime),
            extendedProps: {
              status: appointment.status,
              patientId: appointment.patientId,
              doctorId: appointment.doctorId,
              notes: appointment.notes,
              originalTitle: appointment.title,
            },
          };
        });

        this.calendarOptions.events = events;
      });
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const appointmentId = clickInfo.event.id;
    this.router.navigate(['/appointments', appointmentId]);
  }
  handleEventClassNames(arg: any): string[] {
    const status = arg.event.extendedProps.status as AppointmentStatus;
    return [`status-${getAppointmentStatusString(status).toLowerCase()}`];
  }

  /**
   * Format the event display to show additional details
   */
  private formatEventTitle(appointment: Appointment): string {
    const statusString = getAppointmentStatusString(appointment.status);
    const time = new Date(appointment.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `[${statusString.charAt(0).toUpperCase()}] ${time} - ${
      appointment.title
    }`;
  }

  /**
   * Handle when user selects a date range to create a new appointment
   */
  handleDateSelect(selectInfo: DateSelectArg): void {
    // Check if the user is authorized to create appointments
    if (!this.currentUser) {
      this.snackBar.open(
        'You must be logged in to create appointments',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    // Navigate to the appointment creation page with pre-filled date and time
    this.router.navigate(['/appointments/new'], {
      queryParams: {
        start: selectInfo.startStr,
        end: selectInfo.endStr,
      },
    });
  }

  /**
   * Handle when an event is dragged and dropped to a new time
   */
  handleEventDrop(dropInfo: EventDropArg): void {
    const appointmentId = dropInfo.event.id;
    const newStartTime = dropInfo.event.start;
    const newEndTime = dropInfo.event.end;

    if (!newStartTime || !newEndTime) {
      dropInfo.revert();
      return;
    }

    this.appointmentService
      .updateAppointment(appointmentId, {
        startTime: newStartTime,
        endTime: newEndTime,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Appointment time updated successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error updating appointment time', error);
          this.snackBar.open('Failed to update appointment time', 'Close', {
            duration: 3000,
          });
          dropInfo.revert();
        },
      });
  }
  /**
   * Handle when an event is resized to change its duration
   */ handleEventResize(resizeInfo: any): void {
    const appointmentId = resizeInfo.event.id;
    const newEndTime = resizeInfo.event.end;

    if (!newEndTime) {
      resizeInfo.revert();
      return;
    }

    this.appointmentService
      .updateAppointment(appointmentId, {
        endTime: newEndTime,
      })
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Appointment duration updated successfully',
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          console.error('Error updating appointment duration', error);
          this.snackBar.open('Failed to update appointment duration', 'Close', {
            duration: 3000,
          });
          resizeInfo.revert();
        },
      });
  }

  /**
   * Add a tooltip to each event when they are rendered
   */
  handleEventDidMount(info: any): void {
    const event = info.event;
    const status = event.extendedProps.status as AppointmentStatus;
    const originalTitle = event.extendedProps.originalTitle;
    const startTime = event.start?.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = event.end?.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'appointment-tooltip';
    tooltip.innerHTML = `
      <strong>${originalTitle}</strong><br>
      <span>Time: ${startTime} - ${endTime}</span><br>
      <span>Status: ${getAppointmentStatusString(status)}</span>
    `;
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '10000';
    tooltip.style.backgroundColor = 'white';
    tooltip.style.padding = '8px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    tooltip.style.display = 'none';

    // Append tooltip to body
    document.body.appendChild(tooltip);

    // Show tooltip on mouseover
    info.el.addEventListener('mouseover', (e: MouseEvent) => {
      tooltip.style.display = 'block';
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
    });

    // Move tooltip with cursor
    info.el.addEventListener('mousemove', (e: MouseEvent) => {
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
    });

    // Hide tooltip on mouseout
    info.el.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });

    // Clean up tooltip when event is removed
    info.el.addEventListener('remove', () => {
      document.body.removeChild(tooltip);
    });
  }
}

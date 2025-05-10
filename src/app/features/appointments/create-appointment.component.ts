import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AppointmentService } from '../../core/services/appointment.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ReminderService } from '../../core/services/reminder.service';
import { User, UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-create-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="create-appointment">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">
          Book an Appointment
        </h1>
        <p class="text-gray-600">
          Fill out the form below to schedule a new appointment
        </p>
      </header>

      <mat-card>
        <mat-card-content>
          <form
            [formGroup]="appointmentForm"
            (ngSubmit)="onSubmit()"
            class="py-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Title -->
              <mat-form-field class="w-full md:col-span-2">
                <mat-label>Appointment Title</mat-label>
                <input
                  matInput
                  formControlName="title"
                  placeholder="E.g., Annual Checkup"
                />
                <mat-error
                  *ngIf="appointmentForm.get('title')?.hasError('required')"
                >
                  Title is required
                </mat-error>
              </mat-form-field>

              <!-- Doctor Selection (for patients) -->
              <mat-form-field *ngIf="isPatient" class="w-full md:col-span-2">
                <mat-label>Select Doctor</mat-label>
                <mat-select formControlName="doctorId">
                  <mat-option
                    *ngFor="let doctor of doctors"
                    [value]="doctor.id"
                  >
                    Dr. {{ doctor.firstName }} {{ doctor.lastName }} -
                    {{ doctor.specialization }}
                  </mat-option>
                </mat-select>
                <mat-error
                  *ngIf="appointmentForm.get('doctorId')?.hasError('required')"
                >
                  Doctor selection is required
                </mat-error>
              </mat-form-field>

              <!-- Date -->
              <mat-form-field>
                <mat-label>Date</mat-label>
                <input
                  matInput
                  [matDatepicker]="picker"
                  formControlName="date"
                  [min]="minDate"
                />
                <mat-datepicker-toggle
                  matSuffix
                  [for]="picker"
                ></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error
                  *ngIf="appointmentForm.get('date')?.hasError('required')"
                >
                  Date is required
                </mat-error>
              </mat-form-field>

              <!-- Time -->
              <div class="grid grid-cols-2 gap-4">
                <mat-form-field>
                  <mat-label>Start Time</mat-label>
                  <mat-select formControlName="startTime">
                    <mat-option
                      *ngFor="let time of availableTimeSlots"
                      [value]="time.value"
                    >
                      {{ time.display }}
                    </mat-option>
                  </mat-select>
                  <mat-error
                    *ngIf="
                      appointmentForm.get('startTime')?.hasError('required')
                    "
                  >
                    Start time is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>End Time</mat-label>
                  <mat-select formControlName="endTime">
                    <mat-option
                      *ngFor="let time of availableTimeSlots"
                      [value]="time.value"
                      [disabled]="isEndTimeInvalid(time.value)"
                    >
                      {{ time.display }}
                    </mat-option>
                  </mat-select>
                  <mat-error
                    *ngIf="appointmentForm.get('endTime')?.hasError('required')"
                  >
                    End time is required
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Notes -->
              <mat-form-field class="w-full md:col-span-2">
                <mat-label>Notes</mat-label>
                <textarea
                  matInput
                  formControlName="notes"
                  rows="4"
                  placeholder="Additional information about your appointment"
                ></textarea>
              </mat-form-field>

              <!-- Reminder Option -->
              <div class="w-full md:col-span-2 flex items-center">
                <mat-checkbox formControlName="createReminder" color="primary">
                  Create a reminder for this appointment
                </mat-checkbox>
              </div>
            </div>

            <div class="flex justify-end gap-4 mt-6">
              <button mat-button type="button" routerLink="/appointments">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="appointmentForm.invalid || isSubmitting"
              >
                <span *ngIf="!isSubmitting">Book Appointment</span>
                <span *ngIf="isSubmitting" class="flex items-center">
                  <mat-icon class="animate-spin mr-2">sync</mat-icon>
                  Creating...
                </span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class CreateAppointmentComponent implements OnInit {
  appointmentForm!: FormGroup;
  currentUser: User | null = null;
  doctors: User[] = [];
  isPatient = false;
  minDate = new Date();
  isSubmitting = false;

  // Prefilled dates from calendar (if available)
  preselectedStartDate: Date | null = null;
  preselectedEndDate: Date | null = null;

  availableTimeSlots = [
    { value: '09:00', display: '9:00 AM' },
    { value: '09:30', display: '9:30 AM' },
    { value: '10:00', display: '10:00 AM' },
    { value: '10:30', display: '10:30 AM' },
    { value: '11:00', display: '11:00 AM' },
    { value: '11:30', display: '11:30 AM' },
    { value: '12:00', display: '12:00 PM' },
    { value: '12:30', display: '12:30 PM' },
    { value: '13:00', display: '1:00 PM' },
    { value: '13:30', display: '1:30 PM' },
    { value: '14:00', display: '2:00 PM' },
    { value: '14:30', display: '2:30 PM' },
    { value: '15:00', display: '3:00 PM' },
    { value: '15:30', display: '3:30 PM' },
    { value: '16:00', display: '4:00 PM' },
    { value: '16:30', display: '4:30 PM' },
  ];

  // Use dependency injection
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private reminderService = inject(ReminderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isPatient = this.currentUser?.role === UserRole.PATIENT;

    // Check for pre-selected date and time from calendar
    this.route.queryParams.subscribe((params) => {
      if (params['start'] && params['end']) {
        this.preselectedStartDate = new Date(params['start']);
        this.preselectedEndDate = new Date(params['end']);
      }
    });

    // Initialize form
    this.initForm();

    // Load doctors for selection (if user is a patient)
    if (this.isPatient) {
      this.userService.getDoctors().subscribe((doctors) => {
        this.doctors = doctors;
      });
    }
  }
  initForm(): void {
    // Set default values from calendar if they exist
    const currentDate = new Date();
    let defaultDate = '';
    let defaultStartTime = '';
    let defaultEndTime = '';

    if (this.preselectedStartDate && this.preselectedEndDate) {
      defaultDate = this.preselectedStartDate.toISOString().split('T')[0];

      const startHours = this.preselectedStartDate.getHours();
      const startMinutes = this.preselectedStartDate.getMinutes();
      defaultStartTime = `${startHours
        .toString()
        .padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;

      const endHours = this.preselectedEndDate.getHours();
      const endMinutes = this.preselectedEndDate.getMinutes();
      defaultEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes
        .toString()
        .padStart(2, '0')}`;
    }

    this.appointmentForm = this.fb.group({
      title: ['', Validators.required],
      doctorId: ['', this.isPatient ? Validators.required : null],
      date: [defaultDate || '', Validators.required],
      startTime: [defaultStartTime || '', Validators.required],
      endTime: [defaultEndTime || '', Validators.required],
      notes: [''],
      createReminder: [true], // Option to create a reminder for this appointment
    });

    // Update end time options when start time changes
    this.appointmentForm.get('startTime')?.valueChanges.subscribe(() => {
      const endTimeControl = this.appointmentForm.get('endTime');
      if (
        endTimeControl?.value &&
        this.isEndTimeInvalid(endTimeControl.value)
      ) {
        endTimeControl.setValue('');
      }
    });
  }

  isEndTimeInvalid(endTime: string): boolean {
    const startTime = this.appointmentForm.get('startTime')?.value;

    if (!startTime) {
      return false;
    }

    return endTime <= startTime;
  }
  onSubmit(): void {
    if (
      this.appointmentForm.invalid ||
      this.isSubmitting ||
      !this.currentUser
    ) {
      return;
    }

    this.isSubmitting = true;

    const formValue = this.appointmentForm.value;
    const selectedDate = new Date(formValue.date);

    // Create start time
    const [startHour, startMinute] = formValue.startTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute);

    // Create end time
    const [endHour, endMinute] = formValue.endTime.split(':').map(Number);
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute);

    // Create appointment data - patientId must be a string, never null
    const appointmentData = {
      title: formValue.title,
      startTime,
      endTime,
      notes: formValue.notes || '',
      patientId: this.isPatient ? this.currentUser.id : 'unknown-patient', // In real app, this would be handled differently
      doctorId: this.isPatient ? formValue.doctorId : this.currentUser.id,
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (createdAppointment) => {
        // Create reminder if option was selected
        if (formValue.createReminder) {
          // Create reminder one day before appointment
          const reminderDate = new Date(startTime);
          reminderDate.setDate(reminderDate.getDate() - 1);
          this.createAppointmentReminder(createdAppointment, reminderDate);
        }

        this.snackBar.open('Appointment created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.isSubmitting = false;
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        console.error('Error creating appointment', err);
        this.snackBar.open('Failed to create appointment', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        this.isSubmitting = false;
      },
    });
  }

  // Helper method to create a reminder
  private createAppointmentReminder(
    appointment: any,
    reminderDate: Date
  ): void {
    const reminder = {
      appointmentId: appointment.id,
      message: `Reminder: You have an appointment "${appointment.title}" scheduled for tomorrow`,
      reminderDate: reminderDate,
    };

    // In a real app, this would make an API call to create a reminder
    console.log('Creating reminder:', reminder);
  }
}

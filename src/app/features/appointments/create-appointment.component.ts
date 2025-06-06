import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { AppointmentService } from '../../core/services/appointment.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ReminderService } from '../../core/services/reminder.service';
import { User, UserRole, DoctorDto } from '../../core/models/user.model';
import { AppointmentStatus } from '../../core/models/appointment.model';

@Component({
  selector: 'app-create-appointment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatChipsModule,
  ],
  styleUrls: ['./appointment-status-colors.css'],
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

              <!-- Custom reminder message (only shown when createReminder is checked) -->
              <mat-form-field
                *ngIf="appointmentForm.get('createReminder')?.value"
                class="w-full md:col-span-2"
              >
                <mat-label>Custom Reminder Message (optional)</mat-label>
                <input
                  matInput
                  formControlName="reminderMessage"
                  placeholder="Leave blank to use the default message"
                />
                <mat-hint>Custom message to use for your reminder</mat-hint>
              </mat-form-field>

              <!-- Status Preview -->
              <div class="w-full md:col-span-2 mt-4 mb-2">
                <p class="text-sm font-medium text-gray-500 mb-2">
                  Initial Status:
                </p>
                <mat-chip-set>
                  <mat-chip class="status-pending">Pending</mat-chip>
                </mat-chip-set>
                <p class="text-xs text-gray-500 mt-2">
                  New appointments will be marked as "Pending" until confirmed
                  by the staff.
                </p>
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
  doctors: DoctorDto[] = [];
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

    console.log('Current User:', this.currentUser);
    console.log('Is Patient:', this.isPatient);
    console.log('User Role:', this.currentUser?.role);
    this.route.queryParams.subscribe((params) => {
      if (params['start'] && params['end']) {
        this.preselectedStartDate = new Date(params['start']);
        this.preselectedEndDate = new Date(params['end']);
      }
    });
    this.initForm();
    if (this.isPatient) {
      console.log('Loading doctors for patient...');
      this.userService.getDoctorList().subscribe({
        next: (doctors) => {
          console.log('Doctors loaded:', doctors);
          this.doctors = doctors;
          this.snackBar.open(`Loaded ${doctors.length} doctors`, 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error loading doctors:', error);
          this.snackBar.open('Failed to load doctors list', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }
  initForm(): void {
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
      createReminder: [true],
      reminderMessage: [''],
    });

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
    const [startHour, startMinute] = formValue.startTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute);
    const [endHour, endMinute] = formValue.endTime.split(':').map(Number);
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute);
    const appointmentData = {
      title: formValue.title,
      startTime,
      endTime,
      notes: formValue.notes || '',
      patientId: this.isPatient
        ? this.currentUser.id
        : formValue.patientId || this.currentUser.id,
      doctorId: this.isPatient ? formValue.doctorId : this.currentUser.id,
      status: AppointmentStatus.PENDING,
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (createdAppointment) => {
        if (formValue.createReminder) {
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
  private createAppointmentReminder(
    appointment: any,
    reminderDate: Date
  ): void {
    const customMessage = this.appointmentForm.get('reminderMessage')?.value;
    let message = customMessage;

    if (!customMessage) {
      message = `Reminder: You have an appointment "${
        appointment.title
      }" scheduled for ${new Date(appointment.startTime).toLocaleString(
        'en-US',
        {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      )}`;
    }

    this.reminderService
      .createCustomReminder(appointment.id, message, reminderDate)
      .subscribe({
        next: () => {
          console.log('Reminder created successfully');
        },
        error: (err) => {
          console.error('Error creating reminder', err);
          this.snackBar.open(
            'Appointment created, but reminder setup failed',
            'Close',
            {
              duration: 5000,
            }
          );
        },
      });
  }
}

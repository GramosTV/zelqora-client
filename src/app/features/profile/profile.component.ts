import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/user.model';
import { getUserRoleString } from '../../core/utils/enum-helpers';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  template: `
    <div class="profile" *ngIf="currentUser">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">My Profile</h1>
        <p class="text-gray-600">
          Manage your personal information and account settings
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <mat-card class="order-2 md:order-1 md:col-span-1">
          <mat-card-content>
            <div class="flex flex-col items-center py-6">
              <div
                *ngIf="currentUser.profilePicture; else defaultAvatar"
                class="h-32 w-32 rounded-full bg-cover bg-center"
                [style.background-image]="
                  'url(' + currentUser.profilePicture + ')'
                "
              ></div>
              <ng-template #defaultAvatar>
                <div
                  class="h-32 w-32 rounded-full bg-blue-200 flex items-center justify-center"
                >
                  <mat-icon class="text-6xl text-blue-800"
                    >account_circle</mat-icon
                  >
                </div>
              </ng-template>

              <h3 class="text-xl font-bold mt-4">
                {{ currentUser.role === UserRole.DOCTOR ? 'Dr. ' : '' }}
                {{ currentUser.firstName }} {{ currentUser.lastName }}
              </h3>

              <div
                class="mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {{ getUserRoleString(currentUser.role) | titlecase }}
              </div>

              <p class="text-gray-500 mt-3">{{ currentUser.email }}</p>

              <p
                *ngIf="currentUser.specialization"
                class="text-gray-700 mt-2 font-medium"
              >
                {{ currentUser.specialization }}
              </p>

              <div class="text-sm text-gray-500 mt-6">
                <div>
                  Member since:
                  {{ currentUser.createdAt | date : 'mediumDate' }}
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Edit Profile -->
        <mat-card class="order-1 md:order-2 md:col-span-2">
          <mat-tab-group>
            <mat-tab label="Edit Profile">
              <form
                [formGroup]="profileForm"
                (ngSubmit)="onSubmit()"
                class="p-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field>
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName" />
                    <mat-error
                      *ngIf="profileForm.get('firstName')?.hasError('required')"
                    >
                      First name is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName" />
                    <mat-error
                      *ngIf="profileForm.get('lastName')?.hasError('required')"
                    >
                      Last name is required
                    </mat-error>
                  </mat-form-field>
                </div>

                <mat-form-field class="w-full">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" />
                  <mat-error
                    *ngIf="profileForm.get('email')?.hasError('required')"
                  >
                    Email is required
                  </mat-error>
                  <mat-error
                    *ngIf="profileForm.get('email')?.hasError('email')"
                  >
                    Please enter a valid email
                  </mat-error>
                </mat-form-field>

                <mat-form-field *ngIf="isDoctor" class="w-full">
                  <mat-label>Specialization</mat-label>
                  <input matInput formControlName="specialization" />
                  <mat-error
                    *ngIf="
                      profileForm.get('specialization')?.hasError('required')
                    "
                  >
                    Specialization is required for doctors
                  </mat-error>
                </mat-form-field>

                <mat-form-field class="w-full">
                  <mat-label>Profile Picture URL</mat-label>
                  <input matInput formControlName="profilePicture" />
                </mat-form-field>
                <div class="flex justify-end mt-4">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="
                      profileForm.invalid ||
                      profileForm.pristine ||
                      isSubmitting
                    "
                  >
                    <span *ngIf="!isSubmitting">Save Changes</span>
                    <span *ngIf="isSubmitting" class="flex items-center">
                      <mat-icon class="animate-spin mr-2">sync</mat-icon>
                      Saving...
                    </span>
                  </button>
                </div>
              </form>
            </mat-tab>

            <mat-tab label="Change Password">
              <form
                [formGroup]="passwordForm"
                (ngSubmit)="onPasswordSubmit()"
                class="p-4"
              >
                <mat-form-field class="w-full">
                  <mat-label>Current Password</mat-label>
                  <input
                    matInput
                    formControlName="currentPassword"
                    type="password"
                  />
                  <mat-error
                    *ngIf="
                      passwordForm.get('currentPassword')?.hasError('required')
                    "
                  >
                    Current password is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field class="w-full">
                  <mat-label>New Password</mat-label>
                  <input
                    matInput
                    formControlName="newPassword"
                    type="password"
                  />
                  <mat-error
                    *ngIf="
                      passwordForm.get('newPassword')?.hasError('required')
                    "
                  >
                    New password is required
                  </mat-error>
                  <mat-error
                    *ngIf="
                      passwordForm.get('newPassword')?.hasError('minlength')
                    "
                  >
                    Password must be at least 6 characters long
                  </mat-error>
                </mat-form-field>

                <mat-form-field class="w-full">
                  <mat-label>Confirm New Password</mat-label>
                  <input
                    matInput
                    formControlName="confirmPassword"
                    type="password"
                  />
                  <mat-error
                    *ngIf="
                      passwordForm.get('confirmPassword')?.hasError('required')
                    "
                  >
                    Please confirm your new password
                  </mat-error>
                  <mat-error
                    *ngIf="
                      passwordForm
                        .get('confirmPassword')
                        ?.hasError('passwordMismatch')
                    "
                  >
                    Passwords don't match
                  </mat-error>
                </mat-form-field>
                <div class="flex justify-end mt-4">
                  <button
                    mat-raised-button
                    color="primary"
                    type="submit"
                    [disabled]="passwordForm.invalid || isSubmitting"
                  >
                    <span *ngIf="!isSubmitting">Change Password</span>
                    <span *ngIf="isSubmitting" class="flex items-center">
                      <mat-icon class="animate-spin mr-2">sync</mat-icon>
                      Changing...
                    </span>
                  </button>
                </div>
              </form>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isDoctor = false;
  UserRole = UserRole;
  isSubmitting = false;
  getUserRoleString = getUserRoleString;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Use inject for dependency injection
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isDoctor = this.currentUser?.role === UserRole.DOCTOR;

    this.initProfileForm();
    this.initPasswordForm();
  }

  initProfileForm(): void {
    if (!this.currentUser) return;

    this.profileForm = this.fb.group({
      firstName: [this.currentUser.firstName, Validators.required],
      lastName: [this.currentUser.lastName, Validators.required],
      email: [this.currentUser.email, [Validators.required, Validators.email]],
      specialization: [this.currentUser.specialization || ''],
      profilePicture: [this.currentUser.profilePicture || ''],
    });

    // Add conditional validation for specialization
    if (this.isDoctor) {
      this.profileForm
        .get('specialization')
        ?.setValidators(Validators.required);
    }
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(
    formGroup: FormGroup
  ): { passwordMismatch: boolean } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }
  onSubmit(): void {
    if (this.profileForm.invalid || !this.currentUser || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const updatedUser = {
      ...this.profileForm.value,
    };

    this.userService.updateUser(this.currentUser.id, updatedUser).subscribe({
      next: (user) => {
        // Update the current user in auth service (in a real app, this would be handled differently)
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error updating profile', err);
        this.snackBar.open('Failed to update profile', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        this.isSubmitting = false;
      },
    });
  }
  onPasswordSubmit(): void {
    if (this.passwordForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // In a real app, you would call an API to change the password
    // Simulate API call with delay
    setTimeout(() => {
      this.snackBar.open('Password changed successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      this.passwordForm.reset();
      this.isSubmitting = false;
    }, 1000);
  }
}

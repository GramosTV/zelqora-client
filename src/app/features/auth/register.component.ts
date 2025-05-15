import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 py-8">
      <mat-card class="w-full max-w-md p-8 shadow-lg">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-blue-600">Create an Account</h1>
          <p class="text-gray-600">Join our healthcare platform</p>
        </div>

        <form
          [formGroup]="registerForm"
          (ngSubmit)="onSubmit()"
          class="space-y-4"
        >
          <div class="grid grid-cols-2 gap-4">
            <mat-form-field>
              <mat-label>First Name</mat-label>
              <input
                matInput
                formControlName="firstName"
                placeholder="First name"
              />
              <mat-error
                *ngIf="registerForm.get('firstName')?.hasError('required')"
                >First name is required</mat-error
              >
            </mat-form-field>

            <mat-form-field>
              <mat-label>Last Name</mat-label>
              <input
                matInput
                formControlName="lastName"
                placeholder="Last name"
              />
              <mat-error
                *ngIf="registerForm.get('lastName')?.hasError('required')"
                >Last name is required</mat-error
              >
            </mat-form-field>
          </div>

          <mat-form-field class="w-full">
            <mat-label>Email</mat-label>
            <input
              matInput
              formControlName="email"
              placeholder="Email"
              type="email"
            />
            <mat-error *ngIf="registerForm.get('email')?.hasError('required')"
              >Email is required</mat-error
            >
            <mat-error *ngIf="registerForm.get('email')?.hasError('email')"
              >Please enter a valid email</mat-error
            >
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Password</mat-label>
            <input
              matInput
              formControlName="password"
              placeholder="Password"
              type="password"
            />
            <mat-error
              *ngIf="registerForm.get('password')?.hasError('required')"
              >Password is required</mat-error
            >
            <mat-error
              *ngIf="registerForm.get('password')?.hasError('minlength')"
            >
              Password must be at least 6 characters long
            </mat-error>
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Confirm Password</mat-label>
            <input
              matInput
              formControlName="confirmPassword"
              placeholder="Confirm password"
              type="password"
            />
            <mat-error
              *ngIf="registerForm.get('confirmPassword')?.hasError('required')"
            >
              Please confirm your password
            </mat-error>
            <mat-error
              *ngIf="
                registerForm
                  .get('confirmPassword')
                  ?.hasError('passwordMismatch')
              "
            >
              Passwords don't match
            </mat-error>
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option [value]="UserRole.PATIENT">Patient</mat-option>
              <mat-option [value]="UserRole.DOCTOR">Doctor</mat-option>
            </mat-select>
            <mat-error *ngIf="registerForm.get('role')?.hasError('required')"
              >Role is required</mat-error
            >
          </mat-form-field>

          <div
            *ngIf="registerForm.get('role')?.value === UserRole.DOCTOR"
            class="mt-4"
          >
            <mat-form-field class="w-full">
              <mat-label>Specialization</mat-label>
              <input
                matInput
                formControlName="specialization"
                placeholder="Your medical specialization"
              />
              <mat-error
                *ngIf="registerForm.get('specialization')?.hasError('required')"
              >
                Specialization is required for doctors
              </mat-error>
            </mat-form-field>
          </div>

          <button
            mat-raised-button
            color="primary"
            class="w-full py-2"
            type="submit"
            [disabled]="registerForm.invalid || isLoading"
          >
            <ng-container *ngIf="!isLoading; else loadingTemplate"
              >Create Account</ng-container
            >
            <ng-template #loadingTemplate>
              <mat-spinner
                diameter="24"
                color="accent"
                class="inline-block"
                [mode]="'indeterminate'"
              ></mat-spinner>
            </ng-template>
          </button>

          <div class="mt-4 text-center">
            <p>
              Already have an account?
              <a routerLink="/auth/login" class="text-blue-600 hover:underline"
                >Sign In</a
              >
            </p>
          </div>

          <div
            *ngIf="errorMessage"
            class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center"
          >
            {{ errorMessage }}
          </div>
        </form>
      </mat-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  UserRole = UserRole; // Expose enum to template

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        role: [UserRole.PATIENT, Validators.required],
        specialization: [''],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );

    // Add conditional validation for specialization field
    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      const specializationControl = this.registerForm.get('specialization');

      if (role === UserRole.DOCTOR) {
        specializationControl?.setValidators(Validators.required);
      } else {
        specializationControl?.clearValidators();
      }

      specializationControl?.updateValueAndValidity();
    });
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { firstName, lastName, email, password, role, specialization } =
      this.registerForm.value;
    this.authService
      .register({
        email,
        firstName,
        lastName,
        password, // Add the password field
        role,
        specialization: role === UserRole.DOCTOR ? specialization : undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage =
            err.message || 'Failed to register. Please try again.';
          this.isLoading = false;
        },
      });
  }
}

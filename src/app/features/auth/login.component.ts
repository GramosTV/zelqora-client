import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
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
    MatCheckboxModule,
  ],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <mat-card class="w-full max-w-md p-8 shadow-lg">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-blue-600">
            Healthcare Appointment System
          </h1>
          <p class="text-gray-600">Sign in to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <mat-form-field class="w-full">
            <mat-label>Email</mat-label>
            <input
              matInput
              formControlName="email"
              placeholder="Enter your email"
              type="email"
            />
            <mat-error *ngIf="loginForm.get('email')?.hasError('required')"
              >Email is required</mat-error
            >
            <mat-error *ngIf="loginForm.get('email')?.hasError('email')"
              >Please enter a valid email</mat-error
            >
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Password</mat-label>
            <input
              matInput
              formControlName="password"
              placeholder="Enter your password"
              type="password"
            />
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')"
              >Password is required</mat-error
            >
          </mat-form-field>

          <div class="flex justify-between items-center">
            <mat-checkbox color="primary">Remember me</mat-checkbox>
            <a
              routerLink="/auth/forgot-password"
              class="text-blue-600 hover:underline"
              >Forgot Password?</a
            >
          </div>

          <button
            mat-raised-button
            color="primary"
            class="w-full py-2"
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
          >
            <ng-container *ngIf="!isLoading; else loadingTemplate"
              >Sign In</ng-container
            >
            <ng-template #loadingTemplate>
              <mat-spinner diameter="24" class="inline-block"></mat-spinner>
            </ng-template>
          </button>

          <div class="mt-4 text-center">
            <p>
              Don't have an account?
              <a
                routerLink="/auth/register"
                class="text-blue-600 hover:underline"
                >Sign Up</a
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

        <div class="mt-6 border-t pt-4">
          <p class="text-center text-sm text-gray-600 mb-2">Demo Accounts:</p>
          <div class="grid grid-cols-3 gap-2">
            <button (click)="loginAsPatient()" mat-stroked-button>
              Patient
            </button>
            <button (click)="loginAsDoctor()" mat-stroked-button>Doctor</button>
            <button (click)="loginAsAdmin()" mat-stroked-button>Admin</button>
          </div>
        </div>
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to login. Please try again.';
        this.isLoading = false;
      },
    });
  }

  loginAsPatient(): void {
    this.loginForm.patchValue({
      email: 'patient@example.com',
      password: 'password',
    });
    this.onSubmit();
  }

  loginAsDoctor(): void {
    this.loginForm.patchValue({
      email: 'doctor@example.com',
      password: 'password',
    });
    this.onSubmit();
  }

  loginAsAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@example.com',
      password: 'password',
    });
    this.onSubmit();
  }
}

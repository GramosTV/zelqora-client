import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then(
            (c) => c.LoginComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component').then(
            (c) => c.RegisterComponent
          ),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout.component').then(
        (c) => c.LayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent
          ),
      },
      {
        path: 'appointments',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/appointments/appointment-list.component').then(
                (c) => c.AppointmentListComponent
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import(
                './features/appointments/create-appointment.component'
              ).then((c) => c.CreateAppointmentComponent),
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import(
                './features/appointments/appointment-calendar.component'
              ).then((c) => c.AppointmentCalendarComponent),
          },
          {
            path: 'reminders',
            loadComponent: () =>
              import(
                './features/appointments/appointment-reminders.component'
              ).then((c) => c.AppointmentRemindersComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/appointments/appointment-details.component'
              ).then((c) => c.AppointmentDetailsComponent),
          },
        ],
      },
      {
        path: 'messaging',
        loadComponent: () =>
          import('./features/messaging/messaging.component').then(
            (c) => c.MessagingComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (c) => c.ProfileComponent
          ),
      },
      {
        path: 'admin',
        canActivate: [() => roleGuard([UserRole.ADMIN])],
        children: [
          {
            path: 'users',
            loadComponent: () =>
              import('./features/dashboard/dashboard.component').then(
                (c) => c.DashboardComponent
              ), // Replace with actual admin components later
          },
          {
            path: 'appointments',
            loadComponent: () =>
              import('./features/appointments/appointment-list.component').then(
                (c) => c.AppointmentListComponent
              ), // Replace with actual admin components later
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { ReminderService } from '../../core/services/reminder.service';
import { User, UserRole } from '../../core/models/user.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  template: `
    <div class="flex flex-col h-screen">
      <mat-toolbar color="primary" class="z-10">
        <button mat-icon-button (click)="sidenav.toggle()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="ml-2 font-semibold">Healthcare Appointment System</span>
        <span class="flex-1"></span>
        <ng-container *ngIf="currentUser$ | async as user">
          <button
            mat-icon-button
            [matBadge]="unreadReminderCount"
            matBadgeColor="warn"
            [matMenuTriggerFor]="reminderMenu"
          >
            <mat-icon>notifications</mat-icon>
          </button>
          <button
            mat-icon-button
            [matBadge]="unreadReminderCount"
            [matBadgeHidden]="unreadReminderCount === 0"
            matBadgeColor="warn"
            [matMenuTriggerFor]="reminderMenu"
          >
            <mat-icon>notifications</mat-icon>
          </button>
          <button
            mat-icon-button
            [matBadge]="unreadMessageCount"
            [matBadgeHidden]="unreadMessageCount === 0"
            matBadgeColor="accent"
            routerLink="/messaging"
          >
            <mat-icon>mail</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="ml-2">
            <div
              *ngIf="user.profilePicture; else defaultAvatar"
              class="h-8 w-8 rounded-full bg-cover bg-center"
              [style.background-image]="'url(' + user.profilePicture + ')'"
            ></div>
            <ng-template #defaultAvatar>
              <mat-icon>account_circle</mat-icon>
            </ng-template>
          </button>

          <mat-menu #reminderMenu="matMenu" class="reminder-menu">
            <div class="p-2">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-medium">Reminders</h3>
                <button
                  mat-icon-button
                  (click)="markAllRemindersRead($event)"
                  *ngIf="unreadReminderCount > 0"
                >
                  <mat-icon class="text-sm">done_all</mat-icon>
                </button>
              </div>
            </div>
            <mat-divider></mat-divider>
            <div class="max-h-[300px] overflow-y-auto">
              <div
                *ngIf="reminders.length === 0"
                class="p-4 text-center text-gray-500"
              >
                <mat-icon>notifications_off</mat-icon>
                <p class="mt-2">No reminders</p>
              </div>
              <button
                mat-menu-item
                *ngFor="let reminder of reminders"
                class="flex flex-col items-start"
                [ngClass]="{ 'bg-blue-50': !reminder.isRead }"
                (click)="markReminderRead(reminder.id)"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-sm font-medium">{{
                    reminder.message
                  }}</span>
                  <mat-icon
                    *ngIf="!reminder.isRead"
                    class="text-blue-500 text-sm"
                    >fiber_new</mat-icon
                  >
                </div>
                <span class="text-xs text-gray-500">
                  {{ reminder.reminderDate | date : 'MMM d, h:mm a' }}
                </span>
              </button>
            </div>
          </mat-menu>
          <mat-menu #userMenu="matMenu">
            <div class="px-4 py-2 text-center">
              <p class="font-medium">
                {{ user.firstName }} {{ user.lastName }}
              </p>
              <p class="text-sm text-gray-600">{{ user.email }}</p>
              <p class="text-xs text-blue-600 font-medium mt-1">
                {{ user.role | titlecase }}
              </p>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>My Profile</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </ng-container>
      </mat-toolbar>

      <mat-sidenav-container class="flex-1">
        <mat-sidenav #sidenav [mode]="'side'" [opened]="true" class="w-64 p-4">
          <div class="flex flex-col h-full">
            <div class="mb-8">
              <div
                *ngIf="currentUser$ | async as user"
                class="flex items-center mb-4 p-2 rounded-lg bg-blue-50"
              >
                <div
                  *ngIf="user.profilePicture; else defaultProfilePic"
                  class="h-12 w-12 rounded-full bg-cover bg-center"
                  [style.background-image]="'url(' + user.profilePicture + ')'"
                ></div>
                <ng-template #defaultProfilePic>
                  <div
                    class="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center"
                  >
                    <mat-icon class="text-blue-800">account_circle</mat-icon>
                  </div>
                </ng-template>
                <div class="ml-3">
                  <div class="font-medium">
                    {{ user.firstName }} {{ user.lastName }}
                  </div>
                  <div class="text-xs text-blue-600 font-medium">
                    {{ user.role | titlecase }}
                  </div>
                </div>
              </div>
            </div>

            <nav class="flex-1">
              <mat-nav-list>
                <a
                  mat-list-item
                  routerLink="/dashboard"
                  routerLinkActive="bg-blue-50"
                >
                  <mat-icon matListItemIcon>dashboard</mat-icon>
                  <span matListItemTitle>Dashboard</span>
                </a>

                <a
                  mat-list-item
                  routerLink="/appointments"
                  routerLinkActive="bg-blue-50"
                >
                  <mat-icon matListItemIcon>event</mat-icon>
                  <span matListItemTitle>Appointments</span>
                </a>
                <a
                  mat-list-item
                  routerLink="/messaging"
                  routerLinkActive="bg-blue-50"
                >
                  <mat-icon
                    matListItemIcon
                    [matBadge]="unreadMessageCount"
                    [matBadgeHidden]="unreadMessageCount === 0"
                    matBadgeColor="accent"
                    >mail</mat-icon
                  >
                  <span matListItemTitle>Messages</span>
                </a>

                <ng-container *ngIf="isAdmin$ | async">
                  <mat-divider class="my-2"></mat-divider>
                  <div class="text-xs text-gray-500 ml-4 mt-4 mb-2">Admin</div>

                  <a
                    mat-list-item
                    routerLink="/admin/users"
                    routerLinkActive="bg-blue-50"
                  >
                    <mat-icon matListItemIcon>people</mat-icon>
                    <span matListItemTitle>Manage Users</span>
                  </a>

                  <a
                    mat-list-item
                    routerLink="/admin/appointments"
                    routerLinkActive="bg-blue-50"
                  >
                    <mat-icon matListItemIcon>event_note</mat-icon>
                    <span matListItemTitle>Manage Appointments</span>
                  </a>
                </ng-container>
              </mat-nav-list>
            </nav>

            <div class="mt-auto pt-4">
              <button mat-stroked-button (click)="logout()" class="w-full">
                <mat-icon class="mr-2">exit_to_app</mat-icon>
                Logout
              </button>
            </div>
          </div>
        </mat-sidenav>
        <mat-sidenav-content class="p-6">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .mat-toolbar {
        position: sticky;
        top: 0;
      }

      .mat-drawer {
        border-right: none;
      }
    `,
  ],
})
export class LayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private reminderService = inject(ReminderService);
  private router = inject(Router);

  currentUser$: Observable<User | null>;
  isAdmin$: Observable<boolean>;
  unreadMessageCount: number = 0;
  unreadReminderCount: number = 0;
  reminders: any[] = [];

  constructor() {
    this.currentUser$ = this.authService.currentUser$;

    // Check if user is admin
    this.isAdmin$ = new Observable<boolean>((observer) => {
      this.authService.currentUser$.subscribe((user) => {
        observer.next(!!user && user.role === UserRole.ADMIN);
      });
    });
  }

  ngOnInit(): void {
    // Get unread message count
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.messageService.getUnreadMessages(user.id).subscribe((messages) => {
          this.unreadMessageCount = messages.length;
        });

        // Get unread reminders count
        this.reminderService.getUnreadRemindersCount().subscribe((count) => {
          this.unreadReminderCount = count;
        });

        // Load reminders
        this.reminderService.getReminders().subscribe((reminders) => {
          this.reminders = reminders;
        });
      } else {
        this.unreadMessageCount = 0;
        this.unreadReminderCount = 0;
        this.reminders = [];
      }
    });
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  markReminderRead(id: string): void {
    this.reminderService.markAsRead(id).subscribe(() => {
      // Update the reminder count
      this.reminderService.getUnreadRemindersCount().subscribe((count) => {
        this.unreadReminderCount = count;
      });

      // Update the reminders list
      this.reminderService.getReminders().subscribe((reminders) => {
        this.reminders = reminders;
      });
    });
  }

  markAllRemindersRead(event: Event): void {
    // Prevent menu from closing
    event.stopPropagation();

    this.reminderService.markAllAsRead().subscribe(() => {
      this.unreadReminderCount = 0;

      // Update the reminders list
      this.reminderService.getReminders().subscribe((reminders) => {
        this.reminders = reminders;
      });
    });
  }
}

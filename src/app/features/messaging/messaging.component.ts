import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/user.model';
import { Message } from '../../core/models/message.model';

@Component({
  selector: 'app-messaging',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <div class="messaging">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Messages</h1>
        <p class="text-gray-600">
          Communicate securely with healthcare providers and patients
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <!-- Contact List -->
        <mat-card class="h-full flex flex-col">
          <mat-card-header>
            <mat-card-title>Contacts</mat-card-title>
          </mat-card-header>
          <mat-divider class="mt-4"></mat-divider>
          <div class="flex-1 overflow-y-auto">
            <mat-nav-list>
              <ng-container *ngIf="contacts.length; else noContacts">
                <a
                  mat-list-item
                  *ngFor="let contact of contacts; trackBy: trackByUserId"
                  (click)="selectContact(contact)"
                  [class.bg-blue-50]="selectedContact?.id === contact.id"
                >
                  <div class="flex items-center w-full">
                    <div
                      *ngIf="contact.profilePicture; else defaultAvatar"
                      class="h-10 w-10 rounded-full bg-cover bg-center mr-3"
                      [style.background-image]="
                        'url(' + contact.profilePicture + ')'
                      "
                    ></div>
                    <ng-template #defaultAvatar>
                      <div
                        class="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center mr-3"
                      >
                        <mat-icon class="text-blue-800"
                          >account_circle</mat-icon
                        >
                      </div>
                    </ng-template>

                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium">
                        {{ contact.role === UserRole.DOCTOR ? 'Dr. ' : '' }}
                        {{ contact.firstName }} {{ contact.lastName }}
                      </h3>
                      <p class="text-xs text-gray-600 truncate">
                        {{
                          contact.role === UserRole.DOCTOR
                            ? contact.specialization
                            : 'Patient'
                        }}
                      </p>
                    </div>

                    <mat-icon
                      *ngIf="hasUnreadFrom(contact.id)"
                      class="text-blue-600"
                      >mark_email_unread</mat-icon
                    >
                  </div>
                </a>
              </ng-container>

              <ng-template #noContacts>
                <div class="py-8 text-center text-gray-500">
                  <mat-icon class="text-5xl mb-2 opacity-30"
                    >people_outline</mat-icon
                  >
                  <p>No contacts available</p>
                </div>
              </ng-template>
            </mat-nav-list>
          </div>
        </mat-card>

        <!-- Conversation -->
        <mat-card class="md:col-span-2 h-full flex flex-col">
          <div
            *ngIf="selectedContact; else noSelectedContact"
            class="flex flex-col h-full"
          >
            <!-- Conversation Header -->
            <mat-card-header class="border-b pb-3">
              <div
                *ngIf="
                  selectedContact.profilePicture;
                  else defaultContactAvatar
                "
                class="h-10 w-10 rounded-full bg-cover bg-center"
                [style.background-image]="
                  'url(' + selectedContact.profilePicture + ')'
                "
              ></div>
              <ng-template #defaultContactAvatar>
                <div
                  class="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center"
                >
                  <mat-icon class="text-blue-800">account_circle</mat-icon>
                </div>
              </ng-template>

              <mat-card-title>
                {{ selectedContact.role === UserRole.DOCTOR ? 'Dr. ' : '' }}
                {{ selectedContact.firstName }} {{ selectedContact.lastName }}
              </mat-card-title>
              <mat-card-subtitle>
                {{
                  selectedContact.role === UserRole.DOCTOR
                    ? selectedContact.specialization
                    : 'Patient'
                }}
              </mat-card-subtitle>
            </mat-card-header>

            <!-- Messages List -->
            <div
              class="flex-1 overflow-y-auto p-4 bg-gray-50"
              #messagesContainer
            >
              <div
                *ngIf="currentConversation.length === 0"
                class="py-8 text-center text-gray-500"
              >
                <mat-icon class="text-5xl mb-2 opacity-30">forum</mat-icon>
                <p>No messages yet. Start the conversation!</p>
              </div>

              <div
                *ngFor="
                  let message of currentConversation;
                  trackBy: trackByMessageId
                "
                class="mb-4 max-w-[75%]"
                [class.ml-auto]="message.senderId === currentUser?.id"
              >
                <div
                  class="rounded-lg p-3"
                  [class.bg-blue-500]="message.senderId === currentUser?.id"
                  [class.text-white]="message.senderId === currentUser?.id"
                  [class.bg-white]="message.senderId !== currentUser?.id"
                >
                  <p>{{ message.content }}</p>
                </div>
                <div
                  class="text-xs text-gray-500 mt-1"
                  [class.text-right]="message.senderId === currentUser?.id"
                >
                  {{ message.createdAt | date : 'short' }}
                </div>
              </div>
            </div>

            <!-- Message Input -->
            <div class="p-3 border-t">
              <form (ngSubmit)="sendMessage()">
                <div class="flex gap-2">
                  <mat-form-field class="flex-1">
                    <mat-label>Type a message</mat-label>
                    <input
                      matInput
                      [formControl]="messageControl"
                      placeholder="Write your message..."
                    />
                  </mat-form-field>
                  <button
                    mat-fab
                    color="primary"
                    type="submit"
                    [disabled]="!messageControl.value"
                    aria-label="Send message"
                  >
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <ng-template #noSelectedContact>
            <div
              class="flex flex-col items-center justify-center h-full text-gray-500"
            >
              <mat-icon class="text-7xl mb-4 opacity-30"
                >chat_bubble_outline</mat-icon
              >
              <h3 class="text-xl font-medium">No conversation selected</h3>
              <p>Select a contact to start messaging</p>
            </div>
          </ng-template>
        </mat-card>
      </div>
    </div>
  `,
})
export class MessagingComponent implements OnInit {
  currentUser: User | null = null;
  contacts: User[] = [];
  selectedContact: User | null = null;
  currentConversation: Message[] = [];

  allMessages: Message[] = [];
  unreadMessages: Message[] = [];

  messageControl = new FormControl('');
  UserRole = UserRole;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      this.loadContacts();
      this.loadMessages();
    }
  }
  public trackByUserId(index: number, item: User): string {
    return item.id;
  }

  public trackByMessageId(index: number, item: Message): string {
    return item.id;
  }

  loadContacts(): void {
    const userRole = this.currentUser?.role;

    this.userService.getAllUsers().subscribe((users) => {
      if (userRole === UserRole.DOCTOR) {
        this.contacts = users.filter((u) => u.role === UserRole.PATIENT);
      } else if (userRole === UserRole.PATIENT) {
        this.contacts = users.filter((u) => u.role === UserRole.DOCTOR);
      } else {
        this.contacts = users.filter((u) => u.id !== this.currentUser?.id);
      }
    });
  }

  loadMessages(): void {
    if (!this.currentUser) return;

    this.messageService
      .getUserMessages(this.currentUser.id)
      .subscribe((messages) => {
        this.allMessages = messages;
        this.findUnreadMessages();

        if (this.selectedContact) {
          this.loadConversation(this.selectedContact);
        }
      });
  }

  findUnreadMessages(): void {
    if (!this.currentUser) return;

    this.unreadMessages = this.allMessages.filter(
      (m) => m.receiverId === this.currentUser?.id && !m.read
    );
  }

  hasUnreadFrom(userId: string): boolean {
    return this.unreadMessages.some((m) => m.senderId === userId);
  }

  selectContact(contact: User): void {
    this.selectedContact = contact;
    this.loadConversation(contact);
  }

  loadConversation(contact: User): void {
    if (!this.currentUser) return;

    this.messageService
      .getConversation(this.currentUser.id, contact.id)
      .subscribe((messages) => {
        this.currentConversation = messages;
        this.markMessagesAsRead();
      });
  }

  markMessagesAsRead(): void {
    if (!this.currentUser || !this.selectedContact) return;
    const unreadFromContact = this.unreadMessages.filter(
      (m) => m.senderId === this.selectedContact?.id
    );

    unreadFromContact.forEach((message) => {
      this.messageService.markAsRead(message.id).subscribe(() => {
        const index = this.currentConversation.findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          this.currentConversation[index] = {
            ...this.currentConversation[index],
            read: true,
          };
        }
        this.findUnreadMessages();
      });
    });
  }

  sendMessage(): void {
    if (
      !this.currentUser ||
      !this.selectedContact ||
      !this.messageControl.value
    )
      return;

    const message = {
      receiverId: this.selectedContact.id,
      content: this.messageControl.value,
    };

    this.messageService.sendMessage(message).subscribe((newMessage) => {
      this.currentConversation.push(newMessage);
      this.messageControl.reset();
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Message,
  CreateMessageDto,
  UpdateMessageDto,
} from '../models/message.model';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private encryptionService: EncryptionService
  ) {}
  public getConversation(
    userId1: string,
    userId2: string
  ): Observable<Message[]> {
    return this.http
      .get<Message[]>(`${this.apiUrl}/conversation/${userId2}`)
      .pipe(
        map((messages) =>
          messages.map((message) => {
            if (message.encrypted) {
              return {
                ...message,
                content: this.encryptionService.decrypt(message.content),
                encrypted: false,
              };
            }
            return message;
          })
        ),
        catchError((error) => {
          console.error('Error fetching conversation', error);
          return throwError(
            () =>
              new Error('Failed to load conversation. Please try again later.')
          );
        })
      );
  }
  public getUserMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError((error) => {
        console.error('Error fetching user messages', error);
        return throwError(
          () => new Error('Failed to load messages. Please try again later.')
        );
      })
    );
  }

  public getUnreadMessages(_userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/unread`).pipe(
      catchError((error) => {
        console.error('Error fetching unread messages', error);
        return throwError(
          () =>
            new Error('Failed to load unread messages. Please try again later.')
        );
      })
    );
  }
  public sendMessage(message: Partial<Message>): Observable<Message> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(
        () => new Error('You must be logged in to send messages')
      );
    }
    const shouldEncrypt = true;
    const originalContent = message.content!;

    const content = shouldEncrypt
      ? this.encryptionService.encrypt(message.content!)
      : message.content!;

    // Generate an integrity hash to verify message integrity
    const integrityHash = this.encryptionService.generateHash(message.content!);

    const messageDto: CreateMessageDto = {
      receiverId: message.receiverId!,
      content,
      encrypted: shouldEncrypt,
      integrityHash,
    };

    return this.http.post<Message>(this.apiUrl, messageDto).pipe(
      map((response) => {
        return {
          ...response,
          content: originalContent,
          encrypted: false,
        };
      }),
      catchError((error) => {
        console.error('Error sending message', error);
        return throwError(
          () => new Error('Failed to send message. Please try again later.')
        );
      })
    );
  }
  public markAsRead(messageId: string): Observable<Message> {
    const updateDto: UpdateMessageDto = {
      read: true,
    };

    return this.http
      .patch<Message>(`${this.apiUrl}/${messageId}/read`, updateDto)
      .pipe(
        catchError((error) => {
          console.error('Error marking message as read', error);
          return throwError(
            () =>
              new Error(
                'Failed to mark message as read. Please try again later.'
              )
          );
        })
      );
  }

  public deleteMessage(messageId: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/${messageId}`).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error deleting message', error);
        return throwError(
          () => new Error('Failed to delete message. Please try again later.')
        );
      })
    );
  }
}

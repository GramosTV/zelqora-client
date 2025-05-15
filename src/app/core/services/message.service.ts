import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { Message } from '../models/message.model';
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
  getConversation(userId1: string, userId2: string): Observable<Message[]> {
    // Call the API endpoint to get the conversation
    return this.http
      .get<Message[]>(`${this.apiUrl}/conversation/${userId2}`)
      .pipe(
        map((messages) =>
          messages.map((message) => {
            // Handle decryption if needed
            if (message.encrypted) {
              return {
                ...message,
                content: this.encryptionService.decrypt(message.content),
                // Set encrypted to false since we're returning decrypted content
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
  getUserMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError((error) => {
        console.error('Error fetching user messages', error);
        return throwError(
          () => new Error('Failed to load messages. Please try again later.')
        );
      })
    );
  }

  getUnreadMessages(userId: string): Observable<Message[]> {
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
  sendMessage(message: Partial<Message>): Observable<Message> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return throwError(
        () => new Error('You must be logged in to send messages')
      );
    }

    // Determine if this message should be encrypted
    // We'll encrypt messages between doctors and patients for privacy
    const shouldEncrypt = true; // In a real app, this could be based on message content or settings

    // Original content before any encryption, for returning to the sender
    const originalContent = message.content!;

    // Encrypt content if required
    const content = shouldEncrypt
      ? this.encryptionService.encrypt(message.content!)
      : message.content!;

    // Generate an integrity hash for the message
    const integrityHash = this.encryptionService.generateHash(message.content!);

    const messageDto = {
      receiverId: message.receiverId!,
      content: content,
      encrypted: shouldEncrypt,
      integrityHash: integrityHash,
    };

    return this.http.post<Message>(this.apiUrl, messageDto).pipe(
      map((response) => {
        // Return with the original content to immediately display to the sender
        return {
          ...response,
          content: originalContent,
          encrypted: false, // Set to false since we're returning the decrypted content
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

  markAsRead(messageId: string): Observable<Message> {
    return this.http
      .patch<Message>(`${this.apiUrl}/${messageId}/read`, {})
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

  deleteMessage(messageId: string): Observable<boolean> {
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

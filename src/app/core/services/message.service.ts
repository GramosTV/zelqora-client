import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Message } from '../models/message.model';
import { AuthService } from './auth.service';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  // Mock message data
  private messages: Message[] = [
    {
      id: '1',
      senderId: '1', // Doctor
      receiverId: '2', // Patient
      content:
        'Hello Jane, please make sure to bring your previous test results to your next appointment.',
      encrypted: false, // Initial messages are not encrypted for demo purposes
      read: true,
      createdAt: new Date('2025-05-08T10:30:00'),
      updatedAt: new Date('2025-05-08T10:30:00'),
    },
    {
      id: '2',
      senderId: '2', // Patient
      receiverId: '1', // Doctor
      content: 'I will bring them, thank you for the reminder Dr. Doe.',
      encrypted: false, // Initial messages are not encrypted for demo purposes
      read: false,
      createdAt: new Date('2025-05-08T11:15:00'),
      updatedAt: new Date('2025-05-08T11:15:00'),
    },
  ];

  constructor(
    private authService: AuthService,
    private encryptionService: EncryptionService
  ) {}
  getConversation(userId1: string, userId2: string): Observable<Message[]> {
    const conversation = this.messages
      .filter(
        (m) =>
          (m.senderId === userId1 && m.receiverId === userId2) ||
          (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Decrypt any encrypted messages before returning
    return of(conversation).pipe(
      delay(500),
      map((messages) =>
        messages.map((message) => {
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
      )
    );
  }

  getUserMessages(userId: string): Observable<Message[]> {
    const userMessages = this.messages.filter(
      (m) => m.senderId === userId || m.receiverId === userId
    );

    return of(userMessages).pipe(delay(500));
  }

  getUnreadMessages(userId: string): Observable<Message[]> {
    const unreadMessages = this.messages.filter(
      (m) => m.receiverId === userId && !m.read
    );

    return of(unreadMessages).pipe(delay(500));
  }
  sendMessage(message: Partial<Message>): Observable<Message> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      throw new Error('You must be logged in to send messages');
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

    const newMessage: Message = {
      id: Math.random().toString(36).substring(2),
      senderId: currentUser.id,
      receiverId: message.receiverId!,
      content: content,
      encrypted: shouldEncrypt,
      integrityHash: integrityHash,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messages.push(newMessage);

    // Return the message with original content to immediately display to the sender
    return of({
      ...newMessage,
      content: originalContent,
      encrypted: false, // Set to false since we're returning the decrypted content
    }).pipe(delay(500));
  }

  markAsRead(messageId: string): Observable<Message> {
    const index = this.messages.findIndex((m) => m.id === messageId);

    if (index !== -1) {
      this.messages[index] = {
        ...this.messages[index],
        read: true,
        updatedAt: new Date(),
      };

      return of(this.messages[index]).pipe(delay(500));
    }

    throw new Error('Message not found');
  }

  deleteMessage(messageId: string): Observable<boolean> {
    const index = this.messages.findIndex((m) => m.id === messageId);

    if (index !== -1) {
      this.messages.splice(index, 1);
      return of(true).pipe(delay(500));
    }

    return of(false).pipe(delay(500));
  }
}

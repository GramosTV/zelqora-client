export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  encrypted: boolean;
  integrityHash?: string; // For verifying message hasn't been tampered with
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDto {
  receiverId: string;
  content: string;
  encrypted: boolean;
  integrityHash?: string;
}

export interface UpdateMessageDto {
  read: boolean;
}

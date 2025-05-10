import * as CryptoJS from 'crypto-js';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private readonly SECRET_KEY = 'healthcare-system-secure-messaging-key';

  /**
   * Encrypts a message using AES encryption
   * @param message Plain text message to encrypt
   * @returns Encrypted message
   */
  encrypt(message: string): string {
    if (!message) return '';
    return CryptoJS.AES.encrypt(message, this.SECRET_KEY).toString();
  }

  /**
   * Decrypts an encrypted message using AES decryption
   * @param encryptedMessage Encrypted message to decrypt
   * @returns Decrypted plain text message
   */
  decrypt(encryptedMessage: string): string {
    if (!encryptedMessage) return '';
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generates a secure hash of a string (for message integrity verification)
   * @param message Message to hash
   * @returns SHA256 hash of the message
   */
  generateHash(message: string): string {
    return CryptoJS.SHA256(message).toString();
  }

  /**
   * Verifies message integrity by comparing hash
   * @param message Original message
   * @param hash Hash to compare against
   * @returns Boolean indicating if the message matches the hash
   */
  verifyHash(message: string, hash: string): boolean {
    return this.generateHash(message) === hash;
  }
}

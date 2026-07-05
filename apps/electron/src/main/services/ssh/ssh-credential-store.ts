/**
 * SSH Credential Store Service
 *
 * Securely stores SSH credentials (passwords, private keys, passphrases)
 * using Electron's safeStorage API for encryption.
 *
 * Follows the pattern established by password-storage.ts
 */

import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { app, safeStorage } from 'electron';

/**
 * Stored SSH credential with encrypted fields
 */
interface StoredSSHCredential {
  profileId: string;
  /** Encrypted password (base64) */
  password?: string;
  /** Encrypted private key (base64) */
  privateKey?: string;
  /** Encrypted passphrase (base64) */
  passphrase?: string;
  /** Encrypted jump host password (base64) */
  jumpHostPassword?: string;
  /** Encrypted jump host private key (base64) */
  jumpHostPrivateKey?: string;
  /** Encrypted jump host passphrase (base64) */
  jumpHostPassphrase?: string;
}

/**
 * Decrypted SSH credential for use
 */
export interface SSHCredential {
  profileId: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  jumpHostPassword?: string;
  jumpHostPrivateKey?: string;
  jumpHostPassphrase?: string;
}

interface SSHCredentialStore {
  credentials: Record<string, StoredSSHCredential>;
}

/**
 * Simple file-based store for SSH credentials
 * Uses Electron's safeStorage for encryption
 */
class SimpleStore {
  private filePath: string | null = null;
  private data: SSHCredentialStore = { credentials: {} };

  private getFilePath(): string {
    if (!this.filePath) {
      this.filePath = path.join(
        app.getPath('userData'),
        'quarry-ssh-credentials.json'
      );
    }
    return this.filePath;
  }

  private load(): void {
    try {
      const filePath = this.getFilePath();
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load SSH credential store:', error);
      this.data = { credentials: {} };
    }
  }

  private save(): void {
    try {
      const filePath = this.getFilePath();
      fs.writeFileSync(filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save SSH credential store:', error);
    }
  }

  get(_key: 'credentials'): Record<string, StoredSSHCredential> {
    this.load();
    return this.data.credentials || {};
  }

  set(_key: 'credentials', value: Record<string, StoredSSHCredential>): void {
    this.data.credentials = value;
    this.save();
  }
}

const store = new SimpleStore();

/**
 * SSH Credential Storage Service
 *
 * Provides secure storage for SSH authentication credentials using
 * Electron's safeStorage API for encryption.
 */
class SSHCredentialStoreService {
  /**
   * Check if encryption is available on this system
   */
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  /**
   * Encrypt a string value using safeStorage
   */
  private encrypt(value: string): string {
    const encrypted = safeStorage.encryptString(value);
    return encrypted.toString('base64');
  }

  /**
   * Decrypt a base64-encoded encrypted string
   */
  private decrypt(encryptedBase64: string): string {
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    return safeStorage.decryptString(encrypted);
  }

  /**
   * Save SSH credentials for a connection profile
   * Merges with existing credentials if they exist
   *
   * @param profileId - Connection profile identifier
   * @param credential - Partial credential object with fields to save
   * @returns true if saved successfully, false otherwise
   */
  saveCredential(
    profileId: string,
    credential: Partial<Omit<SSHCredential, 'profileId'>>
  ): boolean {
    if (!this.isAvailable()) {
      console.warn('SSH credential encryption is not available on this system');
      return false;
    }

    try {
      const credentials = store.get('credentials');
      const existing = credentials[profileId] || { profileId };

      // Encrypt and merge each provided field
      const updated: StoredSSHCredential = { ...existing };

      if (credential.password !== undefined) {
        updated.password = credential.password
          ? this.encrypt(credential.password)
          : undefined;
      }
      if (credential.privateKey !== undefined) {
        updated.privateKey = credential.privateKey
          ? this.encrypt(credential.privateKey)
          : undefined;
      }
      if (credential.passphrase !== undefined) {
        updated.passphrase = credential.passphrase
          ? this.encrypt(credential.passphrase)
          : undefined;
      }
      if (credential.jumpHostPassword !== undefined) {
        updated.jumpHostPassword = credential.jumpHostPassword
          ? this.encrypt(credential.jumpHostPassword)
          : undefined;
      }
      if (credential.jumpHostPrivateKey !== undefined) {
        updated.jumpHostPrivateKey = credential.jumpHostPrivateKey
          ? this.encrypt(credential.jumpHostPrivateKey)
          : undefined;
      }
      if (credential.jumpHostPassphrase !== undefined) {
        updated.jumpHostPassphrase = credential.jumpHostPassphrase
          ? this.encrypt(credential.jumpHostPassphrase)
          : undefined;
      }

      credentials[profileId] = updated;
      store.set('credentials', credentials);

      return true;
    } catch (error) {
      console.error('Failed to save SSH credential:', error);
      return false;
    }
  }

  /**
   * Get decrypted SSH credentials for a connection profile
   *
   * @param profileId - Connection profile identifier
   * @returns Decrypted credentials or null if not found
   */
  getCredential(profileId: string): SSHCredential | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const credentials = store.get('credentials');
      const stored = credentials[profileId];

      if (!stored) {
        return null;
      }

      const decrypted: SSHCredential = { profileId };

      if (stored.password) {
        decrypted.password = this.decrypt(stored.password);
      }
      if (stored.privateKey) {
        decrypted.privateKey = this.decrypt(stored.privateKey);
      }
      if (stored.passphrase) {
        decrypted.passphrase = this.decrypt(stored.passphrase);
      }
      if (stored.jumpHostPassword) {
        decrypted.jumpHostPassword = this.decrypt(stored.jumpHostPassword);
      }
      if (stored.jumpHostPrivateKey) {
        decrypted.jumpHostPrivateKey = this.decrypt(stored.jumpHostPrivateKey);
      }
      if (stored.jumpHostPassphrase) {
        decrypted.jumpHostPassphrase = this.decrypt(stored.jumpHostPassphrase);
      }

      return decrypted;
    } catch (error) {
      console.error('Failed to retrieve SSH credential:', error);
      return null;
    }
  }

  /**
   * Check if credentials exist for a connection profile
   *
   * @param profileId - Connection profile identifier
   * @returns true if credentials exist
   */
  hasCredential(profileId: string): boolean {
    const credentials = store.get('credentials');
    return !!credentials[profileId];
  }

  /**
   * Remove SSH credentials for a connection profile
   *
   * @param profileId - Connection profile identifier
   * @returns true if removed successfully
   */
  removeCredential(profileId: string): boolean {
    try {
      const credentials = store.get('credentials');
      if (credentials[profileId]) {
        delete credentials[profileId];
        store.set('credentials', credentials);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove SSH credential:', error);
      return false;
    }
  }

  /**
   * Get all profile IDs that have stored SSH credentials
   *
   * @returns Array of profile IDs
   */
  getStoredProfileIds(): string[] {
    const credentials = store.get('credentials');
    return Object.keys(credentials);
  }
}

export const sshCredentialStore = new SSHCredentialStoreService();

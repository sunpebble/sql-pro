/**
 * Password IPC Handler
 *
 * Handles all password storage-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  GetPasswordRequest,
  GetPasswordResponse,
  HasPasswordRequest,
  HasPasswordResponse,
  IsPasswordStorageAvailableResponse,
  RemovePasswordRequest,
  RemovePasswordResponse,
  SavePasswordRequest,
  SavePasswordResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import { passwordStorageService } from '../../services/password-storage';
import {  IpcHandler } from '../base/handler';
import { passwordChannels } from '../contracts/all-channels';

export class PasswordHandler extends IpcHandler {
  constructor() {
    super({ name: 'password' });
  }

  register(): void {
    this.handle(passwordChannels.isAvailable, this.isAvailable.bind(this));
    this.handle(passwordChannels.get, this.getPassword.bind(this));
    this.handle(passwordChannels.has, this.hasPassword.bind(this));
    this.handle(passwordChannels.save, this.savePassword.bind(this));
    this.handle(passwordChannels.remove, this.removePassword.bind(this));
  }

  private async isAvailable(
    _request: void,
    _ctx: HandlerContext
  ): Promise<IsPasswordStorageAvailableResponse> {
    const available = passwordStorageService.isAvailable();
    return { success: true, available };
  }

  private async getPassword(
    request: GetPasswordRequest,
    _ctx: HandlerContext
  ): Promise<GetPasswordResponse> {
    const identifier = request.identifier || request.dbPath || '';
    this.log('debug', 'Getting password', { identifier });
    const password = await passwordStorageService.getPassword(identifier);
    return { success: true, password: password ?? undefined };
  }

  private async hasPassword(
    request: HasPasswordRequest,
    _ctx: HandlerContext
  ): Promise<HasPasswordResponse> {
    const identifier = request.identifier || request.dbPath || '';
    this.log('debug', 'Checking password existence', { identifier });
    const hasPassword = await passwordStorageService.hasPassword(identifier);
    return { success: true, hasPassword };
  }

  private async savePassword(
    request: SavePasswordRequest,
    _ctx: HandlerContext
  ): Promise<SavePasswordResponse> {
    const identifier = request.identifier || request.dbPath || '';
    this.log('info', 'Saving password', { identifier });
    await passwordStorageService.savePassword(identifier, request.password);
    return { success: true };
  }

  private async removePassword(
    request: RemovePasswordRequest,
    _ctx: HandlerContext
  ): Promise<RemovePasswordResponse> {
    const identifier = request.identifier || request.dbPath || '';
    this.log('info', 'Removing password', { identifier });
    await passwordStorageService.removePassword(identifier);
    return { success: true };
  }
}

// Export singleton instance
export const passwordHandler = new PasswordHandler();

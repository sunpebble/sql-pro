/**
 * Pro IPC Handler
 *
 * Handles Pro feature activation and status management.
 */

import type { ProActivateRequest, ProStatus } from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  clearProStatus,
  getProStatus,
  saveProStatus,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';

export class ProHandler extends IpcHandler {
  constructor() {
    super({ name: 'pro' });
  }

  register(): void {
    this.handleLegacy('pro:activate', this.activate.bind(this));
    this.handleLegacy('pro:deactivate', this.deactivate.bind(this));
    this.handleLegacy('pro:get-status', this.getStatus.bind(this));
    this.handleLegacy('pro:clear-status', this.clearStatus.bind(this));
  }

  private async activate(
    request: ProActivateRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean }> {
    saveProStatus({
      isActive: true,
      activationDate: new Date().toISOString(),
      licenseKey: request.licenseKey,
    });
    return { success: true };
  }

  private async deactivate(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ success: boolean }> {
    clearProStatus();
    return { success: true };
  }

  private async getStatus(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ status: ProStatus | null }> {
    const status = getProStatus();
    return { status };
  }

  private async clearStatus(
    _request: void,
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    clearProStatus();
    return {};
  }
}

// Export singleton instance
export const proHandler = new ProHandler();

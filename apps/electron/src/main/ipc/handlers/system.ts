/**
 * System IPC Handler
 *
 * Handles all system-related IPC operations including shell and window management.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  CloseWindowRequest,
  CloseWindowResponse,
  CreateWindowResponse,
  FocusWindowRequest,
  FocusWindowResponse,
  GetAllWindowsResponse,
  GetCurrentWindowResponse,
  OpenExternalRequest,
  OpenExternalResponse,
  ShowItemInFolderRequest,
  ShowItemInFolderResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import process from 'node:process';
import { BrowserWindow, shell } from 'electron';
import { windowManager } from '../../services/window-manager';
import {  IpcHandler } from '../base/handler';
import { systemChannels, windowChannels } from '../contracts/all-channels';

export class SystemHandler extends IpcHandler {
  constructor() {
    super({ name: 'system' });
  }

  register(): void {
    // System operations
    this.handle(
      systemChannels.showItemInFolder,
      this.showItemInFolder.bind(this)
    );
    this.handle(systemChannels.openExternal, this.openExternal.bind(this));
    this.handle(systemChannels.getAppVersion, this.getAppVersion.bind(this));
    this.handle(systemChannels.getPlatform, this.getPlatform.bind(this));

    // Window operations
    this.handle(windowChannels.create, this.createWindow.bind(this));
    this.handle(windowChannels.close, this.closeWindow.bind(this));
    this.handle(windowChannels.focus, this.focusWindow.bind(this));
    this.handle(windowChannels.getAll, this.getAllWindows.bind(this));
    this.handle(windowChannels.getCurrent, this.getCurrentWindow.bind(this));
  }

  // ============ System Operations ============

  private async showItemInFolder(
    request: ShowItemInFolderRequest,
    _ctx: HandlerContext
  ): Promise<ShowItemInFolderResponse> {
    this.log('debug', 'Showing item in folder', { path: request.path });
    shell.showItemInFolder(request.path);
    return { success: true };
  }

  private async openExternal(
    request: OpenExternalRequest,
    _ctx: HandlerContext
  ): Promise<OpenExternalResponse> {
    this.log('debug', 'Opening external URL', { url: request.url });
    await shell.openExternal(request.url);
    return { success: true };
  }

  private async getAppVersion(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ version: string }> {
    const { app } = await import('electron');
    return { version: app.getVersion() };
  }

  private async getPlatform(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ platform: string }> {
    return { platform: process.platform };
  }

  // ============ Window Operations ============

  private async createWindow(
    _request: void,
    _ctx: HandlerContext
  ): Promise<CreateWindowResponse> {
    this.log('info', 'Creating new window');
    const windowId = windowManager.createWindow();
    return { success: true, windowId };
  }

  private async closeWindow(
    request: CloseWindowRequest,
    _ctx: HandlerContext
  ): Promise<CloseWindowResponse> {
    const windowIdStr = request?.windowId;
    this.log('info', 'Closing window', { windowId: windowIdStr });

    if (windowIdStr) {
      const windowId = Number.parseInt(windowIdStr, 10);
      if (Number.isNaN(windowId)) {
        return { success: false, error: 'Invalid window ID' };
      }
      const window = BrowserWindow.fromId(windowId);
      if (window && !window.isDestroyed()) {
        window.close();
      }
    }
    return { success: true };
  }

  private async focusWindow(
    request: FocusWindowRequest,
    _ctx: HandlerContext
  ): Promise<FocusWindowResponse> {
    this.log('debug', 'Focusing window', { windowId: request.windowId });

    const window = BrowserWindow.fromId(request.windowId);
    if (window && !window.isDestroyed()) {
      window.focus();
      return { success: true };
    }
    return { success: false, error: 'Window not found' };
  }

  private async getAllWindows(
    _request: void,
    _ctx: HandlerContext
  ): Promise<GetAllWindowsResponse> {
    this.log('debug', 'Getting all windows');

    const windowIds = BrowserWindow.getAllWindows()
      .filter((w) => !w.isDestroyed())
      .map((w) => String(w.id));

    return { success: true, windowIds };
  }

  private async getCurrentWindow(
    _request: void,
    ctx: HandlerContext
  ): Promise<GetCurrentWindowResponse> {
    this.log('debug', 'Getting current window');

    const window = BrowserWindow.fromWebContents(ctx.event.sender);
    if (window && !window.isDestroyed()) {
      return {
        success: true,
        windowId: String(window.id),
      };
    }
    return { success: false, error: 'No current window found' };
  }
}

// Export singleton instance
export const systemHandler = new SystemHandler();

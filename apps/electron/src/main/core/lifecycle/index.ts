/**
 * Application Lifecycle Manager
 *
 * Centralized management of application lifecycle events:
 * - App initialization and shutdown
 * - Window creation and management
 * - IPC handler registration
 * - Plugin system lifecycle
 */

import { join } from 'node:path';
import process from 'node:process';
import { IPC_CHANNELS } from '@shared/types';
import { app, BrowserWindow, ipcMain, nativeImage, shell } from 'electron';

// Inline utilities to avoid @electron-toolkit/utils initialization issues
export const is = {
  get dev() {
    return !app.isPackaged;
  },
};

/**
 * Get the app icon path based on platform
 */
export function getIconPath(): string {
  const resourcesPath = is.dev
    ? join(__dirname, '../../resources')
    : join(process.resourcesPath, 'resources');

  if (process.platform === 'win32') {
    return join(resourcesPath, 'icon.ico');
  } else {
    return join(resourcesPath, 'icon.png');
  }
}

/**
 * Application lifecycle state
 */
export interface LifecycleState {
  isInitialized: boolean;
  isQuitting: boolean;
  mainWindowId: string | null;
}

/**
 * Lifecycle event handlers
 */
export interface LifecycleHandlers {
  onBeforeQuit?: () => Promise<boolean>;
  onWindowAllClosed?: () => Promise<void>;
  onActivate?: () => void;
}

class LifecycleManager {
  private state: LifecycleState = {
    isInitialized: false,
    isQuitting: false,
    mainWindowId: null,
  };

  private handlers: LifecycleHandlers = {};
  private cleanupCallbacks: Array<() => void | Promise<void>> = [];

  /**
   * Get current lifecycle state
   */
  getState(): Readonly<LifecycleState> {
    return { ...this.state };
  }

  /**
   * Check if app is in development mode
   */
  isDev(): boolean {
    return is.dev;
  }

  /**
   * Set lifecycle event handlers
   */
  setHandlers(handlers: LifecycleHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Register a cleanup callback to run on shutdown
   */
  onCleanup(callback: () => void | Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Mark app as quitting
   */
  setQuitting(value: boolean): void {
    this.state.isQuitting = value;
  }

  /**
   * Check if app is quitting
   */
  isQuitting(): boolean {
    return this.state.isQuitting;
  }

  /**
   * Set main window ID
   */
  setMainWindowId(id: string | null): void {
    this.state.mainWindowId = id;
  }

  /**
   * Get main window ID
   */
  getMainWindowId(): string | null {
    return this.state.mainWindowId;
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.warn('[Lifecycle] Already initialized');
      return;
    }

    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.quarry.app');
    }

    // Set app name for development mode
    if (is.dev) {
      app.name = 'Quarry';
    }

    // Set Dock icon on macOS
    if (process.platform === 'darwin') {
      const iconPath = getIconPath();
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        app.dock?.setIcon(icon);
      }
    }

    this.state.isInitialized = true;
  }

  /**
   * Setup quit confirmation handler
   */
  setupQuitConfirmation(): void {
    // Intercept application quit to check for unsaved changes
    app.on('before-quit', (event) => {
      if (!this.state.isQuitting) {
        event.preventDefault();

        // Send message to all windows to check for unsaved changes
        const allWindows = BrowserWindow.getAllWindows();
        for (const window of allWindows) {
          window.webContents.send(IPC_CHANNELS.PREVENT_QUIT);
        }
      }
    });

    // Handle renderer's response to quit confirmation
    ipcMain.handle('app:confirm-quit', async (_event, { shouldQuit }) => {
      if (shouldQuit) {
        this.state.isQuitting = true;
        app.quit();
      } else {
        this.state.isQuitting = false;
      }
      return { success: true };
    });
  }

  /**
   * Setup security handlers
   */
  setupSecurity(): void {
    // Restrict navigation to prevent loading untrusted content
    app.on('web-contents-created', (_, contents) => {
      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        const allowedOrigins = [
          'file://',
          process.env.ELECTRON_RENDERER_URL || '',
        ].filter(Boolean);

        const isAllowed = allowedOrigins.some(
          (origin) =>
            navigationUrl.startsWith(origin) || parsedUrl.protocol === 'file:'
        );

        if (!isAllowed) {
          event.preventDefault();
          shell.openExternal(navigationUrl);
        }
      });

      contents.on('will-attach-webview', (event, webPreferences) => {
        delete webPreferences.preload;
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
      });
    });
  }

  /**
   * Setup window shortcut handlers
   */
  setupWindowShortcuts(): void {
    app.on('browser-window-created', (_, window) => {
      window.webContents.on('before-input-event', (event, input) => {
        if (!is.dev && input.key === 'F5') {
          event.preventDefault();
        }
        if (!is.dev && input.control && input.key === 'r') {
          event.preventDefault();
        }
        if (!is.dev) {
          if (input.key === 'F12') {
            event.preventDefault();
          }
          if (input.meta && input.alt && input.key.toLowerCase() === 'i') {
            event.preventDefault();
          }
          if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
          }
        }
      });
    });
  }

  /**
   * Run all cleanup callbacks
   */
  async cleanup(): Promise<void> {
    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('[Lifecycle] Cleanup error:', error);
      }
    }
    this.cleanupCallbacks = [];
  }

  /**
   * Shutdown the application gracefully
   */
  async shutdown(): Promise<void> {
    await this.cleanup();
    this.state.isInitialized = false;
  }
}

// Export singleton instance
export const lifecycleManager = new LifecycleManager();

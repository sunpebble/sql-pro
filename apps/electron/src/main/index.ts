/**
 * SQL Pro - Main Process Entry Point
 *
 * This is the entry point for the Electron main process.
 * It initializes all core systems and sets up the application.
 */

import process from 'node:process';
import { app, BrowserWindow, ipcMain, shell } from 'electron';

// Core system imports
import {
  createApplicationMenu,
  lifecycleManager,
  registerLanguageHandler,
  registerShortcutsHandler,
  windowManager,
} from './core';

import { cleanupAllHandlers, registerAllHandlers } from './ipc/handlers/index';
// Services
import { fileWatcherService } from './services/file-watcher';
import {
  registerImageProxyScheme,
  setupImageProxyHandler,
} from './services/image-proxy';
import { pluginService } from './services/plugin/PluginService';
import { removeRecentConnection } from './services/store';
import { checkForUpdatesOnStartup, initAutoUpdater } from './services/updater';

// Handle EIO errors that occur when stdout/stderr is closed during app exit.
// This happens when async operations (like image proxy requests) try to log
// after the process streams are already closed.
process.on('uncaughtException', (error) => {
  // Silently ignore EIO errors during shutdown - these are expected
  if (error.message === 'write EIO') {
    return;
  }
  // Re-throw other errors to preserve default behavior
  throw error;
});

// Register custom sqlpro:// protocol scheme BEFORE app is ready
// This enables proxying remote images and bypassing CORS
registerImageProxyScheme();

// Security: Enable sandbox for all renderers globally
app.enableSandbox();

// Application ready handler
app.whenReady().then(async () => {
  // Initialize lifecycle manager (sets app name, user model ID, dock icon)
  await lifecycleManager.initialize();

  // Setup IPC handlers via IpcHandler-based system
  registerAllHandlers();

  // Setup image proxy protocol handler
  setupImageProxyHandler();

  // Register shortcuts sync handler
  registerShortcutsHandler();

  // Register language sync handler for menu translations
  registerLanguageHandler();

  // Initialize plugin system (after IPC handlers are ready)
  const pluginInitResult = await pluginService.initialize();
  if (!pluginInitResult.success) {
    // Log warning but don't block app startup - plugin system is non-critical
    console.warn(
      'Plugin system initialization failed:',
      pluginInitResult.error
    );
  }

  // Initialize auto-updater
  initAutoUpdater();

  // Create native application menu
  createApplicationMenu();

  // Setup window shortcuts (prevents refresh/devtools in production)
  lifecycleManager.setupWindowShortcuts();

  // Setup security handlers (restricts navigation)
  lifecycleManager.setupSecurity();

  // Setup quit confirmation handler
  lifecycleManager.setupQuitConfirmation();

  // Register cleanup callbacks
  lifecycleManager.onCleanup(async () => {
    await pluginService.shutdown();
    fileWatcherService.unwatchAll();
    cleanupAllHandlers();
  });

  // Create the main window with state persistence
  const mainWindow = windowManager.createMainWindow();

  // Setup external link handler for the main window
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Handle macOS activate (dock click when no windows open)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = windowManager.createMainWindow();
      newWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
      });
    }
  });

  // Check for updates after startup (5 second delay)
  checkForUpdatesOnStartup();
});

// Handle window-all-closed event
app.on('window-all-closed', async () => {
  // On macOS, apps typically stay active even with no windows open
  if (process.platform !== 'darwin') {
    await lifecycleManager.cleanup();
    app.quit();
  }
});

// Handle removing a recent connection from the list
ipcMain.handle(
  'app:remove-recent-connection',
  async (_event, { connectionId }: { connectionId: string }) => {
    return removeRecentConnection(connectionId);
  }
);

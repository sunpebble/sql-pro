import type { UpdateStatus } from '@shared/types';
import type {
  AppUpdater,
  UpdateDownloadedEvent,
  UpdateInfo,
} from 'electron-updater';
import process from 'node:process';
import { app, BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
// Static import so Vite can bundle electron-updater and its dependencies
import { autoUpdater as electronAutoUpdater } from 'electron-updater';

// Cloudflare R2 release URL
const UPDATE_SERVER_URL = 'https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev';

let _autoUpdater: AppUpdater | null = null;
let _autoUpdaterInitialized = false;

function getAutoUpdater(): AppUpdater {
  if (!_autoUpdater) {
    _autoUpdater = electronAutoUpdater;

    // Configure for generic provider with Cloudflare R2
    _autoUpdater.setFeedURL({
      provider: 'generic',
      url: UPDATE_SERVER_URL,
      channel: 'latest',
    });
  }
  return _autoUpdater as AppUpdater;
}

let updateStatus: UpdateStatus = { status: 'not-available' };

/**
 * Get the current update status
 */
export function getUpdateStatus(): UpdateStatus {
  return updateStatus;
}

/**
 * Send update status to all renderer windows
 */
function notifyUpdateStatus(status: UpdateStatus): void {
  updateStatus = status;
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send('update-status', status);
    }
  });
}

/**
 * Initialize the auto-updater with event handlers
 */
export function initAutoUpdater(): AppUpdater {
  const autoUpdater = getAutoUpdater();

  // Only initialize once
  if (_autoUpdaterInitialized) {
    return autoUpdater;
  }
  _autoUpdaterInitialized = true;

  // Configure logging for auto-updater
  autoUpdater.logger = log;
  (autoUpdater.logger as typeof log).transports.file.level = 'info';

  // Log update server configuration
  log.info('Auto-updater initialized');
  log.info(`  Update server: ${UPDATE_SERVER_URL}`);
  log.info(`  Current version: ${app.getVersion()}`);
  log.info(`  Platform: ${process.platform}`);

  // Auto-updater configuration
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Allow downloading pre-release versions if current version is pre-release
  autoUpdater.allowPrerelease = app.getVersion().includes('-');

  // Check for updates error
  autoUpdater.on('error', (error: Error) => {
    log.error('Auto-updater error:', error.message);
    log.error('  Stack:', error.stack);
    notifyUpdateStatus({ status: 'error', error });
  });

  // Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    notifyUpdateStatus({ status: 'checking' });
  });

  // Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info.version);
    notifyUpdateStatus({
      status: 'available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes:
          typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      },
    });

    // Show dialog to user
    const windows = BrowserWindow.getAllWindows();
    const focusedWindow = BrowserWindow.getFocusedWindow() || windows[0];

    if (focusedWindow && !focusedWindow.isDestroyed()) {
      dialog
        .showMessageBox(focusedWindow, {
          type: 'info',
          title: 'Update Available',
          message: `A new version (${info.version}) is available.`,
          detail: `Current version: ${app.getVersion()}\n\nWould you like to download and install it now?`,
          buttons: ['Download', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            downloadUpdate();
          }
        });
    }
  });

  // No update available
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    log.info('No update available. Current version is up to date.');
    notifyUpdateStatus({
      status: 'not-available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes:
          typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      },
    });
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    log.info(`Download progress: ${progress.percent.toFixed(1)}%`);
    notifyUpdateStatus({
      status: 'downloading',
      progress: {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred,
      },
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateDownloadedEvent) => {
    log.info('Update downloaded:', info.version);
    notifyUpdateStatus({
      status: 'downloaded',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes:
          typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      },
    });

    // Show dialog to restart
    const windows = BrowserWindow.getAllWindows();
    const focusedWindow = BrowserWindow.getFocusedWindow() || windows[0];

    if (focusedWindow && !focusedWindow.isDestroyed()) {
      dialog
        .showMessageBox(focusedWindow, {
          type: 'info',
          title: 'Update Ready',
          message: 'Update downloaded successfully.',
          detail: `Version ${info.version} has been downloaded. Restart now to apply the update?`,
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            quitAndInstall();
          }
        });
    }
  });

  return autoUpdater;
}

/**
 * Check for updates manually
 * @param silent - If true, don't show dialog when no update is available
 */
export async function checkForUpdates(silent = false): Promise<void> {
  log.info(`Checking for updates... (silent: ${silent})`);
  log.info(`  Fetching from: ${UPDATE_SERVER_URL}/latest-mac.yml`);

  try {
    const result = await getAutoUpdater().checkForUpdates();

    if (result?.updateInfo) {
      log.info(`  Server version: ${result.updateInfo.version}`);
      log.info(`  Current version: ${app.getVersion()}`);

      const isUpdateAvailable = result.updateInfo.version !== app.getVersion();

      if (!silent && !isUpdateAvailable) {
        const windows = BrowserWindow.getAllWindows();
        const focusedWindow = BrowserWindow.getFocusedWindow() || windows[0];

        if (focusedWindow && !focusedWindow.isDestroyed()) {
          dialog.showMessageBox(focusedWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version.',
            detail: `Current version: ${app.getVersion()}`,
            buttons: ['OK'],
          });
        }
      }
    } else {
      log.warn('  No update info received from server');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to check for updates:', errorMessage);

    if (!silent) {
      const windows = BrowserWindow.getAllWindows();
      const focusedWindow = BrowserWindow.getFocusedWindow() || windows[0];

      if (focusedWindow && !focusedWindow.isDestroyed()) {
        dialog.showMessageBox(focusedWindow, {
          type: 'error',
          title: 'Update Error',
          message: 'Failed to check for updates.',
          detail: `${errorMessage}\n\nUpdate server: ${UPDATE_SERVER_URL}`,
          buttons: ['OK'],
        });
      }
    }
  }
}

/**
 * Download the available update
 */
export function downloadUpdate(): void {
  log.info('Starting update download...');
  getAutoUpdater().downloadUpdate();
}

/**
 * Quit the app and install the update
 */
export function quitAndInstall(): void {
  log.info('Quitting and installing update...');
  getAutoUpdater().quitAndInstall(false, true);
}

/**
 * Check for updates on app startup (with delay)
 */
export function checkForUpdatesOnStartup(delayMs = 5000): void {
  // Only check in production
  if (app.isPackaged) {
    setTimeout(() => {
      checkForUpdates(true);
    }, delayMs);
  }
}

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { IPC_CHANNELS } from '@shared/types';
import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  session,
  shell,
} from 'electron';
import {
  getWindowBoundsOptions,
  loadWindowState,
  saveWindowState,
} from './lib/window-state';
import { fileWatcherService } from './services/file-watcher';
import { cleanupIpcHandlers, setupIpcHandlers } from './services/ipc-handlers';
import {
  createApplicationMenu,
  registerShortcutsHandler,
} from './services/menu';
import { pluginService } from './services/plugin/PluginService';
import { checkForUpdatesOnStartup, initAutoUpdater } from './services/updater';
import { windowManager } from './services/window-manager';

// Inline utilities to avoid @electron-toolkit/utils initialization issues
// Use getter to defer app.isPackaged access until after app ready
const is = {
  get dev() {
    return !app.isPackaged;
  },
};

// React DevTools extension ID from Chrome Web Store
const REACT_DEVTOOLS_ID = 'fmkadmapgofadopljbjfkapdkoienihi';

// Get Chrome extensions directory based on platform
function getChromeExtensionsPath(): string | null {
  const home = homedir();

  if (process.platform === 'darwin') {
    return join(
      home,
      'Library/Application Support/Google/Chrome/Default/Extensions'
    );
  } else if (process.platform === 'win32') {
    return join(
      home,
      'AppData/Local/Google/Chrome/User Data/Default/Extensions'
    );
  } else if (process.platform === 'linux') {
    return join(home, '.config/google-chrome/Default/Extensions');
  }
  return null;
}

// Find the latest version of an extension
function findLatestExtensionVersion(extensionPath: string): string | null {
  if (!existsSync(extensionPath)) return null;

  const versions = readdirSync(extensionPath).filter(
    (name) => !name.startsWith('.')
  );
  if (versions.length === 0) return null;

  // Sort versions and get the latest
  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return versions[0];
}

// Install Chrome DevTools extensions (React, etc.) in development mode
async function installDevToolsExtensions(): Promise<void> {
  if (!is.dev) return;

  const extensionsPath = getChromeExtensionsPath();
  if (!extensionsPath) {
    console.warn('Chrome extensions path not found for this platform');
    return;
  }

  const reactDevToolsPath = join(extensionsPath, REACT_DEVTOOLS_ID);
  const latestVersion = findLatestExtensionVersion(reactDevToolsPath);

  if (!latestVersion) {
    console.warn(
      'React DevTools not found in Chrome. Please install it from Chrome Web Store first.'
    );
    return;
  }

  const extensionFullPath = join(reactDevToolsPath, latestVersion);

  try {
    await session.defaultSession.extensions.loadExtension(extensionFullPath, {
      allowFileAccess: true,
    });
  } catch (err) {
    console.warn('Failed to load React DevTools:', err);
  }
}

function setAppUserModelId(id: string): void {
  if (process.platform === 'win32') {
    app.setAppUserModelId(id);
  }
}

function watchWindowShortcuts(window: BrowserWindow): void {
  window.webContents.on('before-input-event', (event, input) => {
    // Prevent default refresh shortcuts in production
    if (!is.dev && input.key === 'F5') {
      event.preventDefault();
    }
    if (!is.dev && input.control && input.key === 'r') {
      event.preventDefault();
    }
    // Prevent DevTools shortcuts in production
    // F12, Cmd+Option+I (macOS), Ctrl+Shift+I (Windows/Linux)
    if (!is.dev) {
      if (input.key === 'F12') {
        event.preventDefault();
      }
      // Cmd+Option+I on macOS
      if (input.meta && input.alt && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
      // Ctrl+Shift+I on Windows/Linux
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        event.preventDefault();
      }
    }
  });
}

// Get the app icon path based on platform
function getIconPath(): string {
  const resourcesPath = is.dev
    ? join(__dirname, '../../resources')
    : join(process.resourcesPath, 'resources');

  if (process.platform === 'win32') {
    return join(resourcesPath, 'icon.ico');
  } else {
    // Use PNG for macOS and Linux - nativeImage has better PNG support
    return join(resourcesPath, 'icon.png');
  }
}

function createWindow(): BrowserWindow {
  // Create icon for the window
  const iconPath = getIconPath();
  const icon = nativeImage.createFromPath(iconPath);

  // Load saved window state
  const savedState = loadWindowState();
  const boundsOptions = getWindowBoundsOptions();

  const mainWindow = new BrowserWindow({
    ...boundsOptions,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: icon.isEmpty() ? undefined : icon,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    // macOS native vibrancy effect for sidebar blur
    vibrancy: 'sidebar',
    visualEffectState: 'followWindow',
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // Native app experience - disable browser features
      spellcheck: false,
      enableWebSQL: false,
    },
  });

  // Restore maximized/fullscreen state
  if (savedState.isMaximized) {
    mainWindow.maximize();
  } else if (savedState.isFullScreen) {
    mainWindow.setFullScreen(true);
  }

  // Save window state on close and resize
  const saveState = () => {
    if (!mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      saveWindowState({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen(),
      });
    }
  };

  mainWindow.on('close', saveState);
  mainWindow.on('resize', saveState);
  mainWindow.on('move', saveState);

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  // Set app name for development mode (must be after app is ready)
  if (is.dev) {
    app.name = 'SQL Pro';
  }

  // Set Dock icon on macOS (especially important for development mode)
  if (process.platform === 'darwin') {
    const iconPath = getIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock?.setIcon(icon);
    } else {
      console.warn('[Dev] Icon file not found or empty at:', iconPath);
    }
  }

  setAppUserModelId('com.sqlpro.app');

  // Install DevTools extensions in development mode
  await installDevToolsExtensions();

  // Setup IPC handlers for database operations
  setupIpcHandlers();

  // Register shortcuts sync handler
  registerShortcutsHandler();

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

  app.on('browser-window-created', (_, window) => {
    watchWindowShortcuts(window);
  });

  // Create the initial window and register it with the window manager
  const mainWindow = createWindow();
  windowManager.registerWindow(mainWindow);

  app.on('activate', () => {
    // On macOS, re-create a window when the dock icon is clicked and no windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createWindow();
      windowManager.registerWindow(newWindow);
    }
  });

  // Check for updates after startup (5 second delay)
  checkForUpdatesOnStartup();
});

app.on('window-all-closed', async () => {
  // Shutdown plugin system (unloads all plugins)
  await pluginService.shutdown();

  // Clean up file watchers
  fileWatcherService.unwatchAll();

  // On macOS, apps typically stay active even with no windows open
  // Don't cleanup IPC handlers here since new windows can still be created
  if (process.platform !== 'darwin') {
    cleanupIpcHandlers();
    app.quit();
  }
});

// Track if we're in the process of quitting to avoid infinite loop
let quitting = false;

// Intercept application quit to check for unsaved changes
app.on('before-quit', (event) => {
  if (!quitting) {
    // Prevent quit and ask renderer to check for unsaved changes
    event.preventDefault();

    // Send message to all windows to check for unsaved changes
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach((window) => {
      window.webContents.send(IPC_CHANNELS.PREVENT_QUIT);
    });
  }
});

// Handle renderer's response to quit confirmation
ipcMain.handle('app:confirm-quit', async (_event, { shouldQuit }) => {
  if (shouldQuit) {
    // User confirmed quit - set flag and actually quit
    quitting = true;
    app.quit();
  } else {
    // User cancelled quit - reset flag
    quitting = false;
  }
  return { success: true };
});

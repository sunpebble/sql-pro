/**
 * Window State Manager
 *
 * Manages window position, size, and state persistence.
 */

import { screen } from 'electron';
import Store from 'electron-store';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

interface WindowStateStoreSchema {
  windowState: WindowState;
}

const DEFAULT_STATE: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
  isFullScreen: false,
};

// Lazy initialization to avoid creating store before app is ready
let _store: Store<WindowStateStoreSchema> | null = null;

function getStore(): Store<WindowStateStoreSchema> {
  if (!_store) {
    _store = new Store<WindowStateStoreSchema>({
      name: 'window-state',
      defaults: {
        windowState: DEFAULT_STATE,
      },
    });
  }
  return _store;
}

/**
 * Load the saved window state from persistent storage
 */
export function loadWindowState(): WindowState {
  const savedState = getStore().get('windowState', DEFAULT_STATE);

  // Validate that the saved position is still visible on a connected display
  if (savedState.x !== undefined && savedState.y !== undefined) {
    const displays = screen.getAllDisplays();
    const isVisible = displays.some((display) => {
      const { x, y, width, height } = display.bounds;
      return (
        savedState.x! >= x &&
        savedState.x! < x + width &&
        savedState.y! >= y &&
        savedState.y! < y + height
      );
    });

    // If the saved position is not visible, reset to center
    if (!isVisible) {
      return {
        ...savedState,
        x: undefined,
        y: undefined,
      };
    }
  }

  return savedState;
}

/**
 * Save the window state to persistent storage
 */
export function saveWindowState(state: WindowState): void {
  getStore().set('windowState', state);
}

/**
 * Get window bounds options for BrowserWindow constructor
 */
export function getWindowBoundsOptions(): Partial<Electron.BrowserWindowConstructorOptions> {
  const state = loadWindowState();

  return {
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
  };
}

/**
 * Get default window state
 */
export function getDefaultWindowState(): WindowState {
  return { ...DEFAULT_STATE };
}

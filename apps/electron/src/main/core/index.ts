/**
 * Core Module Index
 *
 * Exports all core system components.
 */

// Lifecycle management
export {
  getIconPath,
  is,
  type LifecycleHandlers,
  lifecycleManager,
  type LifecycleState,
} from './lifecycle';

// Menu management
export {
  createApplicationMenu,
  getCurrentLanguage,
  registerLanguageHandler,
  registerShortcutsHandler,
  updateLanguage,
  updateShortcuts,
} from './menu';

// Window management
export {
  getDefaultWindowState,
  getWindowBoundsOptions,
  loadWindowState,
  saveWindowState,
  type WindowInfo,
  windowManager,
  type WindowManagerOptions,
  type WindowState,
} from './window';

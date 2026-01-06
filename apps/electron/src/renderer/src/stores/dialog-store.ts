import type { RecentConnection } from '@shared/types';
import { create } from 'zustand';

/**
 * Global dialog store for managing application-wide dialogs
 * This allows dialogs to be opened from anywhere in the app
 */
interface DialogState {
  // Settings dialog
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Connection settings dialog for editing existing connections
  connectionSettingsOpen: boolean;
  connectionSettingsTarget: RecentConnection | null;
  openConnectionSettings: (connection?: RecentConnection | null) => void;
  closeConnectionSettings: () => void;

  // Change password dialog
  changePasswordOpen: boolean;
  changePasswordTarget: {
    connectionId: string;
    filename: string;
    dbPath: string;
    isEncrypted: boolean;
  } | null;
  openChangePassword: (target: {
    connectionId: string;
    filename: string;
    dbPath: string;
    isEncrypted: boolean;
  }) => void;
  closeChangePassword: () => void;

  // Memory monitor panel (developer tools)
  memoryMonitorOpen: boolean;
  openMemoryMonitor: () => void;
  closeMemoryMonitor: () => void;
  toggleMemoryMonitor: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  // Settings dialog
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  // Connection settings dialog
  connectionSettingsOpen: false,
  connectionSettingsTarget: null,
  openConnectionSettings: (connection = null) =>
    set({
      connectionSettingsOpen: true,
      connectionSettingsTarget: connection,
    }),
  closeConnectionSettings: () =>
    set({
      connectionSettingsOpen: false,
      connectionSettingsTarget: null,
    }),

  // Change password dialog
  changePasswordOpen: false,
  changePasswordTarget: null,
  openChangePassword: (target) =>
    set({
      changePasswordOpen: true,
      changePasswordTarget: target,
    }),
  closeChangePassword: () =>
    set({
      changePasswordOpen: false,
      changePasswordTarget: null,
    }),

  // Memory monitor panel (developer tools)
  memoryMonitorOpen: false,
  openMemoryMonitor: () => set({ memoryMonitorOpen: true }),
  closeMemoryMonitor: () => set({ memoryMonitorOpen: false }),
  toggleMemoryMonitor: () =>
    set((state) => ({ memoryMonitorOpen: !state.memoryMonitorOpen })),
}));

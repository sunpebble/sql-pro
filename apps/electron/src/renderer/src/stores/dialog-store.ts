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

  // Keyboard shortcuts dialog
  shortcutsOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;

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

  // About dialog
  aboutOpen: boolean;
  openAbout: () => void;
  closeAbout: () => void;

  // Update check dialog
  updateCheckOpen: boolean;
  updateCheckMessage: string;
  updateAvailable: boolean;
  updateInfo: {
    version: string;
    releaseDate?: string;
    releaseNotes?: string;
  } | null;
  openUpdateCheck: (
    message: string,
    updateAvailable?: boolean,
    updateInfo?: {
      version: string;
      releaseDate?: string;
      releaseNotes?: string;
    }
  ) => void;
  closeUpdateCheck: () => void;

  // Changes panel (pending changes diff preview)
  changesPanelOpen: boolean;
  openChangesPanel: () => void;
  closeChangesPanel: () => void;
  toggleChangesPanel: () => void;

  // Backup/Restore dialog
  backupDialogOpen: boolean;
  openBackupDialog: () => void;
  closeBackupDialog: () => void;

  // AI Agent sidebar
  agentSidebarOpen: boolean;
  agentConnectionId: string | null;
  openAgentSidebar: (connectionId: string) => void;
  closeAgentSidebar: () => void;
  toggleAgentSidebar: (connectionId?: string) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  // Settings dialog
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  // Keyboard shortcuts dialog
  shortcutsOpen: false,
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),

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

  // About dialog
  aboutOpen: false,
  openAbout: () => set({ aboutOpen: true }),
  closeAbout: () => set({ aboutOpen: false }),

  // Update check dialog
  updateCheckOpen: false,
  updateCheckMessage: '',
  updateAvailable: false,
  updateInfo: null,
  openUpdateCheck: (message, updateAvailable = false, updateInfo = undefined) =>
    set({
      updateCheckOpen: true,
      updateCheckMessage: message,
      updateAvailable,
      updateInfo: updateInfo || null,
    }),
  closeUpdateCheck: () =>
    set({
      updateCheckOpen: false,
      updateCheckMessage: '',
      updateAvailable: false,
      updateInfo: null,
    }),

  // Changes panel (pending changes diff preview)
  changesPanelOpen: false,
  openChangesPanel: () => set({ changesPanelOpen: true }),
  closeChangesPanel: () => set({ changesPanelOpen: false }),
  toggleChangesPanel: () =>
    set((state) => ({ changesPanelOpen: !state.changesPanelOpen })),

  // Backup/Restore dialog
  backupDialogOpen: false,
  openBackupDialog: () => set({ backupDialogOpen: true }),
  closeBackupDialog: () => set({ backupDialogOpen: false }),

  // AI Agent sidebar
  agentSidebarOpen: false,
  agentConnectionId: null,
  openAgentSidebar: (connectionId) =>
    set({
      agentSidebarOpen: true,
      agentConnectionId: connectionId,
    }),
  closeAgentSidebar: () =>
    set({
      agentSidebarOpen: false,
    }),
  toggleAgentSidebar: (connectionId) =>
    set((state) => ({
      agentSidebarOpen: connectionId ? !state.agentSidebarOpen : false,
      agentConnectionId: connectionId ?? state.agentConnectionId,
    })),
}));

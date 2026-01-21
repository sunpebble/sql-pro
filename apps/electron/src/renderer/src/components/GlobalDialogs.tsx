import type { RecentConnection } from '@shared/types';
import type { ConnectionSettings } from './ConnectionSettingsDialog';
import { useCallback, useEffect, useState } from 'react';
import { MemoryMonitorPanel } from '@/components/dev-tools';
import { sqlPro } from '@/lib/api';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { AboutDialog } from './AboutDialog';
import { AIAgentDialog } from './agent';
import { BackupRestoreDialog } from './backup';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ConnectionSettingsDialog } from './ConnectionSettingsDialog';
import { DatabaseDashboard } from './database-dashboard';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { SettingsDialog } from './SettingsDialog';
import { UpdateCheckDialog } from './UpdateCheckDialog';

/**
 * Global dialog provider component that renders application-wide dialogs.
 * This should be placed in the root layout to ensure dialogs are available everywhere.
 */
export function GlobalDialogs() {
  const setRecentConnections = useConnectionStore(
    (s) => s.setRecentConnections
  );

  // Settings dialog state from store
  const settingsOpen = useDialogStore((s) => s.settingsOpen);
  const closeSettings = useDialogStore((s) => s.closeSettings);

  // Keyboard shortcuts dialog state from store
  const shortcutsOpen = useDialogStore((s) => s.shortcutsOpen);
  const closeShortcuts = useDialogStore((s) => s.closeShortcuts);

  // Connection settings dialog state from store
  const connectionSettingsOpen = useDialogStore(
    (s) => s.connectionSettingsOpen
  );
  const connectionSettingsTarget = useDialogStore(
    (s) => s.connectionSettingsTarget
  );
  const closeConnectionSettings = useDialogStore(
    (s) => s.closeConnectionSettings
  );

  // Change password dialog state from store
  const changePasswordOpen = useDialogStore((s) => s.changePasswordOpen);
  const changePasswordTarget = useDialogStore((s) => s.changePasswordTarget);
  const closeChangePassword = useDialogStore((s) => s.closeChangePassword);

  // Memory monitor panel state from store
  const memoryMonitorOpen = useDialogStore((s) => s.memoryMonitorOpen);
  const closeMemoryMonitor = useDialogStore((s) => s.closeMemoryMonitor);

  // Backup dialog state from store
  const backupDialogOpen = useDialogStore((s) => s.backupDialogOpen);
  const closeBackupDialog = useDialogStore((s) => s.closeBackupDialog);

  // Dashboard dialog state from store
  const dashboardOpen = useDialogStore((s) => s.dashboardOpen);
  const dashboardConnectionId = useDialogStore((s) => s.dashboardConnectionId);
  const dashboardDatabaseName = useDialogStore((s) => s.dashboardDatabaseName);
  const closeDashboard = useDialogStore((s) => s.closeDashboard);

  // AI Agent dialog state from store
  const agentOpen = useDialogStore((s) => s.agentOpen);
  const agentConnectionId = useDialogStore((s) => s.agentConnectionId);
  const closeAgent = useDialogStore((s) => s.closeAgent);

  // Computed properties for connection settings dialog
  const [editFilename, setEditFilename] = useState('');
  const [editDbPath, setEditDbPath] = useState('');
  const [editIsEncrypted, setEditIsEncrypted] = useState(false);
  const [editInitialValues, setEditInitialValues] = useState<{
    displayName?: string;
    readOnly?: boolean;
  }>({});

  // Update edit state when target changes
  useEffect(() => {
    if (connectionSettingsTarget) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on target change
      setEditFilename(connectionSettingsTarget.filename);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on target change
      setEditDbPath(connectionSettingsTarget.path);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on target change
      setEditIsEncrypted(connectionSettingsTarget.isEncrypted);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on target change
      setEditInitialValues({
        displayName: connectionSettingsTarget.displayName,
        readOnly: connectionSettingsTarget.readOnly,
      });
    }
  }, [connectionSettingsTarget]);

  // Handle connection settings submit
  const handleConnectionSettingsSubmit = useCallback(
    async (settings: ConnectionSettings) => {
      if (!connectionSettingsTarget) return;

      // Update the connection settings
      const result = await sqlPro.connection.update({
        path: connectionSettingsTarget.path,
        displayName: settings.displayName,
        readOnly: settings.readOnly,
      });

      if (result.success) {
        // Refresh recent connections to show updated settings
        const connectionsResult = await sqlPro.app.getRecentConnections();
        if (connectionsResult.success && connectionsResult.connections) {
          setRecentConnections(
            connectionsResult.connections as RecentConnection[]
          );
        }
      }

      closeConnectionSettings();
    },
    [connectionSettingsTarget, setRecentConnections, closeConnectionSettings]
  );

  return (
    <>
      {/* Global Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={closeSettings} />

      {/* Global Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsSettings
        open={shortcutsOpen}
        onOpenChange={closeShortcuts}
      />

      {/* Global Connection Settings Dialog for editing connections */}
      {connectionSettingsTarget && (
        <ConnectionSettingsDialog
          open={connectionSettingsOpen}
          onOpenChange={(open) => {
            if (!open) closeConnectionSettings();
          }}
          filename={editFilename}
          dbPath={editDbPath}
          isEncrypted={editIsEncrypted}
          mode="edit"
          initialValues={editInitialValues}
          onSubmit={handleConnectionSettingsSubmit}
        />
      )}

      {/* Global Change Password Dialog */}
      {changePasswordTarget && (
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={(open) => {
            if (!open) closeChangePassword();
          }}
          connectionId={changePasswordTarget.connectionId}
          filename={changePasswordTarget.filename}
          dbPath={changePasswordTarget.dbPath}
          isCurrentlyEncrypted={changePasswordTarget.isEncrypted}
          onSuccess={() => {
            // Optionally refresh connection info
          }}
        />
      )}

      {/* Hidden trigger button for open-settings action (used by command palette) */}
      <button
        data-action="open-settings"
        className="hidden"
        onClick={() => useDialogStore.getState().openSettings()}
        aria-hidden="true"
      />

      {/* Memory Monitor Panel - renders as a fixed sidebar when open */}
      {memoryMonitorOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm">
          <div className="fixed top-0 right-0 bottom-0 z-50 shadow-lg">
            <MemoryMonitorPanel isOpen onClose={closeMemoryMonitor} />
          </div>
        </div>
      )}

      {/* About Dialog */}
      <AboutDialog />

      {/* Update Check Dialog */}
      <UpdateCheckDialog />

      {/* Backup/Restore Dialog */}
      <BackupRestoreDialog
        open={backupDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeBackupDialog();
        }}
      />

      {/* Database Dashboard Dialog */}
      <DatabaseDashboard
        open={dashboardOpen}
        onOpenChange={(open) => {
          if (!open) closeDashboard();
        }}
        connectionId={dashboardConnectionId || undefined}
        databaseName={dashboardDatabaseName || undefined}
      />

      {/* AI Agent Dialog */}
      {agentConnectionId && (
        <AIAgentDialog
          open={agentOpen}
          onOpenChange={(open) => {
            if (!open) closeAgent();
          }}
          connectionId={agentConnectionId}
        />
      )}
    </>
  );
}

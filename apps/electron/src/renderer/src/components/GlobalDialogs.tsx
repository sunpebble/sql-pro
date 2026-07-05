import type { PendingChangeInfo, RecentConnection } from '@shared/types';
import type { ConnectionSettings } from './ConnectionSettingsDialog';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemoryMonitorPanel } from '@/components/dev-tools';
import { quarry } from '@/lib/api';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useChangesStore } from '@/stores/changes-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { AboutDialog } from './AboutDialog';
import { BackupRestoreDialog } from './backup';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ConnectionSettingsDialog } from './ConnectionSettingsDialog';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { SettingsDialog } from './SettingsDialog';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { UpdateCheckDialog } from './UpdateCheckDialog';

/**
 * Global dialog provider component that renders application-wide dialogs.
 * This should be placed in the root layout to ensure dialogs are available everywhere.
 */
export function GlobalDialogs() {
  const { t } = useTranslation('common');
  const setRecentConnections = useConnectionStore(
    (s) => s.setRecentConnections
  );

  // Close-connection unsaved-changes guard (shared by tab X, menu, and Cmd+W)
  const closeConnectionDialogOpen = useDialogStore(
    (s) => s.closeConnectionDialogOpen
  );
  const pendingCloseConnectionId = useDialogStore(
    (s) => s.pendingCloseConnectionId
  );
  const performConnectionClose = useDialogStore(
    (s) => s.performConnectionClose
  );
  const setCloseConnectionDialogOpen = useDialogStore(
    (s) => s.setCloseConnectionDialogOpen
  );
  const cancelCloseConnection = useDialogStore((s) => s.cancelCloseConnection);
  const getChangesForConnection = useChangesStore(
    (s) => s.getChangesForConnection
  );

  const pendingCloseChanges = pendingCloseConnectionId
    ? getChangesForConnection(pendingCloseConnectionId)
    : [];

  // Save pending edits, then disconnect (errors keep the dialog open).
  const handleSaveAndClose = useCallback(async () => {
    if (!pendingCloseConnectionId) return;

    const changeInfos: PendingChangeInfo[] = getChangesForConnection(
      pendingCloseConnectionId
    ).map((c) => ({
      id: c.id,
      table: c.table,
      schema: c.schema,
      rowId: c.rowId,
      type: c.type,
      oldValues: c.oldValues,
      newValues: c.newValues,
      primaryKeyColumn: c.primaryKeyColumn,
    }));

    const response = await quarry.db.applyChanges({
      connectionId: pendingCloseConnectionId,
      changes: changeInfos,
    });

    if (!response.success) {
      throw new Error(response.error || t('connection.failedToApplyChanges'));
    }

    await performConnectionClose(pendingCloseConnectionId);
  }, [
    pendingCloseConnectionId,
    getChangesForConnection,
    performConnectionClose,
    t,
  ]);

  const handleDiscardAndClose = useCallback(() => {
    if (!pendingCloseConnectionId) return;
    void performConnectionClose(pendingCloseConnectionId);
  }, [pendingCloseConnectionId, performConnectionClose]);

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
      // eslint-disable-next-line react/set-state-in-effect -- Intentional reset on target change
      setEditFilename(connectionSettingsTarget.filename);
      // eslint-disable-next-line react/set-state-in-effect -- Intentional reset on target change
      setEditDbPath(connectionSettingsTarget.path);
      // eslint-disable-next-line react/set-state-in-effect -- Intentional reset on target change
      setEditIsEncrypted(connectionSettingsTarget.isEncrypted);
      // eslint-disable-next-line react/set-state-in-effect -- Intentional reset on target change
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
      const result = await quarry.connection.update({
        path: connectionSettingsTarget.path,
        displayName: settings.displayName,
        readOnly: settings.readOnly,
      });

      if (result.success) {
        // Refresh recent connections to show updated settings
        const connectionsResult = await quarry.app.getRecentConnections();
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
        <div className="bg-background/80 fixed inset-0 z-50">
          <div className="border-border fixed top-0 right-0 bottom-0 z-50 border-l shadow-sm">
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

      {/* Unsaved-changes guard for closing a connection (tab X, menu, Cmd+W) */}
      {pendingCloseConnectionId && (
        <UnsavedChangesDialog
          open={closeConnectionDialogOpen}
          onOpenChange={setCloseConnectionDialogOpen}
          changes={pendingCloseChanges}
          connectionId={pendingCloseConnectionId}
          onSave={handleSaveAndClose}
          onDiscard={handleDiscardAndClose}
          onCancel={cancelCloseConnection}
        />
      )}
    </>
  );
}

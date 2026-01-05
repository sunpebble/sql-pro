import type { ConnectionSettings } from './ConnectionSettingsDialog';
import { useCallback, useEffect, useState } from 'react';
import { sqlPro } from '@/lib/api';
import { useConnectionStore, useDialogStore } from '@/stores';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ConnectionSettingsDialog } from './ConnectionSettingsDialog';
import { SettingsDialog } from './SettingsDialog';

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
      setEditFilename(connectionSettingsTarget.filename);
      setEditDbPath(connectionSettingsTarget.path);
      setEditIsEncrypted(connectionSettingsTarget.isEncrypted);
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
          setRecentConnections(connectionsResult.connections);
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
    </>
  );
}

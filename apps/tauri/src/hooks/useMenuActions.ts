import type { GetSchemaResponse } from '@shared/types';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { sqlPro } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import {
  useChangesStore,
  useCommandPaletteStore,
  useConnectionStore,
  useDialogStore,
  useTableDataStore,
} from '@/stores';

// Check if window API is available (always true in Tauri since we import sqlPro)
const hasWindowAPI = (): boolean => {
  return typeof sqlPro?.window?.create === 'function';
};

/**
 * Hook that listens for menu actions from the main process.
 * Should be called once at the app root level.
 */
export function useMenuActions() {
  const navigate = useNavigate();
  const toggle = useCommandPaletteStore((s) => s.toggle);

  useEffect(() => {
    // Set up menu action listener (works for both Electron and Tauri)
    if (!sqlPro?.menu?.onAction) {
      return;
    }

    const cleanup = sqlPro.menu.onAction((action) => {
      const connectionStore = useConnectionStore.getState();
      const changesStore = useChangesStore.getState();
      const tableDataStore = useTableDataStore.getState();

      switch (action) {
        case 'open-database': {
          // Try to find the button by data-action attribute
          const openButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="open-database"]'
          );
          if (openButton) {
            openButton.click();
          } else {
            // If no button found, open file dialog directly
            sqlPro.dialog
              .openFile()
              .then(async (result: { success: boolean; filePath?: string }) => {
                if (result.success && result.filePath) {
                  const openResult = await sqlPro.db.open({
                    path: result.filePath,
                  });
                  if (openResult.success && openResult.connection) {
                    connectionStore.addConnection({
                      id: openResult.connection.id,
                      path: openResult.connection.path,
                      filename: openResult.connection.filename,
                      isEncrypted: openResult.connection.isEncrypted,
                      isReadOnly: openResult.connection.isReadOnly,
                      status: 'connected',
                      connectedAt: new Date(),
                    });
                    navigate({ to: '/database' });
                  }
                }
              });
          }
          break;
        }

        case 'close-database': {
          const {
            connection,
            activeConnectionId,
            removeConnection,
            setSelectedTable,
          } = connectionStore;
          if (connection && activeConnectionId) {
            sqlPro.db.close({ connectionId: connection.id }).then(() => {
              removeConnection(activeConnectionId);
              setSelectedTable(null);
              changesStore.clearChangesForConnection(activeConnectionId);
              tableDataStore.resetConnection(activeConnectionId);
              navigate({ to: '/' });
            });
          }
          break;
        }

        case 'refresh-schema': {
          const { connection, activeConnectionId, setSchema } = connectionStore;
          if (connection && activeConnectionId) {
            const toastId = toast.loading('Refreshing...');
            sqlPro.db
              .getSchema({ connectionId: connection.id })
              .then((result: GetSchemaResponse) => {
                if (result.success) {
                  setSchema(activeConnectionId, {
                    schemas: result.schemas || [],
                    tables: result.tables || [],
                    views: result.views || [],
                  });
                  toast.success('Refreshed', { id: toastId });
                } else {
                  toast.error('Failed to refresh', { id: toastId });
                }
              })
              .catch(() => {
                toast.error('Failed to refresh', { id: toastId });
              });
          }
          break;
        }

        case 'refresh-table': {
          const { activeConnectionId } = connectionStore;
          if (activeConnectionId) {
            // Invalidate table data queries to trigger refetch
            queryClient.invalidateQueries({
              queryKey: ['tableData', activeConnectionId],
            });
          }
          break;
        }

        case 'open-settings': {
          // Try data-action first, then fallback to icon selector
          const settingsButton =
            document.querySelector<HTMLButtonElement>(
              'button[data-action="open-settings"]'
            ) ||
            document.querySelector<HTMLButtonElement>(
              'button[aria-label="Settings"]'
            );
          settingsButton?.click();
          break;
        }

        case 'open-plugins': {
          navigate({ to: '/plugins' });
          break;
        }

        case 'toggle-command-palette': {
          toggle();
          break;
        }

        case 'switch-to-data': {
          document
            .querySelector<HTMLButtonElement>('[data-tab="data"]')
            ?.click();
          break;
        }

        case 'switch-to-query': {
          document
            .querySelector<HTMLButtonElement>('[data-tab="query"]')
            ?.click();
          break;
        }

        case 'execute-query': {
          // Try data-action first, then fallback
          const executeButton =
            document.querySelector<HTMLButtonElement>(
              'button[data-action="execute-query"]'
            ) ||
            document.querySelector<HTMLButtonElement>(
              'button[aria-label="Execute"]'
            );
          executeButton?.click();
          break;
        }

        case 'toggle-history': {
          const historyButton =
            document.querySelector<HTMLButtonElement>(
              'button[data-action="toggle-history"]'
            ) ||
            document.querySelector<HTMLButtonElement>(
              'button[aria-label="History"]'
            );
          historyButton?.click();
          break;
        }

        case 'new-window': {
          if (hasWindowAPI()) {
            sqlPro.window.create();
          }
          break;
        }

        case 'switch-to-schema-compare': {
          document
            .querySelector<HTMLButtonElement>('[data-tab="schema-compare"]')
            ?.click();
          break;
        }

        case 'view-changes': {
          // Try to click the view changes button in the toolbar
          const viewChangesButton =
            document.querySelector<HTMLButtonElement>(
              'button[data-action="view-changes"]'
            ) ||
            document.querySelector<HTMLButtonElement>(
              'button[aria-label="View Changes"]'
            );
          viewChangesButton?.click();
          break;
        }

        case 'show-shortcuts': {
          // Open keyboard shortcuts dialog directly
          const dialogStore = useDialogStore.getState();
          dialogStore.openShortcuts();
          break;
        }

        case 'export-query': {
          const exportQueryButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="export-query"]'
          );
          exportQueryButton?.click();
          break;
        }

        case 'import-query': {
          const importQueryButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="import-query"]'
          );
          importQueryButton?.click();
          break;
        }

        case 'export-schema': {
          const exportSchemaButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="export-schema"]'
          );
          exportSchemaButton?.click();
          break;
        }

        case 'import-schema': {
          const importSchemaButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="import-schema"]'
          );
          importSchemaButton?.click();
          break;
        }

        case 'toggle-memory-monitor': {
          useDialogStore.getState().toggleMemoryMonitor();
          break;
        }

        // Help menu actions
        case 'documentation': {
          // Open documentation in browser
          sqlPro.shell
            .openExternal('https://github.com/user/sql-pro#readme')
            .catch(console.error);
          break;
        }

        case 'keyboard_shortcuts': {
          // Open keyboard shortcuts dialog
          useDialogStore.getState().openShortcuts();
          break;
        }

        case 'check_updates': {
          // Check for updates using tauri-plugin-updater
          sqlPro.updates
            .check()
            .then((result) => {
              if (result.success) {
                if (result.updateAvailable && result.info) {
                  useDialogStore
                    .getState()
                    .openUpdateCheck(
                      `A new version (${result.info.version}) is available. Would you like to download and install it?`,
                      true,
                      result.info
                    );
                } else {
                  useDialogStore
                    .getState()
                    .openUpdateCheck(
                      'You are running the latest version of SQL Pro.'
                    );
                }
              } else {
                useDialogStore
                  .getState()
                  .openUpdateCheck(
                    result.error || 'Failed to check for updates.'
                  );
              }
            })
            .catch((error) => {
              useDialogStore
                .getState()
                .openUpdateCheck(`Error checking for updates: ${error}`);
            });
          break;
        }

        case 'about': {
          // Open about dialog
          useDialogStore.getState().openAbout();
          break;
        }
      }
    });

    return cleanup;
  }, [navigate, toggle]);
}

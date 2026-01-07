import type { GetSchemaResponse } from '@shared/types';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { sqlPro } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useConnectionStore } from '@/stores';

interface FileChangeEvent {
  connectionId: string;
  dbPath: string;
  eventType: 'change' | 'rename';
}

/**
 * Hook that listens for database file changes from the file watcher service.
 * When a change is detected, it refreshes the schema and table data for the affected connection.
 *
 * Should be called once at the app root level.
 */
export function useFileWatcher() {
  useEffect(() => {
    // Get the current webview window and listen for file change events
    const appWebview = getCurrentWebviewWindow();
    const unlistenPromise = appWebview.listen<FileChangeEvent>(
      'db-file-changed',
      async (event) => {
        const { connectionId } = event.payload;

        const connectionStore = useConnectionStore.getState();
        const { activeConnectionId, getConnectionById, setSchema } =
          connectionStore;

        // Get the connection for this event
        const targetConnection = getConnectionById(connectionId);

        if (!targetConnection) {
          return;
        }

        // Show a toast notification with loading state
        const toastId = toast.loading(
          'Database changed externally, refreshing...'
        );

        try {
          // Invalidate and refetch table data queries for this connection
          // This leverages TanStack Query's built-in loading states
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey;
              return (
                Array.isArray(queryKey) &&
                queryKey[0] === 'tableData' &&
                queryKey[1] === connectionId
              );
            },
          });

          // If this is the active connection, also refresh the schema silently
          // (without setting isLoadingSchema to avoid sidebar flicker)
          if (activeConnectionId === connectionId) {
            const result: GetSchemaResponse = await sqlPro.db.getSchema({
              connectionId,
            });
            if (result.success) {
              setSchema(connectionId, {
                schemas: result.schemas || [],
                tables: result.tables || [],
                views: result.views || [],
              });
            }
          }

          toast.success('Data refreshed', { id: toastId });
        } catch (error) {
          console.error('[FileWatcher] Failed to refresh:', error);
          toast.error('Failed to refresh data', { id: toastId });
        }
      }
    );

    return () => {
      // Cleanup listener on unmount
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);
}

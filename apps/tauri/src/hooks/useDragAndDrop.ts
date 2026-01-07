import type { DragEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sqlPro } from '@/lib/api';
import { useConnectionStore } from '@/stores';

// Supported database file extensions
const DB_EXTENSIONS = ['.db', '.sqlite', '.sqlite3', '.db3', '.s3db', '.sl3'];

function isDatabaseFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return DB_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function getFilenameFromPath(filePath: string): string {
  // Handle both Unix and Windows paths
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * Global drag-and-drop hook for database files.
 * Handles dragging database files anywhere in the application.
 */
export function useDragAndDrop() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const {
    addConnection,
    setSchema,
    setIsConnecting,
    setIsLoadingSchema,
    getAllConnections,
    setActiveConnection,
  } = useConnectionStore();

  // Handler for file opening logic
  const openDatabaseFile = useCallback(
    async (filePath: string) => {
      const filename = filePath.split('/').pop() || filePath;

      try {
        // Check if this database is already open
        const existingConnections = getAllConnections();
        const existingConnection = existingConnections.find(
          (conn) => conn.path === filePath
        );

        if (existingConnection) {
          // Reuse existing connection - just switch to it
          setActiveConnection(existingConnection.id);
          navigate({ to: '/database' });
          return;
        }

        setIsConnecting(true);
        const probeResult = await sqlPro.db.open({ path: filePath });
        setIsConnecting(false);

        const isEncrypted = probeResult.needsPassword === true;

        // If probe was successful and we got a connection, just connect
        if (probeResult.success && probeResult.connection) {
          addConnection({
            id: probeResult.connection.id,
            path: probeResult.connection.path,
            filename: probeResult.connection.filename,
            isEncrypted: probeResult.connection.isEncrypted,
            isReadOnly: probeResult.connection.isReadOnly,
            status: 'connected',
          });

          // Load schema
          setIsLoadingSchema(true);
          const schemaResult = await sqlPro.db.getSchema({
            connectionId: probeResult.connection.id,
          });

          if (schemaResult.success) {
            setSchema(probeResult.connection.id, {
              schemas: schemaResult.schemas || [],
              tables: schemaResult.tables || [],
              views: schemaResult.views || [],
            });
          }
          setIsLoadingSchema(false);

          // Navigate to database view
          navigate({ to: '/database' });
        } else if (isEncrypted || !probeResult.success) {
          // For encrypted databases or errors, we need to show dialogs
          // Trigger a custom event that the appropriate page can listen to
          window.dispatchEvent(
            new CustomEvent('open-database-file', {
              detail: { filePath, filename, isEncrypted },
            })
          );
        }
      } catch (err) {
        console.error('Error opening database file:', err);
        setIsConnecting(false);
      }
    },
    [
      navigate,
      addConnection,
      setSchema,
      setIsConnecting,
      setIsLoadingSchema,
      getAllConnections,
      setActiveConnection,
    ]
  );

  // Drag and drop handlers
  // Use a counter to track nested dragenter/dragleave events
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current++;

    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;

    // Only hide overlay when all drag events have left
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Handle drag cancellation (e.g., pressing Escape or dropping outside)
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    // In Tauri, file drops are handled by the native onDragDropEvent listener
    // This handler is kept for compatibility but the actual file path comes from Tauri
    // The onDragDropEvent listener above will handle the actual file opening
  }, []);

  // Listen for global dragend events to handle drag cancellation
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    // Handle case when file is dropped outside the window
    const handleGlobalDrop = (e: Event) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Tauri native drag-drop events - provides actual file paths
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupTauriDropListener = async () => {
      try {
        const webview = getCurrentWebviewWindow();
        unlisten = await webview.onDragDropEvent((event) => {
          if (event.payload.type === 'over') {
            // Check if any of the paths are database files
            const paths = event.payload.paths || [];
            const hasDbFile = paths.some((path) => {
              const filename = getFilenameFromPath(path);
              return isDatabaseFile(filename);
            });
            if (hasDbFile) {
              setIsDragging(true);
            }
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);
            // Find the first database file
            const paths = event.payload.paths || [];
            const dbPath = paths.find((path) => {
              const filename = getFilenameFromPath(path);
              return isDatabaseFile(filename);
            });
            if (dbPath) {
              openDatabaseFile(dbPath);
            }
          } else if (event.payload.type === 'cancel') {
            setIsDragging(false);
          }
        });
      } catch (err) {
        console.error('Failed to setup Tauri drop listener:', err);
      }
    };

    setupTauriDropListener();

    return () => {
      unlisten?.();
    };
  }, [openDatabaseFile]);

  return {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragEnd,
    handleDrop,
    DB_EXTENSIONS,
  };
}

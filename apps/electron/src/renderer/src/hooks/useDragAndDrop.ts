import type { DragEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { sqlPro } from '@/lib/api';
import { useConnectionStore } from '@/stores';

// Supported database file extensions
const DB_EXTENSIONS = ['.db', '.sqlite', '.sqlite3', '.db3', '.s3db', '.sl3'];

function isDatabaseFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return DB_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Global drag-and-drop hook for database files.
 * Handles dragging database files anywhere in the application.
 */
export function useDragAndDrop() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const { addConnection, setSchema, setIsConnecting, setIsLoadingSchema } =
    useConnectionStore();

  // Handler for file opening logic
  const openDatabaseFile = useCallback(
    async (filePath: string) => {
      const filename = filePath.split('/').pop() || filePath;

      try {
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
    [navigate, addConnection, setSchema, setIsConnecting, setIsLoadingSchema]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Find the first database file
      const dbFile = files.find((file) => isDatabaseFile(file.name));

      if (dbFile) {
        // Use Electron's webUtils to get the file path
        const filePath = sqlPro.file.getPathForFile(dbFile);
        if (filePath) {
          await openDatabaseFile(filePath);
        }
      }
    },
    [openDatabaseFile]
  );

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    DB_EXTENSIONS,
  };
}

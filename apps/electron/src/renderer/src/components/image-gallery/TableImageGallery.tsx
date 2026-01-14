import type { MediaItem } from './ImageGallery';
import type { ViewMode } from './ImageGalleryToolbar';
import type { MediaColumnInfo, MediaSource } from '@/lib/image-utils';
import type { ColumnSchema } from '@/types/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  detectMediaColumns,
  detectMediaColumnsAsync,
  detectMediaSourceAsync,
} from '@/lib/image-utils';
import { ImageGallery } from './ImageGallery';
import { ImageGalleryToolbar } from './ImageGalleryToolbar';

// ============================================================================
// Types
// ============================================================================

export interface TableImageGalleryProps {
  /** Table columns schema */
  columns: ColumnSchema[];
  /** Table row data */
  rows: Record<string, unknown>[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback to refetch data */
  onRefresh?: () => void;
}

// ============================================================================
// TableImageGallery Component
// ============================================================================

/**
 * Wrapper component that connects ImageGallery to table data.
 * Handles image detection, column filtering, and provides the full gallery experience.
 */
export function TableImageGallery({
  columns,
  rows,
  isLoading = false,
  onRefresh,
}: TableImageGalleryProps) {
  const { t } = useTranslation('common');
  // State for gallery settings
  const [thumbnailSize, setThumbnailSize] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // State for async media column detection
  const [mediaColumns, setMediaColumns] = useState<MediaColumnInfo[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // State for async media items (with validated URLs)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isBuildingItems, setIsBuildingItems] = useState(false);

  // Sync detection for immediate feedback
  const syncMediaColumns = useMemo<MediaColumnInfo[]>(() => {
    if (columns.length === 0 || rows.length === 0) return [];
    return detectMediaColumns(columns, rows, 20); // Sample first 20 rows
  }, [columns, rows]);

  // Async detection with HEAD request for more accuracy
  useEffect(() => {
    if (columns.length === 0 || rows.length === 0) {
      setMediaColumns([]);
      return;
    }

    // Start with sync results for immediate display
    setMediaColumns(syncMediaColumns);

    // Then run async detection for URLs without clear media extensions
    const runAsyncDetection = async () => {
      setIsDetecting(true);
      try {
        const asyncColumns = await detectMediaColumnsAsync(columns, rows, 20);
        setMediaColumns(asyncColumns);
      } catch (error) {
        // Log error with context for debugging
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          '[TableImageGallery] Async media column detection failed:',
          {
            columnsCount: columns.length,
            rowsCount: rows.length,
            error: errorMessage,
          }
        );
        // Keep sync results on error - this is a graceful degradation
        // No toast needed as sync detection already provides results
      } finally {
        setIsDetecting(false);
      }
    };

    runAsyncDetection();
  }, [columns, rows, syncMediaColumns]);

  // Reset selected column if it's no longer available
  const validSelectedColumn = useMemo(() => {
    if (
      selectedColumn &&
      !mediaColumns.some((c) => c.column === selectedColumn)
    ) {
      return null;
    }
    return selectedColumn;
  }, [mediaColumns, selectedColumn]);

  // Build media items from rows with async URL validation
  useEffect(() => {
    if (mediaColumns.length === 0) {
      setMediaItems([]);
      return;
    }

    const columnsToScan = validSelectedColumn
      ? mediaColumns.filter((c) => c.column === validSelectedColumn)
      : mediaColumns;

    // Build items with async validation for URLs
    const buildItems = async () => {
      setIsBuildingItems(true);
      const items: MediaItem[] = [];

      // Process in batches to avoid overwhelming
      const promises: Promise<{
        rowIndex: number;
        column: string;
        rowData: Record<string, unknown>;
        source: MediaSource;
      } | null>[] = [];

      rows.forEach((row, rowIndex) => {
        columnsToScan.forEach((colInfo) => {
          const value = row[colInfo.column];
          if (value === null || value === undefined) return;

          const col = columns.find((c) => c.name === colInfo.column);
          const columnType = col?.type ?? 'text';

          promises.push(
            (async () => {
              // Use async detection for accurate URL validation
              const source = await detectMediaSourceAsync(value, columnType);
              if (source) {
                return {
                  rowIndex,
                  column: colInfo.column,
                  rowData: row,
                  source,
                };
              }
              return null;
            })()
          );
        });
      });

      try {
        const results = await Promise.all(promises);
        for (const result of results) {
          if (result) {
            items.push({
              id: `${result.rowIndex}-${result.column}`,
              source: result.source,
              rowIndex: result.rowIndex,
              column: result.column,
              rowData: result.rowData,
            });
          }
        }
      } catch (error) {
        // Log error with context for debugging
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('[TableImageGallery] Error building media items:', {
          columnsToScan: columnsToScan.map((c) => c.column),
          rowsCount: rows.length,
          error: errorMessage,
        });
        // Show user feedback for critical failure
        toast.error(
          t(
            'imageGallery.loadError',
            'Failed to load some media. Please try refreshing.'
          )
        );
      }

      setMediaItems(items);
      setIsBuildingItems(false);
    };

    buildItems();
  }, [rows, columns, mediaColumns, validSelectedColumn, t]);

  // Handle export selected images
  const handleExportSelected = useCallback(() => {
    // TODO: Implement batch export via IPC - placeholder for future implementation
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setSelectedIds(new Set());
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <ImageGalleryToolbar
        imageColumns={mediaColumns}
        selectedColumn={selectedColumn}
        onColumnChange={setSelectedColumn}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        thumbnailSize={thumbnailSize}
        onThumbnailSizeChange={setThumbnailSize}
        hasSelection={selectedIds.size > 0}
        selectedCount={selectedIds.size}
        onExportSelected={handleExportSelected}
        onRefresh={handleRefresh}
        isLoading={isLoading || isDetecting || isBuildingItems}
        totalCount={mediaItems.length}
      />

      {/* Gallery */}
      <div className="min-h-0 flex-1">
        <ImageGallery
          images={mediaItems}
          thumbnailSize={thumbnailSize}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

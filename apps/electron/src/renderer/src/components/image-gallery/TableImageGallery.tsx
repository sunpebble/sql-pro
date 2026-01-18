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
import { MediaGalleryToolbar } from './ImageGalleryToolbar';

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
  /** Callback to locate the media in the data table */
  onLocateInTable?: (rowIndex: number, column: string) => void;
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
  onLocateInTable,
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
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset when data is empty
      setMediaColumns([]);
      return;
    }

    // Start with sync results for immediate display
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional immediate sync initialization before async
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
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset when no media columns
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
            'mediaGallery.loadError',
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
  const handleExportSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.warning(t('mediaGallery.noSelection', 'No images selected'));
      return;
    }

    // Get selected items
    const selectedItems = mediaItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    try {
      // Ask user where to save
      const result = await window.sqlPro.dialog.saveFile({
        title: t('mediaGallery.exportTitle', 'Export Selected Images'),
        defaultPath: `images-export-${Date.now()}`,
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'JPEG Images', extensions: ['jpg', 'jpeg'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (!result.success || !result.filePath || result.canceled) {
        return;
      }

      const basePath = result.filePath.replace(/\.[^.]+$/, ''); // Remove extension
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const fileName =
          selectedItems.length === 1
            ? result.filePath
            : `${basePath}-${i + 1}.png`;

        try {
          let content: Uint8Array;
          const source = item.source;

          if (!source) {
            continue;
          }

          if (source.type === 'blob') {
            content = new Uint8Array(source.data);
          } else if (source.type === 'base64') {
            // Extract base64 data from data URL and decode to Uint8Array
            const base64Data = source.dataUrl.split(',')[1];
            const binaryString = atob(base64Data);
            content = new Uint8Array(binaryString.length);
            for (let j = 0; j < binaryString.length; j++) {
              content[j] = binaryString.charCodeAt(j);
            }
          } else if (source.type === 'url') {
            // Fetch the image from URL
            const response = await fetch(source.url);
            const arrayBuffer = await response.arrayBuffer();
            content = new Uint8Array(arrayBuffer);
          } else if (source.type === 'file') {
            // File path - would need backend to read
            toast.warning(
              t(
                'mediaGallery.fileExportNotSupported',
                'File path export not yet supported'
              )
            );
            continue;
          } else {
            continue;
          }

          const writeResult = await window.sqlPro.dialog.writeFile({
            filePath: fileName,
            content,
          });

          if (writeResult.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Failed to export image:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          t(
            'mediaGallery.exportSuccess',
            `Exported ${successCount} image(s) successfully`
          )
        );
      }
      if (errorCount > 0) {
        toast.error(
          t(
            'mediaGallery.exportPartialError',
            `Failed to export ${errorCount} image(s)`
          )
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('mediaGallery.exportError', 'Failed to export images'));
    }
  }, [selectedIds, mediaItems, t]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setSelectedIds(new Set());
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <MediaGalleryToolbar
        mediaColumns={mediaColumns}
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
          onLocateInTable={onLocateInTable}
        />
      </div>
    </div>
  );
}

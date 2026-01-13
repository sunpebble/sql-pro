import type { ImageItem } from './ImageGallery';
import type { ViewMode } from './ImageGalleryToolbar';
import type { ImageColumnInfo } from '@/lib/image-utils';
import type { ColumnSchema } from '@/types/database';
import { useCallback, useMemo, useState } from 'react';
import { detectImageColumns, detectImageSource } from '@/lib/image-utils';
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
  // State for gallery settings
  const [thumbnailSize, setThumbnailSize] = useState(150);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Detect image columns from the data
  const imageColumns = useMemo<ImageColumnInfo[]>(() => {
    if (columns.length === 0 || rows.length === 0) return [];
    return detectImageColumns(columns, rows, 20); // Sample first 20 rows
  }, [columns, rows]);

  // Reset selected column if it's no longer available
  const validSelectedColumn = useMemo(() => {
    if (
      selectedColumn &&
      !imageColumns.some((c) => c.column === selectedColumn)
    ) {
      return null;
    }
    return selectedColumn;
  }, [imageColumns, selectedColumn]);

  // Build image items from rows
  const imageItems = useMemo<ImageItem[]>(() => {
    if (imageColumns.length === 0) return [];

    const items: ImageItem[] = [];
    const columnsToScan = validSelectedColumn
      ? imageColumns.filter((c) => c.column === validSelectedColumn)
      : imageColumns;

    rows.forEach((row, rowIndex) => {
      columnsToScan.forEach((colInfo) => {
        const value = row[colInfo.column];
        if (value === null || value === undefined) return;

        const col = columns.find((c) => c.name === colInfo.column);
        const source = detectImageSource(value, col?.type ?? 'text');

        if (source) {
          items.push({
            id: `${rowIndex}-${colInfo.column}`,
            source,
            rowIndex,
            column: colInfo.column,
            rowData: row,
          });
        }
      });
    });

    return items;
  }, [rows, columns, imageColumns, validSelectedColumn]);

  // Handle export selected images
  const handleExportSelected = useCallback(() => {
    // TODO: Implement batch export via IPC
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
        imageColumns={imageColumns}
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
        isLoading={isLoading}
        totalCount={imageItems.length}
      />

      {/* Gallery */}
      <div className="min-h-0 flex-1">
        <ImageGallery
          images={imageItems}
          thumbnailSize={thumbnailSize}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}

import type { MediaColumnInfo } from '@/lib/image-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import {
  Download,
  Grid3X3,
  ImageIcon,
  List,
  Minus,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type ViewMode = 'grid' | 'list';

export interface MediaGalleryToolbarProps {
  /** Available media columns */
  mediaColumns: MediaColumnInfo[];
  /** Currently selected column (null = all columns) */
  selectedColumn: string | null;
  /** Callback when column selection changes */
  onColumnChange: (column: string | null) => void;
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Current thumbnail size */
  thumbnailSize: number;
  /** Callback when thumbnail size changes */
  onThumbnailSizeChange: (size: number) => void;
  /** Min thumbnail size */
  minThumbnailSize?: number;
  /** Max thumbnail size */
  maxThumbnailSize?: number;
  /** Whether there are selected media items */
  hasSelection: boolean;
  /** Selected count */
  selectedCount: number;
  /** Callback to export selected media */
  onExportSelected?: () => void;
  /** Callback to refresh/rescan media */
  onRefresh?: () => void;
  /** Whether the gallery is loading */
  isLoading?: boolean;
  /** Total media count */
  totalCount: number;
}

/** @deprecated Use MediaGalleryToolbarProps instead */
export type ImageGalleryToolbarProps = MediaGalleryToolbarProps;

// ============================================================================
// Toolbar Component
// ============================================================================

export function MediaGalleryToolbar({
  mediaColumns,
  selectedColumn,
  onColumnChange,
  viewMode,
  onViewModeChange,
  thumbnailSize,
  onThumbnailSizeChange,
  minThumbnailSize = 80,
  maxThumbnailSize = 300,
  hasSelection,
  selectedCount,
  onExportSelected,
  onRefresh,
  isLoading,
  totalCount,
}: MediaGalleryToolbarProps) {
  const { t } = useTranslation('common');

  const handleSizeDecrease = () => {
    const newSize = Math.max(minThumbnailSize, thumbnailSize - 30);
    onThumbnailSizeChange(newSize);
  };

  const handleSizeIncrease = () => {
    const newSize = Math.min(maxThumbnailSize, thumbnailSize + 30);
    onThumbnailSizeChange(newSize);
  };

  return (
    <div className="bg-background border-b">
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        {/* Left side: Column selector and info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {t('mediaGallery.title', 'Media')}
            </span>
          </div>

          {mediaColumns.length > 1 && (
            <Select
              value={selectedColumn ?? 'all'}
              onValueChange={(value) =>
                onColumnChange(value === 'all' ? null : value)
              }
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue
                  placeholder={t('mediaGallery.selectColumn', 'Select column')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('mediaGallery.allColumns', 'All columns')} ({totalCount})
                </SelectItem>
                {mediaColumns.map((col) => (
                  <SelectItem key={col.column} value={col.column}>
                    {col.column}{' '}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({col.type})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <span className="text-muted-foreground text-sm">
            {totalCount} {t('mediaGallery.mediaFound', 'media')}
          </span>
        </div>

        {/* Right side: Controls */}
        <div className="flex items-center gap-2">
          {/* Export selected */}
          {hasSelection && onExportSelected && (
            <button
              onClick={onExportSelected}
              className="hover:bg-muted flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>
                {t('mediaGallery.exportSelected', 'Export')} ({selectedCount})
              </span>
            </button>
          )}

          {/* Thumbnail size controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSizeDecrease}
              disabled={thumbnailSize <= minThumbnailSize}
              className={cn(
                'hover:bg-muted rounded-md p-1.5 transition-colors',
                thumbnailSize <= minThumbnailSize &&
                  'cursor-not-allowed opacity-50'
              )}
              title={t('mediaGallery.decreaseSize', 'Decrease size')}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-muted-foreground w-12 text-center text-xs">
              {thumbnailSize}px
            </span>
            <button
              onClick={handleSizeIncrease}
              disabled={thumbnailSize >= maxThumbnailSize}
              className={cn(
                'hover:bg-muted rounded-md p-1.5 transition-colors',
                thumbnailSize >= maxThumbnailSize &&
                  'cursor-not-allowed opacity-50'
              )}
              title={t('mediaGallery.increaseSize', 'Increase size')}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* View mode toggle */}
          <div className="border-border flex rounded-md border">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'rounded-l-md p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary text-background'
                  : 'hover:bg-muted'
              )}
              title={t('mediaGallery.gridView', 'Grid view')}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'rounded-r-md p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-background'
                  : 'hover:bg-muted'
              )}
              title={t('mediaGallery.listView', 'List view')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                'hover:bg-muted rounded-md p-1.5 transition-colors',
                isLoading && 'animate-spin'
              )}
              title={t('mediaGallery.refresh', 'Refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use MediaGalleryToolbar instead */
export const ImageGalleryToolbar = MediaGalleryToolbar;

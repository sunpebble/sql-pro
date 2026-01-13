import type { ImageSource } from '@/lib/image-utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ImageOff } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getImageDisplayUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import { ImagePreview } from './ImagePreview';

// ============================================================================
// Types
// ============================================================================

export interface ImageItem {
  /** Unique identifier for the image */
  id: string;
  /** Image source info */
  source: ImageSource;
  /** Row index in the original data */
  rowIndex: number;
  /** Column name */
  column: string;
  /** Original row data for context */
  rowData: Record<string, unknown>;
}

export interface ImageGalleryProps {
  /** Array of image items to display */
  images: ImageItem[];
  /** Thumbnail size in pixels */
  thumbnailSize?: number;
  /** Callback when thumbnail size changes */
  onThumbnailSizeChange?: (size: number) => void;
  /** Whether the gallery is loading */
  isLoading?: boolean;
  /** Selected image IDs */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (ids: Set<string>) => void;
}

// ============================================================================
// Image Thumbnail Component
// ============================================================================

interface ImageThumbnailProps {
  item: ImageItem;
  size: number;
  isSelected: boolean;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
}

const ImageThumbnail = memo(({
  item,
  size,
  isSelected,
  onClick,
  onSelect,
}: ImageThumbnailProps) => {
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const displayUrl = useMemo(
    () => getImageDisplayUrl(item.source),
    [item.source]
  );

  const handleError = useCallback(() => {
    setLoadError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={cn(
        'group hover:border-primary relative cursor-pointer overflow-hidden rounded-lg border transition-all',
        isSelected
          ? 'border-primary ring-primary/50 ring-2'
          : 'border-border hover:shadow-md'
      )}
      style={{ width: size, height: size }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Selection checkbox */}
      <div
        className={cn(
          'absolute top-2 left-2 z-10 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e);
        }}
      >
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border',
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-white/80 bg-black/30 text-white'
          )}
        >
          {isSelected && (
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Image */}
      {displayUrl && !loadError ? (
        <>
          {!isLoaded && (
            <div className="bg-muted absolute inset-0 animate-pulse" />
          )}
          <img
            src={displayUrl}
            alt={`Row ${item.rowIndex + 1}, ${item.column}`}
            className={cn(
              'h-full w-full object-cover transition-opacity',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading="lazy"
            onError={handleError}
            onLoad={handleLoad}
          />
        </>
      ) : (
        <div className="bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1">
          <ImageOff className="h-6 w-6" />
          <span className="text-xs">Error</span>
        </div>
      )}

      {/* Row info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs text-white">
          Row {item.rowIndex + 1} · {item.column}
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Main ImageGallery Component
// ============================================================================

export function ImageGallery({
  images,
  thumbnailSize = 150,
  isLoading = false,
  selectedIds = new Set(),
  onSelectionChange,
}: ImageGalleryProps) {
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null);

  // Calculate grid layout
  const gap = 12;
  const containerWidth = containerRef.current?.clientWidth ?? 800;
  const columnsCount = Math.max(
    1,
    Math.floor((containerWidth + gap) / (thumbnailSize + gap))
  );
  const rowsCount = Math.ceil(images.length / columnsCount);

  // Virtual scrolling for rows
  const rowVirtualizer = useVirtualizer({
    count: rowsCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => thumbnailSize + gap,
    overscan: 2,
  });

  // Selection handlers
  const handleSelect = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (!onSelectionChange) return;

      const newSelection = new Set(selectedIds);
      if (e.shiftKey) {
        // Range selection - not implemented for simplicity
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
      } else {
        // Single selection
        if (newSelection.has(id) && newSelection.size === 1) {
          newSelection.clear();
        } else {
          newSelection.clear();
          newSelection.add(id);
        }
      }
      onSelectionChange(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  // Preview navigation
  const handlePreviewNav = useCallback(
    (direction: 'prev' | 'next') => {
      if (!previewItem) return;
      const currentIndex = images.findIndex((img) => img.id === previewItem.id);
      if (currentIndex === -1) return;

      const newIndex =
        direction === 'prev'
          ? Math.max(0, currentIndex - 1)
          : Math.min(images.length - 1, currentIndex + 1);

      setPreviewItem(images[newIndex]);
    },
    [images, previewItem]
  );

  // Empty state
  if (!isLoading && images.length === 0) {
    return (
      <div className="bg-grid-dot text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
        <ImageOff className="h-12 w-12" />
        <p>{t('imageGallery.noImages', 'No images detected')}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="bg-muted aspect-square animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full overflow-auto p-4">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columnsCount;
            const rowImages = images.slice(
              startIndex,
              startIndex + columnsCount
            );

            return (
              <div
                key={virtualRow.index}
                className="absolute left-0 flex gap-3"
                style={{
                  top: `${virtualRow.start}px`,
                  height: thumbnailSize,
                }}
              >
                {rowImages.map((item) => (
                  <ImageThumbnail
                    key={item.id}
                    item={item}
                    size={thumbnailSize}
                    isSelected={selectedIds.has(item.id)}
                    onClick={() => setPreviewItem(item)}
                    onSelect={(e) => handleSelect(item.id, e)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Dialog */}
      {previewItem && (
        <ImagePreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onPrev={() => handlePreviewNav('prev')}
          onNext={() => handlePreviewNav('next')}
          hasPrev={images.findIndex((img) => img.id === previewItem.id) > 0}
          hasNext={
            images.findIndex((img) => img.id === previewItem.id) <
            images.length - 1
          }
          currentIndex={images.findIndex((img) => img.id === previewItem.id)}
          totalCount={images.length}
        />
      )}
    </>
  );
}

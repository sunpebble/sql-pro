import type { ViewMode } from './ImageGalleryToolbar';
import type { ImageSource } from '@/lib/image-utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Copy, Download, ExternalLink, ImageOff } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useImageLoader } from '@/hooks/useImageLoader';
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
  /** View mode: grid or list */
  viewMode?: ViewMode;
}

// ============================================================================
// Image Thumbnail Component (Grid View)
// ============================================================================

interface ImageThumbnailProps {
  item: ImageItem;
  size: number;
  isSelected: boolean;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
}

const ImageThumbnail = memo(
  ({ item, size, isSelected, onClick, onSelect }: ImageThumbnailProps) => {
    const { imgProps, isLoaded, isError, usingFallback } = useImageLoader(
      item.source,
      {
        lazy: true,
        enableFallback: true,
        alt: `Row ${item.rowIndex + 1}, ${item.column}`,
      }
    );

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
        {imgProps.src && !isError ? (
          <>
            {!isLoaded && (
              <div className="bg-muted absolute inset-0 animate-pulse" />
            )}
            <img
              {...imgProps}
              className={cn(
                'h-full w-full object-cover transition-opacity',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
              // Add crossorigin for fallback URLs to enable clipboard copy
              crossOrigin={usingFallback ? 'anonymous' : undefined}
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
  }
);

// ============================================================================
// Image List Item Component (List View)
// ============================================================================

interface ImageListItemProps {
  item: ImageItem;
  thumbnailSize: number;
  isSelected: boolean;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
}

const ImageListItem = memo(
  ({
    item,
    thumbnailSize,
    isSelected,
    onClick,
    onSelect,
  }: ImageListItemProps) => {
    const { t } = useTranslation('common');
    const { copy } = useCopyToClipboard();
    const { imgProps, isLoaded, isError, displayUrl } = useImageLoader(
      item.source,
      {
        lazy: true,
        enableFallback: true,
        alt: `Row ${item.rowIndex + 1}, ${item.column}`,
      }
    );

    // Copy URL to clipboard
    const handleCopyUrl = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.source?.type === 'url') {
          await copy(item.source.url, {
            successMessage: t(
              'imageGallery.urlCopied',
              'URL copied to clipboard'
            ),
            errorMessage: t('imageGallery.copyUrlFailed', 'Failed to copy URL'),
          });
        }
      },
      [item.source, t, copy]
    );

    // Download image
    const handleDownload = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!displayUrl) return;

        try {
          const response = await fetch(displayUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `image_row${item.rowIndex + 1}_${item.column}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(t('imageGallery.downloadStarted', 'Download started'));
        } catch {
          toast.error(t('imageGallery.downloadFailed', 'Download failed'));
        }
      },
      [displayUrl, item, t]
    );

    // Open in browser
    const handleOpenExternal = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.source?.type === 'url') {
          window.open(item.source.url, '_blank');
        }
      },
      [item.source]
    );

    // Get display info
    const getSourceInfo = () => {
      if (!item.source) return { type: 'Unknown', detail: '' };
      switch (item.source.type) {
        case 'url':
          return { type: 'URL', detail: item.source.url };
        case 'base64':
          return { type: 'Base64', detail: 'Embedded data' };
        case 'blob':
          return {
            type: item.source.mimeType.split('/')[1]?.toUpperCase() ?? 'BLOB',
            detail: `${(item.source.data.byteLength / 1024).toFixed(1)} KB`,
          };
        default:
          return { type: 'Unknown', detail: '' };
      }
    };

    const sourceInfo = getSourceInfo();
    const itemHeight = Math.max(80, thumbnailSize * 0.6);

    return (
      <div
        className={cn(
          'group hover:bg-muted/50 flex cursor-pointer items-center gap-4 border-b px-4 transition-colors',
          isSelected && 'bg-primary/5'
        )}
        style={{ height: itemHeight }}
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
            'shrink-0 transition-opacity',
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
                : 'border-border bg-background'
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

        {/* Thumbnail */}
        <div
          className="bg-muted relative shrink-0 overflow-hidden rounded-md"
          style={{ width: itemHeight - 16, height: itemHeight - 16 }}
        >
          {imgProps.src && !isError ? (
            <>
              {!isLoaded && (
                <div className="bg-muted absolute inset-0 animate-pulse" />
              )}
              <img
                {...imgProps}
                className={cn(
                  'h-full w-full object-cover transition-opacity',
                  isLoaded ? 'opacity-100' : 'opacity-0'
                )}
              />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <ImageOff className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Row {item.rowIndex + 1}</span>
            <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
              {item.column}
            </span>
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              {sourceInfo.type}
            </span>
          </div>
          {sourceInfo.detail && (
            <p className="text-muted-foreground mt-1 truncate text-xs">
              {sourceInfo.detail}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {item.source?.type === 'url' && (
            <>
              <button
                onClick={handleCopyUrl}
                className="hover:bg-muted rounded-md p-1.5 transition-colors"
                title={t('imageGallery.copyUrl', 'Copy URL')}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleOpenExternal}
                className="hover:bg-muted rounded-md p-1.5 transition-colors"
                title={t('imageGallery.openExternal', 'Open in browser')}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="hover:bg-muted rounded-md p-1.5 transition-colors"
            title={t('imageGallery.download', 'Download')}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);

// ============================================================================
// Main ImageGallery Component
// ============================================================================

export function ImageGallery({
  images,
  thumbnailSize = 150,
  isLoading = false,
  selectedIds = new Set(),
  onSelectionChange,
  viewMode = 'grid',
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

  // Calculate list item height
  const listItemHeight = Math.max(80, thumbnailSize * 0.6);

  // Virtual scrolling for grid rows
  const gridRowVirtualizer = useVirtualizer({
    count: rowsCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => thumbnailSize + gap,
    overscan: 2,
    enabled: viewMode === 'grid',
  });

  // Virtual scrolling for list items
  const listVirtualizer = useVirtualizer({
    count: images.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => listItemHeight,
    overscan: 5,
    enabled: viewMode === 'list',
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

  // Cache the current preview index to avoid repeated findIndex calls
  const previewIndex = useMemo(() => {
    if (!previewItem) return -1;
    return images.findIndex((img) => img.id === previewItem.id);
  }, [images, previewItem]);

  // Preview navigation
  const handlePreviewNav = useCallback(
    (direction: 'prev' | 'next') => {
      if (previewIndex === -1) return;

      const newIndex =
        direction === 'prev'
          ? Math.max(0, previewIndex - 1)
          : Math.min(images.length - 1, previewIndex + 1);

      setPreviewItem(images[newIndex]);
    },
    [images, previewIndex]
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
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map(
          (id) => (
            <div
              key={`skeleton-${id}`}
              className="bg-muted aspect-square animate-pulse rounded-lg"
            />
          )
        )}
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full overflow-auto">
        {viewMode === 'grid' ? (
          // Grid View
          <div className="p-4">
            <div
              style={{
                height: `${gridRowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {gridRowVirtualizer.getVirtualItems().map((virtualRow) => {
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
        ) : (
          // List View
          <div
            style={{
              height: `${listVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {listVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = images[virtualItem.index];
              return (
                <div
                  key={item.id}
                  className="absolute right-0 left-0"
                  style={{
                    top: `${virtualItem.start}px`,
                    height: listItemHeight,
                  }}
                >
                  <ImageListItem
                    item={item}
                    thumbnailSize={thumbnailSize}
                    isSelected={selectedIds.has(item.id)}
                    onClick={() => setPreviewItem(item)}
                    onSelect={(e) => handleSelect(item.id, e)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {previewItem && (
        <ImagePreview
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onPrev={() => handlePreviewNav('prev')}
          onNext={() => handlePreviewNav('next')}
          hasPrev={previewIndex > 0}
          hasNext={previewIndex < images.length - 1}
          currentIndex={previewIndex}
          totalCount={images.length}
        />
      )}
    </>
  );
}

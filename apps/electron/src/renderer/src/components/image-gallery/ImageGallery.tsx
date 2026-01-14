import type { ViewMode } from './ImageGalleryToolbar';
import type { MediaSource } from '@/lib/image-utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Copy,
  Download,
  ExternalLink,
  Film,
  ImageOff,
  Play,
} from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useMediaLoader } from '@/hooks/useMediaLoader';
import { cn } from '@/lib/utils';
import { MediaPreview } from './MediaPreview';

// ============================================================================
// Types
// ============================================================================

export interface MediaItem {
  /** Unique identifier for the media */
  id: string;
  /** Media source info */
  source: MediaSource;
  /** Row index in the original data */
  rowIndex: number;
  /** Column name */
  column: string;
  /** Original row data for context */
  rowData: Record<string, unknown>;
}

/** @deprecated Use MediaItem instead */
export type ImageItem = MediaItem;

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
    const {
      imgProps,
      videoProps,
      mediaKey,
      isLoaded,
      isError,
      isVideo,
      usingFallback,
    } = useMediaLoader(item.source, {
      lazy: true,
      enableFallback: true,
      alt: `Row ${item.rowIndex + 1}, ${item.column}`,
    });

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

        {/* Media content */}
        {(imgProps.src || videoProps.src) && !isError ? (
          <>
            {!isLoaded && (
              <div className="bg-muted absolute inset-0 animate-pulse" />
            )}
            {isVideo ? (
              <>
                <video
                  key={mediaKey}
                  {...videoProps}
                  className={cn(
                    'h-full w-full object-cover transition-opacity',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  controls={false}
                  muted
                  crossOrigin={usingFallback ? 'anonymous' : undefined}
                />
                {/* Video play icon overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                    <Play className="h-5 w-5 text-white" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <img
                key={mediaKey}
                {...imgProps}
                className={cn(
                  'h-full w-full object-cover transition-opacity',
                  isLoaded ? 'opacity-100' : 'opacity-0'
                )}
                crossOrigin={usingFallback ? 'anonymous' : undefined}
              />
            )}
          </>
        ) : (
          <div className="bg-muted text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1">
            <ImageOff className="h-6 w-6" />
            <span className="text-xs">Error</span>
          </div>
        )}

        {/* Row info overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-1">
            {isVideo && <Film className="h-3 w-3 text-white" />}
            <p className="truncate text-xs text-white">
              Row {item.rowIndex + 1} · {item.column}
            </p>
          </div>
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
    const {
      imgProps,
      videoProps,
      mediaKey,
      isLoaded,
      isError,
      isVideo,
      displayUrl,
    } = useMediaLoader(item.source, {
      lazy: true,
      enableFallback: true,
      alt: `Row ${item.rowIndex + 1}, ${item.column}`,
    });

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

    // Download media
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
          const ext = isVideo ? 'mp4' : 'jpg';
          a.download = `media_row${item.rowIndex + 1}_${item.column}.${ext}`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(t('imageGallery.downloadStarted', 'Download started'));
        } catch {
          toast.error(t('imageGallery.downloadFailed', 'Download failed'));
        }
      },
      [displayUrl, item, t, isVideo]
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
      const mediaType = item.source.isVideo ? 'Video' : 'Image';
      switch (item.source.type) {
        case 'url':
          return { type: `URL ${mediaType}`, detail: item.source.url };
        case 'base64':
          return { type: `Base64 ${mediaType}`, detail: 'Embedded data' };
        case 'blob':
          return {
            type: item.source.mimeType.split('/')[1]?.toUpperCase() ?? 'BLOB',
            detail: `${(item.source.data.byteLength / 1024).toFixed(1)} KB`,
          };
        case 'file':
          return { type: `File ${mediaType}`, detail: item.source.path };
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
          {(imgProps.src || videoProps.src) && !isError ? (
            <>
              {!isLoaded && (
                <div className="bg-muted absolute inset-0 animate-pulse" />
              )}
              {isVideo ? (
                <>
                  <video
                    key={mediaKey}
                    {...videoProps}
                    className={cn(
                      'h-full w-full object-cover transition-opacity',
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    controls={false}
                    muted
                  />
                  {/* Video play icon overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                      <Play className="h-3 w-3 text-white" fill="white" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  key={mediaKey}
                  {...imgProps}
                  className={cn(
                    'h-full w-full object-cover transition-opacity',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                />
              )}
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
            {isVideo && <Film className="text-muted-foreground h-4 w-4" />}
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

  // Calculate list item height
  const listItemHeight = Math.max(80, thumbnailSize * 0.6);

  // Virtual scrolling for list items only (grid uses CSS Grid for layout)
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
          // Grid View - using CSS Grid for responsive layout without virtualization
          // This avoids re-rendering issues when container width changes
          <div
            className="grid gap-3 p-4"
            style={{
              gridTemplateColumns: `repeat(auto-fill, ${thumbnailSize}px)`,
            }}
          >
            {images.map((item) => (
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
        <MediaPreview
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

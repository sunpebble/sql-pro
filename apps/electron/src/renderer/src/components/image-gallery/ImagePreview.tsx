import type { ImageItem } from './ImageGallery';
import type { ImageSource } from '@/lib/image-utils';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  ImageOff,
  Loader2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { getImageDisplayUrl, getImageExtension } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ImagePreviewProps {
  /** Image item to preview */
  item: ImageItem;
  /** Close handler */
  onClose: () => void;
  /** Navigate to previous image */
  onPrev: () => void;
  /** Navigate to next image */
  onNext: () => void;
  /** Whether there's a previous image */
  hasPrev: boolean;
  /** Whether there's a next image */
  hasNext: boolean;
  /** Current index in the gallery */
  currentIndex: number;
  /** Total count of images */
  totalCount: number;
}

/** Sharp metadata from main process */
interface SharpMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  space?: string;
  channels?: number;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  density?: number;
  pages?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getImageInfo(source: ImageSource): {
  type: string;
  size?: string;
} {
  if (!source) return { type: 'Unknown' };

  switch (source.type) {
    case 'blob':
      return {
        type: source.mimeType.split('/')[1]?.toUpperCase() ?? 'BLOB',
        size: formatBytes(source.data.byteLength),
      };
    case 'base64': {
      const match = source.dataUrl.match(/^data:image\/([a-z+]+);/i);
      const base64Data = source.dataUrl.split(',')[1] ?? '';
      const bytes = Math.ceil((base64Data.length * 3) / 4);
      return {
        type: match?.[1]?.toUpperCase() ?? 'Base64',
        size: formatBytes(bytes),
      };
    }
    case 'url':
      return { type: 'URL' };
    default:
      return { type: 'Unknown' };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ============================================================================
// ImagePreview Component
// ============================================================================

export function ImagePreview({
  item,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}: ImagePreviewProps) {
  const { t } = useTranslation('common');
  const [loadError, setLoadError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [sharpMetadata, setSharpMetadata] = useState<SharpMetadata | null>(
    null
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const displayUrl = useMemo(
    () => getImageDisplayUrl(item.source),
    [item.source]
  );
  const imageInfo = useMemo(() => getImageInfo(item.source), [item.source]);

  // Reset error state when item changes - derive from item.id
  const currentItemId = item.id;
  const [trackedItemId, setTrackedItemId] = useState(currentItemId);

  if (currentItemId !== trackedItemId) {
    setTrackedItemId(currentItemId);
    setLoadError(false);
    setImageDimensions(null);
    setSharpMetadata(null);
  }

  // Fetch sharp metadata for URL images
  useEffect(() => {
    if (item.source?.type !== 'url') {
      setSharpMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const result = await window.sqlPro.image.getMetadata({
          url: item.source?.type === 'url' ? item.source.url : '',
        });
        if (result.success && result.metadata) {
          setSharpMetadata(result.metadata);
        }
      } catch (error) {
        // Log error with context for debugging
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[ImagePreview] Failed to fetch metadata for URL: ${item.source?.type === 'url' ? item.source.url : 'unknown'}`,
          { error: errorMessage }
        );
        // Metadata is non-critical, so we silently fail and use fallback display info
        // No toast needed as the image still displays correctly
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [item.source]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  // Copy image to clipboard - convert to PNG if needed (clipboard doesn't support webp)
  const handleCopyImage = useCallback(async () => {
    if (!displayUrl) return;

    try {
      // Fetch from display URL (sqlpro:// proxy URL is cached, no CORS issues)
      const response = await fetch(displayUrl);
      const blob = await response.blob();

      // Clipboard API only supports image/png and image/jpeg
      // For other formats (like webp), convert to PNG using canvas
      if (blob.type !== 'image/png' && blob.type !== 'image/jpeg') {
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }
              ctx.drawImage(img, 0, 0);

              canvas.toBlob(async (pngBlob) => {
                URL.revokeObjectURL(blobUrl);
                if (!pngBlob) {
                  reject(new Error('Failed to convert to PNG'));
                  return;
                }
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ [pngBlob.type]: pngBlob }),
                  ]);
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }, 'image/png');
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('Failed to load image for conversion'));
          };
          img.src = blobUrl;
        });
      } else {
        // PNG and JPEG can be copied directly
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }

      toast.success(t('imageGallery.imageCopied', 'Image copied to clipboard'));
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast.error(t('imageGallery.copyFailed', 'Failed to copy image'));
    }
  }, [displayUrl, t]);

  // Copy to clipboard hook
  const { copy } = useCopyToClipboard();

  // Copy image URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (item.source?.type === 'url') {
      await copy(item.source.url, {
        successMessage: t('imageGallery.urlCopied', 'URL copied to clipboard'),
        errorMessage: t('imageGallery.copyUrlFailed', 'Failed to copy URL'),
      });
    }
  }, [item.source, t, copy]);

  // Open image in external browser (for URLs)
  const handleOpenExternal = useCallback(() => {
    if (item.source?.type === 'url') {
      window.open(item.source.url, '_blank');
    }
  }, [item.source]);

  // Download/export image - use proxy URL for CORS-free download
  const handleDownload = useCallback(async () => {
    if (!displayUrl) return;

    try {
      // Determine extension from sharp metadata or fallback
      let extension = getImageExtension(item.source);
      if (sharpMetadata?.format) {
        extension =
          sharpMetadata.format === 'jpeg' ? 'jpg' : sharpMetadata.format;
      }
      const filename = `image_row${item.rowIndex + 1}_${item.column}.${extension}`;

      // Fetch from proxy URL (cached, no CORS)
      const response = await fetch(displayUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t('imageGallery.downloadStarted', 'Download started'));
    } catch {
      toast.error(t('imageGallery.downloadFailed', 'Download failed'));
    }
  }, [displayUrl, item, sharpMetadata, t]);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    },
    []
  );

  // Determine which metadata to display (prefer sharp metadata over basic)
  const displayMetadata = useMemo(() => {
    if (sharpMetadata) {
      return {
        format: sharpMetadata.format.toUpperCase(),
        size: formatBytes(sharpMetadata.size),
        width: sharpMetadata.width,
        height: sharpMetadata.height,
        colorInfo: sharpMetadata.space
          ? `${sharpMetadata.space}${sharpMetadata.channels ? ` · ${sharpMetadata.channels}ch` : ''}${sharpMetadata.hasAlpha ? ' · α' : ''}`
          : undefined,
        isAnimated: sharpMetadata.isAnimated,
        pages: sharpMetadata.pages,
      };
    }
    return {
      format: imageInfo.type,
      size: imageInfo.size,
      width: imageDimensions?.width,
      height: imageDimensions?.height,
    };
  }, [sharpMetadata, imageInfo, imageDimensions]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[90vh] max-w-[90vw] flex-col gap-0 p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {t('imageGallery.preview', 'Image Preview')}
              </DialogTitle>
              <DialogDescription>
                Row {item.rowIndex + 1} · {item.column} · {currentIndex + 1} /{' '}
                {totalCount}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Copy image button */}
              <button
                onClick={handleCopyImage}
                className="hover:bg-muted rounded-md p-2 transition-colors"
                title={t('imageGallery.copyImage', 'Copy image')}
              >
                <Copy className="h-4 w-4" />
              </button>

              {/* Open external (for URLs) */}
              {item.source?.type === 'url' && (
                <button
                  onClick={handleOpenExternal}
                  className="hover:bg-muted rounded-md p-2 transition-colors"
                  title={t('imageGallery.openExternal', 'Open in browser')}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="hover:bg-muted rounded-md p-2 transition-colors"
                title={t('imageGallery.download', 'Download')}
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="hover:bg-muted rounded-md p-2 transition-colors"
                title={t('common.close', 'Close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Image Container */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/5 p-4 dark:bg-white/5">
          {/* Navigation buttons */}
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={cn(
              'bg-background/90 absolute left-4 z-10 rounded-full border p-2 shadow-md transition-all',
              hasPrev
                ? 'hover:bg-background hover:scale-110'
                : 'cursor-not-allowed opacity-30'
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className={cn(
              'bg-background/90 absolute right-4 z-10 rounded-full border p-2 shadow-md transition-all',
              hasNext
                ? 'hover:bg-background hover:scale-110'
                : 'cursor-not-allowed opacity-30'
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Image */}
          {displayUrl && !loadError ? (
            <img
              src={displayUrl}
              alt={`Row ${item.rowIndex + 1}, ${item.column}`}
              className="max-h-full max-w-full object-contain"
              onError={() => setLoadError(true)}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <ImageOff className="h-16 w-16" />
              <p>{t('imageGallery.loadError', 'Failed to load image')}</p>
            </div>
          )}
        </div>

        {/* Footer with image info */}
        <div className="flex flex-col gap-2 border-t px-4 py-3">
          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Format badge */}
            <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
              {t('imageGallery.format', 'Format')}: {displayMetadata.format}
              {displayMetadata.isAnimated && (
                <span className="text-muted-foreground ml-1">
                  ({displayMetadata.pages} frames)
                </span>
              )}
            </span>

            {/* Size badge */}
            {displayMetadata.size && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('imageGallery.size', 'Size')}: {displayMetadata.size}
              </span>
            )}

            {/* Dimensions badge */}
            {displayMetadata.width && displayMetadata.height && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {displayMetadata.width} × {displayMetadata.height}
              </span>
            )}

            {/* Color info badge (from sharp) */}
            {displayMetadata.colorInfo && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {displayMetadata.colorInfo}
              </span>
            )}

            {/* Loading indicator */}
            {isLoadingMetadata && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('imageGallery.loadingMetadata', 'Loading metadata...')}
              </span>
            )}
          </div>

          {/* URL with copy button */}
          {item.source?.type === 'url' && (
            <div className="flex items-start gap-2">
              <code className="bg-muted/50 text-muted-foreground flex-1 rounded-md px-2 py-1.5 font-mono text-xs break-all">
                {item.source.url}
              </code>
              <button
                onClick={handleCopyUrl}
                className="bg-muted hover:bg-muted/80 shrink-0 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                title={t('imageGallery.copyUrl', 'Copy URL')}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

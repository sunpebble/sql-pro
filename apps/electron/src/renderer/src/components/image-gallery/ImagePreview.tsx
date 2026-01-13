import type { ImageItem } from './ImageGallery';
import type { ImageSource } from '@/lib/image-utils';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  ImageOff,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

  const displayUrl = useMemo(
    () => getImageDisplayUrl(item.source),
    [item.source]
  );
  const imageInfo = useMemo(() => getImageInfo(item.source), [item.source]);

  // Reset error state when item changes - use layout effect for synchronous reset
  useLayoutEffect(() => {
    setLoadError(false);
    setImageDimensions(null);
  }, [item.id]);

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

  // Copy image to clipboard
  const handleCopyImage = useCallback(async () => {
    if (!displayUrl) return;

    try {
      // For external URLs, use canvas to avoid CORS
      if (item.source?.type === 'url') {
        const img = new Image();
        img.crossOrigin = 'anonymous';

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

              canvas.toBlob(async (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create blob'));
                  return;
                }
                try {
                  await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
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
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = item.source?.type === 'url' ? item.source.url : displayUrl;
        });
      } else {
        // For blob/base64, fetch and copy directly
        const response = await fetch(displayUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }

      toast.success(t('imageGallery.imageCopied', 'Image copied to clipboard'));
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast.error(t('imageGallery.copyFailed', 'Failed to copy image'));
    }
  }, [displayUrl, item.source, t]);

  // Copy image URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (item.source?.type === 'url') {
      await navigator.clipboard.writeText(item.source.url);
      toast.success(t('imageGallery.urlCopied', 'URL copied to clipboard'));
    }
  }, [item.source, t]);

  // Open image in external browser (for URLs)
  const handleOpenExternal = useCallback(() => {
    if (item.source?.type === 'url') {
      window.open(item.source.url, '_blank');
    }
  }, [item.source]);

  // Download/export image
  const handleDownload = useCallback(async () => {
    if (!displayUrl) return;

    try {
      const extension = getImageExtension(item.source);
      const filename = `image_row${item.rowIndex + 1}_${item.column}.${extension}`;

      // For URLs, attempt to download via fetch
      if (item.source?.type === 'url') {
        const response = await fetch(item.source.url);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For blob/base64, use the display URL directly
        const a = document.createElement('a');
        a.href = displayUrl;
        a.download = filename;
        a.click();
      }

      toast.success(t('imageGallery.downloadStarted', 'Download started'));
    } catch {
      toast.error(t('imageGallery.downloadFailed', 'Download failed'));
    }
  }, [displayUrl, item, t]);

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
            <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
              {t('imageGallery.type', 'Type')}: {imageInfo.type}
            </span>
            {imageInfo.size && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('imageGallery.size', 'Size')}: {imageInfo.size}
              </span>
            )}
            {imageDimensions && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {imageDimensions.width} × {imageDimensions.height}
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

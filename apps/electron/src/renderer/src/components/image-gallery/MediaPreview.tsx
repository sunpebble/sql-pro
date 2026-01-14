import type { MediaItem } from './ImageGallery';
import type { MediaSource } from '@/lib/image-utils';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Film,
  ImageOff,
  Loader2,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getMediaDisplayUrl, getMediaExtension } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MediaPreviewProps {
  /** Media item to preview */
  item: MediaItem;
  /** Close handler */
  onClose: () => void;
  /** Navigate to previous media */
  onPrev: () => void;
  /** Navigate to next media */
  onNext: () => void;
  /** Whether there's a previous media */
  hasPrev: boolean;
  /** Whether there's a next media */
  hasNext: boolean;
  /** Current index in the gallery */
  currentIndex: number;
  /** Total count of media items */
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

function getMediaInfo(source: MediaSource): {
  type: string;
  size?: string;
  isVideo: boolean;
} {
  if (!source) return { type: 'Unknown', isVideo: false };

  const isVideo = source.isVideo;

  switch (source.type) {
    case 'blob':
      return {
        type: source.mimeType.split('/')[1]?.toUpperCase() ?? 'BLOB',
        size: formatBytes(source.data.byteLength),
        isVideo,
      };
    case 'base64': {
      const match = source.dataUrl.match(/^data:(image|video)\/([a-z0-9+]+);/i);
      const base64Data = source.dataUrl.split(',')[1] ?? '';
      const bytes = Math.ceil((base64Data.length * 3) / 4);
      return {
        type: match?.[2]?.toUpperCase() ?? 'Base64',
        size: formatBytes(bytes),
        isVideo,
      };
    }
    case 'url':
      return { type: 'URL', isVideo };
    case 'file':
      return { type: 'File', isVideo };
    default:
      return { type: 'Unknown', isVideo: false };
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ============================================================================
// MediaPreview Component
// ============================================================================

export function MediaPreview({
  item,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
}: MediaPreviewProps) {
  const { t } = useTranslation('common');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [mediaDimensions, setMediaDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [sharpMetadata, setSharpMetadata] = useState<SharpMetadata | null>(
    null
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const isVideo = item.source?.isVideo ?? false;
  const displayUrl = useMemo(
    () => getMediaDisplayUrl(item.source),
    [item.source]
  );
  const mediaInfo = useMemo(() => getMediaInfo(item.source), [item.source]);

  // Reset error state when item changes - derive from item.id
  const currentItemId = item.id;
  const [trackedItemId, setTrackedItemId] = useState(currentItemId);

  if (currentItemId !== trackedItemId) {
    setTrackedItemId(currentItemId);
    setLoadError(false);
    setMediaDimensions(null);
    setSharpMetadata(null);
    setIsPlaying(false);
  }

  // Fetch sharp metadata for URL images (not videos)
  useEffect(() => {
    if (item.source?.type !== 'url' || isVideo) {
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
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[MediaPreview] Failed to fetch metadata for URL: ${item.source?.type === 'url' ? item.source.url : 'unknown'}`,
          { error: errorMessage }
        );
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [item.source, isVideo]);

  // Video play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && isVideo) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext, onClose, isVideo, togglePlayPause]);

  // Copy image to clipboard - convert to PNG if needed
  const handleCopyMedia = useCallback(async () => {
    if (!displayUrl) return;

    if (isVideo) {
      toast.info(
        t('imageGallery.videoCopyNotSupported', 'Video copy not supported')
      );
      return;
    }

    try {
      const response = await fetch(displayUrl);
      const blob = await response.blob();

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
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }

      toast.success(t('imageGallery.imageCopied', 'Image copied to clipboard'));
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast.error(t('imageGallery.copyFailed', 'Failed to copy image'));
    }
  }, [displayUrl, t, isVideo]);

  // Copy to clipboard hook
  const { copy } = useCopyToClipboard();

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (item.source?.type === 'url') {
      await copy(item.source.url, {
        successMessage: t('imageGallery.urlCopied', 'URL copied to clipboard'),
        errorMessage: t('imageGallery.copyUrlFailed', 'Failed to copy URL'),
      });
    }
  }, [item.source, t, copy]);

  // Open media in external browser (for URLs)
  const handleOpenExternal = useCallback(() => {
    if (item.source?.type === 'url') {
      window.open(item.source.url, '_blank');
    }
  }, [item.source]);

  // Download/export media
  const handleDownload = useCallback(async () => {
    if (!displayUrl) return;

    try {
      let extension = getMediaExtension(item.source);
      if (sharpMetadata?.format) {
        extension =
          sharpMetadata.format === 'jpeg' ? 'jpg' : sharpMetadata.format;
      }
      const mediaType = isVideo ? 'video' : 'image';
      const filename = `${mediaType}_row${item.rowIndex + 1}_${item.column}.${extension}`;

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
  }, [displayUrl, item, sharpMetadata, t, isVideo]);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setMediaDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    },
    []
  );

  const handleVideoLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      setMediaDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    },
    []
  );

  // Determine which metadata to display
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
      format: mediaInfo.type,
      size: mediaInfo.size,
      width: mediaDimensions?.width,
      height: mediaDimensions?.height,
    };
  }, [sharpMetadata, mediaInfo, mediaDimensions]);

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
              <DialogTitle className="flex items-center gap-2">
                {isVideo && <Film className="h-4 w-4" />}
                {isVideo
                  ? t('imageGallery.videoPreview', 'Video Preview')
                  : t('imageGallery.preview', 'Image Preview')}
              </DialogTitle>
              <DialogDescription>
                Row {item.rowIndex + 1} · {item.column} · {currentIndex + 1} /{' '}
                {totalCount}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Copy button (images only) */}
              {!isVideo && (
                <button
                  onClick={handleCopyMedia}
                  className="hover:bg-muted rounded-md p-2 transition-colors"
                  title={t('imageGallery.copyImage', 'Copy image')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}

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

        {/* Media Container */}
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

          {/* Media content */}
          {displayUrl && !loadError ? (
            isVideo ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={displayUrl}
                  className="max-h-full max-w-full object-contain"
                  controls
                  autoPlay
                  onError={() => setLoadError(true)}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Play/Pause overlay hint */}
                <div className="pointer-events-none absolute right-2 bottom-12 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-50">
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  <span>Space</span>
                </div>
              </div>
            ) : (
              <img
                src={displayUrl}
                alt={`Row ${item.rowIndex + 1}, ${item.column}`}
                className="max-h-full max-w-full object-contain"
                onError={() => setLoadError(true)}
                onLoad={handleImageLoad}
              />
            )
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <ImageOff className="h-16 w-16" />
              <p>
                {isVideo
                  ? t('imageGallery.videoLoadError', 'Failed to load video')
                  : t('imageGallery.loadError', 'Failed to load image')}
              </p>
            </div>
          )}
        </div>

        {/* Footer with media info */}
        <div className="flex flex-col gap-2 border-t px-4 py-3">
          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Media type badge */}
            {isVideo && (
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium">
                <Film className="h-3 w-3" />
                {t('imageGallery.video', 'Video')}
              </span>
            )}

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

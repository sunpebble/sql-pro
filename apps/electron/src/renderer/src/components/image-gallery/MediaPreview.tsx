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
  LocateFixed,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
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
  /** Callback to locate the media in the data table */
  onLocateInTable?: (rowIndex: number, column: string) => void;
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

/** Video metadata from ffprobe */
interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  codec: string;
  bitrate?: number;
  fps?: number;
  size: number;
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

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatBitrate(bitrate: number): string {
  if (bitrate < 1000) return `${bitrate} bps`;
  if (bitrate < 1000000) return `${(bitrate / 1000).toFixed(0)} Kbps`;
  return `${(bitrate / 1000000).toFixed(1)} Mbps`;
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
  onLocateInTable,
}: MediaPreviewProps) {
  const { t } = useTranslation('common');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [mediaDimensions, setMediaDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [sharpMetadata, setSharpMetadata] = useState<SharpMetadata | null>(
    null
  );
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(
    null
  );
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    setVideoMetadata(null);
    setIsPlaying(false);
    // Reset zoom and pan
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }

  // Zoom controls
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 10;
  const ZOOM_STEP = 0.25;

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s - ZOOM_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!mediaDimensions || !containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 80; // Account for nav buttons
    const containerHeight = container.clientHeight - 40;
    const scaleX = containerWidth / mediaDimensions.width;
    const scaleY = containerHeight / mediaDimensions.height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    setScale(fitScale);
    setPosition({ x: 0, y: 0 });
  }, [mediaDimensions]);

  // Mouse wheel zoom with cursor-centered zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isVideo) return;
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      const scaleFactor = newScale / scale;

      // Adjust position to zoom towards cursor
      setPosition((pos) => ({
        x: mouseX - (mouseX - pos.x) * scaleFactor,
        y: mouseY - (mouseY - pos.y) * scaleFactor,
      }));
      setScale(newScale);
    },
    [isVideo, scale]
  );

  // Mouse drag for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isVideo) return;
      // Allow dragging at any zoom level
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [isVideo, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Apply boundary limits based on image size and scale
      const container = containerRef.current;
      if (container && mediaDimensions) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaledWidth = mediaDimensions.width * scale;
        const scaledHeight = mediaDimensions.height * scale;

        // Allow some overflow but not too much
        const maxOverflow = 100;
        const maxX = Math.max(
          maxOverflow,
          (scaledWidth - containerWidth) / 2 + maxOverflow
        );
        const maxY = Math.max(
          maxOverflow,
          (scaledHeight - containerHeight) / 2 + maxOverflow
        );

        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, dragStart, scale, mediaDimensions]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double click to toggle zoom at cursor position
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isVideo) return;

      const container = containerRef.current;
      if (!container) return;

      if (scale === 1) {
        // Zoom in to 2x centered on cursor
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        setPosition({
          x: -mouseX,
          y: -mouseY,
        });
        setScale(2);
      } else {
        // Reset zoom
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    },
    [isVideo, scale]
  );

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

  // Fetch video metadata using ffprobe
  useEffect(() => {
    if (!isVideo) {
      setVideoMetadata(null);
      return;
    }

    const fetchVideoMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        let url: string | undefined;
        if (item.source?.type === 'url') {
          url = item.source.url;
        } else if (item.source?.type === 'file') {
          url = item.source.path;
        }

        if (!url) {
          setIsLoadingMetadata(false);
          return;
        }

        const result = await window.sqlPro.video.getMetadata({ url });
        if (result.success && result.metadata) {
          setVideoMetadata(result.metadata);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error('[MediaPreview] Failed to fetch video metadata:', {
          error: errorMessage,
        });
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchVideoMetadata();
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
      } else if ((e.key === '+' || e.key === '=') && !isVideo) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' && !isVideo) {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' && !isVideo) {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hasPrev,
    hasNext,
    onPrev,
    onNext,
    onClose,
    isVideo,
    togglePlayPause,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
  ]);

  // Copy image to clipboard - convert to PNG if needed
  const handleCopyMedia = useCallback(async () => {
    if (!displayUrl) return;

    if (isVideo) {
      toast.info(
        t('mediaGallery.videoCopyNotSupported', 'Video copy not supported')
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

      toast.success(t('mediaGallery.imageCopied', 'Image copied to clipboard'));
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast.error(t('mediaGallery.copyFailed', 'Failed to copy image'));
    }
  }, [displayUrl, t, isVideo]);

  // Copy to clipboard hook
  const { copy } = useCopyToClipboard();

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (item.source?.type === 'url') {
      await copy(item.source.url, {
        successMessage: t('mediaGallery.urlCopied', 'URL copied to clipboard'),
        errorMessage: t('mediaGallery.copyUrlFailed', 'Failed to copy URL'),
      });
    }
  }, [item.source, t, copy]);

  // Open media in external browser (for URLs)
  const handleOpenExternal = useCallback(() => {
    if (item.source?.type === 'url') {
      window.open(item.source.url, '_blank');
    }
  }, [item.source]);

  // Locate in data table
  const handleLocateInTable = useCallback(() => {
    onLocateInTable?.(item.rowIndex, item.column);
    onClose();
  }, [item.rowIndex, item.column, onLocateInTable, onClose]);

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

      toast.success(t('mediaGallery.downloadStarted', 'Download started'));
    } catch {
      toast.error(t('mediaGallery.downloadFailed', 'Download failed'));
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
    // Video metadata from ffprobe
    if (videoMetadata) {
      return {
        format: videoMetadata.format.toUpperCase(),
        size: formatBytes(videoMetadata.size),
        width: videoMetadata.width,
        height: videoMetadata.height,
        duration: videoMetadata.duration,
        codec: videoMetadata.codec,
        bitrate: videoMetadata.bitrate,
        fps: videoMetadata.fps,
        isVideo: true,
      };
    }
    // Image metadata from sharp
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
        isVideo: false,
      };
    }
    return {
      format: mediaInfo.type,
      size: mediaInfo.size,
      width: mediaDimensions?.width,
      height: mediaDimensions?.height,
      isVideo,
    };
  }, [sharpMetadata, videoMetadata, mediaInfo, mediaDimensions, isVideo]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="top-10 flex h-[calc(100vh-80px)] w-[calc(100vw-80px)] max-w-[calc(100vw-80px)] -translate-y-0 flex-col gap-0 p-0 sm:max-w-[calc(100vw-80px)]"
        showCloseButton={false}
      >
        {/* Navigation buttons - positioned relative to dialog for stable position */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            'bg-background/90 absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full border p-2 shadow-md transition-all',
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
            'bg-background/90 absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full border p-2 shadow-md transition-all',
            hasNext
              ? 'hover:bg-background hover:scale-110'
              : 'cursor-not-allowed opacity-30'
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2">
                {isVideo && <Film className="h-4 w-4" />}
                {isVideo
                  ? t('mediaGallery.videoPreview', 'Video Preview')
                  : t('mediaGallery.preview', 'Image Preview')}
              </DialogTitle>
              <DialogDescription className="truncate">
                Row {item.rowIndex + 1} · {item.column} · {currentIndex + 1} /{' '}
                {totalCount}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Zoom controls (images only) */}
              {!isVideo && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="hover:bg-muted rounded-md p-2 transition-colors"
                    title={t('mediaGallery.zoomOut', 'Zoom out (-)')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-muted-foreground min-w-[4rem] text-center text-xs">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="hover:bg-muted rounded-md p-2 transition-colors"
                    title={t('mediaGallery.zoomIn', 'Zoom in (+)')}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="hover:bg-muted rounded-md p-2 transition-colors"
                    title={t('mediaGallery.resetZoom', 'Reset zoom (0)')}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleFitToScreen}
                    className="hover:bg-muted rounded-md p-2 transition-colors"
                    title={t('mediaGallery.fitToScreen', 'Fit to screen')}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <div className="bg-border mx-1 h-4 w-px" />
                </>
              )}

              {/* Locate in table button */}
              {onLocateInTable && (
                <button
                  onClick={handleLocateInTable}
                  className="hover:bg-muted rounded-md p-2 transition-colors"
                  title={t('mediaGallery.locateInTable', 'Locate in table')}
                >
                  <LocateFixed className="h-4 w-4" />
                </button>
              )}

              {/* Copy button (images only) */}
              {!isVideo && (
                <button
                  onClick={handleCopyMedia}
                  className="hover:bg-muted rounded-md p-2 transition-colors"
                  title={t('mediaGallery.copyImage', 'Copy image')}
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}

              {/* Open external (for URLs) */}
              {item.source?.type === 'url' && (
                <button
                  onClick={handleOpenExternal}
                  className="hover:bg-muted rounded-md p-2 transition-colors"
                  title={t('mediaGallery.openExternal', 'Open in browser')}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="hover:bg-muted rounded-md p-2 transition-colors"
                title={t('mediaGallery.download', 'Download')}
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
        <div
          ref={containerRef}
          className={cn(
            'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5',
            !isVideo && 'cursor-grab',
            !isVideo && isDragging && 'cursor-grabbing'
          )}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Media content */}
          {displayUrl && !loadError ? (
            isVideo ? (
              <div className="relative flex h-full w-full items-center justify-center p-4">
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
                <div className="pointer-events-none absolute right-6 bottom-16 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white opacity-50">
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  <span>Space</span>
                </div>
              </div>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                onDoubleClick={handleDoubleClick}
              >
                <img
                  ref={imageRef}
                  src={displayUrl}
                  alt={`Row ${item.rowIndex + 1}, ${item.column}`}
                  className="max-h-full max-w-full object-contain select-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  onError={() => setLoadError(true)}
                  onLoad={handleImageLoad}
                  draggable={false}
                />
              </div>
            )
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <ImageOff className="h-16 w-16" />
              <p>
                {isVideo
                  ? t('mediaGallery.videoLoadError', 'Failed to load video')
                  : t('mediaGallery.loadError', 'Failed to load image')}
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
                {t('mediaGallery.video', 'Video')}
              </span>
            )}

            {/* Format badge */}
            <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
              {t('mediaGallery.format', 'Format')}: {displayMetadata.format}
              {displayMetadata.isAnimated && (
                <span className="text-muted-foreground ml-1">
                  ({displayMetadata.pages} frames)
                </span>
              )}
            </span>

            {/* Size badge */}
            {displayMetadata.size && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('mediaGallery.size', 'Size')}: {displayMetadata.size}
              </span>
            )}

            {/* Dimensions badge */}
            {displayMetadata.width && displayMetadata.height && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {displayMetadata.width} × {displayMetadata.height}
              </span>
            )}

            {/* Color info badge (from sharp) */}
            {'colorInfo' in displayMetadata && displayMetadata.colorInfo && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {displayMetadata.colorInfo}
              </span>
            )}

            {/* Video-specific metadata */}
            {'duration' in displayMetadata &&
              displayMetadata.duration !== undefined &&
              displayMetadata.duration > 0 && (
                <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                  {t('mediaGallery.duration', 'Duration')}:{' '}
                  {formatDuration(displayMetadata.duration)}
                </span>
              )}

            {'codec' in displayMetadata && displayMetadata.codec && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('mediaGallery.codec', 'Codec')}: {displayMetadata.codec}
              </span>
            )}

            {'bitrate' in displayMetadata && displayMetadata.bitrate && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('mediaGallery.bitrate', 'Bitrate')}:{' '}
                {formatBitrate(displayMetadata.bitrate)}
              </span>
            )}

            {'fps' in displayMetadata && displayMetadata.fps && (
              <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                {t('mediaGallery.fps', 'FPS')}: {displayMetadata.fps.toFixed(2)}
              </span>
            )}

            {/* Loading indicator */}
            {isLoadingMetadata && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('mediaGallery.loadingMetadata', 'Loading metadata...')}
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
                title={t('mediaGallery.copyUrl', 'Copy URL')}
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

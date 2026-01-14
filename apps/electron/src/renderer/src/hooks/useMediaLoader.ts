import type { MediaSource } from '@/lib/image-utils';
import { useCallback, useMemo, useRef, useState } from 'react';
import { getMediaDisplayUrl } from '@/lib/image-utils';

// ============================================================================
// Types
// ============================================================================

/** Media loading status */
export type MediaLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Options for useMediaLoader hook */
export interface UseMediaLoaderOptions {
  /** Placeholder URL to show while loading or on error */
  placeholder?: string;
  /** Enable lazy loading (uses native loading="lazy" for images) */
  lazy?: boolean;
  /** Enable fallback to original URL if proxy fails (for URL sources) */
  enableFallback?: boolean;
  /** Callback when media loads successfully */
  onLoad?: () => void;
  /** Callback when media fails to load */
  onError?: (error: Error) => void;
  /** Custom alt text for images */
  alt?: string;
  /** Additional className for the media element */
  className?: string;
  /** crossOrigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/** Return type of useMediaLoader hook */
export interface UseMediaLoaderResult {
  /** Props to spread on the img element (for images) */
  imgProps: {
    src: string | undefined;
    alt: string;
    loading?: 'lazy' | 'eager';
    onLoad: () => void;
    onError: () => void;
    crossOrigin?: 'anonymous' | 'use-credentials';
    className?: string;
  };
  /** Props to spread on the video element (for videos) */
  videoProps: {
    src: string | undefined;
    onLoadedData: () => void;
    onError: () => void;
    crossOrigin?: 'anonymous' | 'use-credentials';
    className?: string;
    controls?: boolean;
    muted?: boolean;
    playsInline?: boolean;
  };
  /** Key for forcing re-render (use as key prop on img/video element) */
  mediaKey: string;
  /** Current loading status */
  status: MediaLoadStatus;
  /** Whether the media is currently loading */
  isLoading: boolean;
  /** Whether the media has loaded successfully */
  isLoaded: boolean;
  /** Whether the media failed to load */
  isError: boolean;
  /** Whether the source is a video */
  isVideo: boolean;
  /** Retry loading the media */
  retry: () => void;
  /** The current display URL (may be proxy, fallback, or placeholder) */
  displayUrl: string | undefined;
  /** Whether currently using fallback URL */
  usingFallback: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing media (image or video) loading state with support for:
 * - Loading/loaded/error states
 * - Automatic fallback from proxy to original URL
 * - Placeholder content
 * - Lazy loading (for images)
 * - Retry functionality
 *
 * @param source - Media source (from detectMediaSource)
 * @param options - Configuration options
 * @returns Media props and state management utilities
 */
export function useMediaLoader(
  source: MediaSource,
  options: UseMediaLoaderOptions = {}
): UseMediaLoaderResult {
  const {
    placeholder,
    lazy = false,
    enableFallback = true,
    onLoad,
    onError,
    alt = '',
    className,
    crossOrigin,
  } = options;

  // State
  const [status, setStatus] = useState<MediaLoadStatus>('idle');
  const [useFallback, setUseFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for tracking source changes
  const prevSourceKeyRef = useRef<string | null>(null);

  // Check if source is video
  const isVideo = useMemo(() => {
    if (!source) return false;
    return source.isVideo;
  }, [source]);

  // Generate a stable key for the source to detect changes
  const sourceKey = useMemo(() => {
    if (!source) return null;
    switch (source.type) {
      case 'url':
        return `url:${source.url}`;
      case 'base64':
        return `base64:${source.dataUrl.slice(0, 50)}`;
      case 'blob':
        return `blob:${source.mimeType}:${source.data.byteLength}`;
      case 'file':
        return `file:${source.path}`;
      default:
        return null;
    }
  }, [source]);

  // Get proxy URL and original URL
  const proxyUrl = useMemo(() => getMediaDisplayUrl(source), [source]);
  const originalUrl = useMemo(
    () => (source?.type === 'url' ? source.url : null),
    [source]
  );

  // Reset state when source changes (using render-time check instead of useEffect)
  if (sourceKey !== prevSourceKeyRef.current) {
    prevSourceKeyRef.current = sourceKey;
    // Only reset if this is not the initial render
    if (prevSourceKeyRef.current !== undefined) {
      setStatus(source ? 'loading' : 'idle');
      setUseFallback(false);
    }
  }

  // Determine the current display URL
  const displayUrl = useMemo(() => {
    // No source - use placeholder or undefined
    if (!source || !proxyUrl) {
      return placeholder;
    }

    // If using fallback and we have an original URL
    if (useFallback && originalUrl) {
      return originalUrl;
    }

    // Default to proxy URL
    return proxyUrl;
  }, [source, proxyUrl, originalUrl, useFallback, placeholder]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setStatus('loaded');
    onLoad?.();
  }, [onLoad]);

  // Handle load error
  const handleError = useCallback(() => {
    // If proxy URL failed and we have an original URL, try fallback
    if (enableFallback && !useFallback && originalUrl) {
      setUseFallback(true);
      setStatus('loading');
      return;
    }

    // All attempts failed
    setStatus('error');
    onError?.(new Error('Failed to load media'));
  }, [enableFallback, useFallback, originalUrl, onError]);

  // Retry loading
  const retry = useCallback(() => {
    setUseFallback(false);
    setStatus('loading');
    setRetryCount((c) => c + 1);
  }, []);

  // Build img props (without key - use mediaKey separately)
  const imgProps = useMemo(
    () => ({
      src: displayUrl,
      alt,
      loading: lazy ? ('lazy' as const) : undefined,
      onLoad: handleLoad,
      onError: handleError,
      crossOrigin: useFallback ? ('anonymous' as const) : crossOrigin,
      className,
    }),
    [
      displayUrl,
      alt,
      lazy,
      handleLoad,
      handleError,
      useFallback,
      crossOrigin,
      className,
    ]
  );

  // Build video props (without key - use mediaKey separately)
  const videoProps = useMemo(
    () => ({
      src: displayUrl,
      onLoadedData: handleLoad,
      onError: handleError,
      crossOrigin: useFallback ? ('anonymous' as const) : crossOrigin,
      className,
      controls: true,
      muted: true,
      playsInline: true,
    }),
    [displayUrl, handleLoad, handleError, useFallback, crossOrigin, className]
  );

  // Key for forcing re-render on retry (use as key prop on img/video element)
  const mediaKey = `${sourceKey}-${retryCount}`;

  return {
    imgProps,
    videoProps,
    mediaKey,
    status,
    isLoading: status === 'loading',
    isLoaded: status === 'loaded',
    isError: status === 'error',
    isVideo,
    retry,
    displayUrl,
    usingFallback: useFallback,
  };
}

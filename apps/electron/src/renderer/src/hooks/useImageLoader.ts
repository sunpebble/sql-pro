import type { ImageSource } from '@/lib/image-utils';
import { useCallback, useMemo, useRef, useState } from 'react';
import { getImageDisplayUrl } from '@/lib/image-utils';

// ============================================================================
// Types
// ============================================================================

/** Image loading status */
export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Options for useImageLoader hook */
export interface UseImageLoaderOptions {
  /** Placeholder image URL to show while loading or on error */
  placeholder?: string;
  /** Enable lazy loading (uses native loading="lazy") */
  lazy?: boolean;
  /** Enable fallback to original URL if proxy fails (for URL sources) */
  enableFallback?: boolean;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: (error: Error) => void;
  /** Custom alt text */
  alt?: string;
  /** Additional className for the img element */
  className?: string;
  /** crossOrigin attribute */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/** Return type of useImageLoader hook */
export interface UseImageLoaderResult {
  /** Props to spread on the img element */
  imgProps: {
    src: string | undefined;
    alt: string;
    loading?: 'lazy' | 'eager';
    onLoad: () => void;
    onError: () => void;
    crossOrigin?: 'anonymous' | 'use-credentials';
    className?: string;
  };
  /** Current loading status */
  status: ImageLoadStatus;
  /** Whether the image is currently loading */
  isLoading: boolean;
  /** Whether the image has loaded successfully */
  isLoaded: boolean;
  /** Whether the image failed to load */
  isError: boolean;
  /** Retry loading the image */
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
 * Hook for managing image loading state with support for:
 * - Loading/loaded/error states
 * - Automatic fallback from proxy to original URL
 * - Placeholder images
 * - Lazy loading
 * - Retry functionality
 *
 * @param source - Image source (from detectImageSource)
 * @param options - Configuration options
 * @returns Image props and state management utilities
 *
 * @example
 * ```tsx
 * const { imgProps, status, retry } = useImageLoader(imageSource, {
 *   placeholder: '/placeholder.png',
 *   lazy: true,
 * });
 *
 * return (
 *   <div>
 *     {status === 'loading' && <Spinner />}
 *     <img {...imgProps} />
 *     {status === 'error' && <button onClick={retry}>Retry</button>}
 *   </div>
 * );
 * ```
 */
export function useImageLoader(
  source: ImageSource,
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
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
  const [status, setStatus] = useState<ImageLoadStatus>('idle');
  const [useFallback, setUseFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for tracking source changes
  const prevSourceKeyRef = useRef<string | null>(null);

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
      default:
        return null;
    }
  }, [source]);

  // Get proxy URL and original URL
  const proxyUrl = useMemo(() => getImageDisplayUrl(source), [source]);
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
    onError?.(new Error('Failed to load image'));
  }, [enableFallback, useFallback, originalUrl, onError]);

  // Retry loading
  const retry = useCallback(() => {
    setUseFallback(false);
    setStatus('loading');
    setRetryCount((c) => c + 1);
  }, []);

  // Build img props
  const imgProps = useMemo(
    () => ({
      src: displayUrl,
      alt,
      loading: lazy ? ('lazy' as const) : undefined,
      onLoad: handleLoad,
      onError: handleError,
      crossOrigin: useFallback ? ('anonymous' as const) : crossOrigin,
      className,
      // Key to force re-render on retry
      key: `${sourceKey}-${retryCount}`,
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
      sourceKey,
      retryCount,
    ]
  );

  return {
    imgProps,
    status,
    isLoading: status === 'loading',
    isLoaded: status === 'loaded',
    isError: status === 'error',
    retry,
    displayUrl,
    usingFallback: useFallback,
  };
}

// ============================================================================
// Convenience Hook for URL strings
// ============================================================================

/**
 * Simplified hook for loading images from URL strings.
 * Automatically wraps the URL in an ImageSource.
 *
 * @param url - Image URL string
 * @param options - Configuration options
 * @returns Image props and state management utilities
 */
export function useImageUrlLoader(
  url: string | null | undefined,
  options: UseImageLoaderOptions = {}
): UseImageLoaderResult {
  const source: ImageSource = useMemo(() => {
    if (!url) return null;
    return { type: 'url', url };
  }, [url]);

  return useImageLoader(source, options);
}

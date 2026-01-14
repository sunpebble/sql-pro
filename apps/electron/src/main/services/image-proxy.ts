/**
 * Image Proxy Service
 *
 * Provides a custom `sqlpro://` protocol handler for proxying remote images.
 * This solves CORS issues and enables clipboard operations for remote images.
 *
 * Features:
 * - LRU in-memory cache to avoid repeated downloads
 * - Sharp-based metadata extraction for detailed image info
 * - Proper MIME type handling
 */

import { Buffer } from 'node:buffer';
import { protocol } from 'electron';
import sharp from 'sharp';

// ============================================================================
// Types
// ============================================================================

/** Cached image entry with metadata */
interface CachedImage {
  buffer: Buffer;
  mimeType: string;
  metadata: ImageMetadata;
  /** Timestamp when cached */
  cachedAt: number;
  /** Size in bytes */
  size: number;
}

/** Image metadata extracted by sharp */
export interface ImageMetadata {
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
// LRU Cache
// ============================================================================

/** Maximum number of cached images */
const MAX_CACHE_ENTRIES = 100;

/** Maximum total cache size in bytes (50MB) */
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

/** Image cache using Map for LRU behavior (iteration order = insertion order) */
const imageCache = new Map<string, CachedImage>();

/** Current total cache size in bytes */
let currentCacheSize = 0;

/**
 * Get an image from cache, updating LRU order
 */
function getCached(url: string): CachedImage | undefined {
  const cached = imageCache.get(url);
  if (cached) {
    // Move to end (most recently used) by re-inserting
    imageCache.delete(url);
    imageCache.set(url, cached);
  }
  return cached;
}

/**
 * Add an image to cache, evicting old entries if needed
 */
function setCached(url: string, entry: CachedImage): void {
  // Remove if already exists (to update LRU order)
  const existing = imageCache.get(url);
  if (existing) {
    currentCacheSize -= existing.size;
    imageCache.delete(url);
  }

  // Evict entries until we have room
  while (
    (imageCache.size >= MAX_CACHE_ENTRIES ||
      currentCacheSize + entry.size > MAX_CACHE_SIZE) &&
    imageCache.size > 0
  ) {
    // Get first (oldest) entry
    const firstKey = imageCache.keys().next().value;
    if (firstKey) {
      const firstEntry = imageCache.get(firstKey);
      if (firstEntry) {
        currentCacheSize -= firstEntry.size;
      }
      imageCache.delete(firstKey);
    }
  }

  // Add new entry
  imageCache.set(url, entry);
  currentCacheSize += entry.size;
}

/**
 * Clear the entire image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
  currentCacheSize = 0;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  size: number;
  maxEntries: number;
  maxSize: number;
} {
  return {
    entries: imageCache.size,
    size: currentCacheSize,
    maxEntries: MAX_CACHE_ENTRIES,
    maxSize: MAX_CACHE_SIZE,
  };
}

// ============================================================================
// Image Fetching and Processing
// ============================================================================

/**
 * Detect MIME type from buffer magic bytes
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'application/octet-stream';

  // Check magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    // RIFF header - check for WebP
    if (
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }
  }
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'image/bmp';
  }
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  ) {
    return 'image/x-icon';
  }

  return 'application/octet-stream';
}

/**
 * Extract metadata from image buffer using sharp
 */
async function extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
      size: buffer.length,
      space: metadata.space,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      isAnimated: (metadata.pages ?? 1) > 1,
      density: metadata.density,
      pages: metadata.pages,
    };
  } catch {
    // If sharp fails, return basic metadata
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: buffer.length,
    };
  }
}

/**
 * Fetch image from URL and process it
 */
async function fetchAndProcessImage(
  url: string
): Promise<{ buffer: Buffer; mimeType: string; metadata: ImageMetadata }> {
  // Use session.fetch which uses Chromium's network stack with cookie support
  // This helps bypass anti-bot protection that requires cookies
  const { session } = await import('electron');

  // Use browser-like headers to avoid 401/403 errors from some servers
  const response = await session.defaultSession.fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get MIME type from response or detect from buffer
  let mimeType = response.headers.get('content-type') ?? '';
  if (!mimeType || !mimeType.startsWith('image/')) {
    mimeType = detectMimeType(buffer);
  }

  // Extract metadata using sharp
  const metadata = await extractMetadata(buffer);

  return { buffer, mimeType, metadata };
}

// ============================================================================
// Protocol Handler
// ============================================================================

/**
 * Register the sqlpro:// scheme as privileged.
 * MUST be called before app.whenReady()
 */
export function registerImageProxyScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'sqlpro',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}

/**
 * Setup the protocol handler for sqlpro:// URLs.
 * Must be called after app.whenReady()
 */
export function setupImageProxyHandler(): void {
  protocol.handle('sqlpro', async (request) => {
    const url = new URL(request.url);

    // Handle image proxy requests: sqlpro://image/<encoded-url>
    if (url.host === 'image') {
      try {
        // Decode the original URL from the path
        const encodedUrl = url.pathname.slice(1); // Remove leading /
        const originalUrl = decodeURIComponent(encodedUrl);

        if (!originalUrl) {
          return new Response('Missing URL', {
            status: 400,
            headers: { 'content-type': 'text/plain' },
          });
        }

        // Check cache first
        let cached = getCached(originalUrl);

        if (!cached) {
          // Fetch and cache
          const { buffer, mimeType, metadata } =
            await fetchAndProcessImage(originalUrl);

          cached = {
            buffer,
            mimeType,
            metadata,
            cachedAt: Date.now(),
            size: buffer.length,
          };

          setCached(originalUrl, cached);
        }

        // Return the cached image
        return new Response(cached.buffer, {
          status: 200,
          headers: {
            'content-type': cached.mimeType,
            'content-length': String(cached.size),
            'cache-control': 'private, max-age=3600',
            // Include metadata as custom headers for easy access
            'x-image-width': String(cached.metadata.width),
            'x-image-height': String(cached.metadata.height),
            'x-image-format': cached.metadata.format,
          },
        });
      } catch (error) {
        console.error('[ImageProxy] Error fetching image:', error);
        return new Response(
          `Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            status: 500,
            headers: { 'content-type': 'text/plain' },
          }
        );
      }
    }

    // Unknown endpoint
    return new Response('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain' },
    });
  });
}

/**
 * Get metadata for an image URL.
 * Uses cache if available, otherwise fetches and caches the image.
 */
export async function getImageMetadata(
  url: string
): Promise<ImageMetadata | null> {
  try {
    // Check if already cached
    const cached = getCached(url);
    if (cached) {
      return cached.metadata;
    }

    // Fetch and cache
    const { buffer, mimeType, metadata } = await fetchAndProcessImage(url);

    setCached(url, {
      buffer,
      mimeType,
      metadata,
      cachedAt: Date.now(),
      size: buffer.length,
    });

    return metadata;
  } catch (error) {
    console.error('[ImageProxy] Error getting metadata:', error);
    return null;
  }
}

/**
 * Get cached image buffer if available
 */
export function getCachedImageBuffer(url: string): Buffer | null {
  const cached = getCached(url);
  return cached?.buffer ?? null;
}

// ============================================================================
// HEAD Request Preflight Check
// ============================================================================

/** Result of HEAD request preflight check */
export interface ImageCheckResult {
  isImage: boolean;
  mimeType?: string;
  contentLength?: number;
  error?: string;
}

/** Cache for HEAD request results (URL -> result) */
const headCheckCache = new Map<
  string,
  { result: ImageCheckResult; timestamp: number }
>();

/** HEAD check cache TTL in milliseconds (5 minutes) */
const HEAD_CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if a URL points to an image using HEAD request.
 * This is a lightweight preflight check that doesn't download the full image.
 * Results are cached for 5 minutes.
 */
export async function checkImageUrl(url: string): Promise<ImageCheckResult> {
  // Check cache first
  const cached = headCheckCache.get(url);
  if (cached && Date.now() - cached.timestamp < HEAD_CACHE_TTL) {
    return cached.result;
  }

  // Use session.fetch for better cookie handling
  const { session } = await import('electron');

  // Browser-like headers to avoid 401/403 errors
  const browserHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    const response = await session.defaultSession.fetch(url, {
      method: 'HEAD',
      headers: browserHeaders,
    });

    if (!response.ok) {
      const result: ImageCheckResult = {
        isImage: false,
        error: `HTTP ${response.status}`,
      };
      headCheckCache.set(url, { result, timestamp: Date.now() });
      return result;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const contentLength = response.headers.get('content-length');

    // Check if content type indicates an image
    const isImage = contentType.startsWith('image/');

    const result: ImageCheckResult = {
      isImage,
      mimeType: contentType.split(';')[0].trim(),
      contentLength: contentLength
        ? Number.parseInt(contentLength, 10)
        : undefined,
    };

    headCheckCache.set(url, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    // If HEAD fails (some servers don't support it), try a GET with range
    try {
      const response = await session.defaultSession.fetch(url, {
        method: 'GET',
        headers: {
          ...browserHeaders,
          Range: 'bytes=0-0', // Request only first byte
        },
      });

      const contentType = response.headers.get('content-type') ?? '';
      const isImage = contentType.startsWith('image/');

      const result: ImageCheckResult = {
        isImage,
        mimeType: contentType.split(';')[0].trim(),
      };

      headCheckCache.set(url, { result, timestamp: Date.now() });
      return result;
    } catch {
      const result: ImageCheckResult = {
        isImage: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
      headCheckCache.set(url, { result, timestamp: Date.now() });
      return result;
    }
  }
}

/**
 * Clear the HEAD check cache
 */
export function clearHeadCheckCache(): void {
  headCheckCache.clear();
}

// ============================================================================
// Full Image Validation (HEAD + Sharp)
// ============================================================================

/** Result of full image validation */
export interface ImageValidationResult {
  isValid: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  error?: string;
}

/** Cache for validation results */
const validationCache = new Map<
  string,
  { result: ImageValidationResult; timestamp: number }
>();

/** Validation cache TTL (10 minutes) */
const VALIDATION_CACHE_TTL = 10 * 60 * 1000;

/**
 * Validate a URL is actually a renderable image.
 * Performs double validation:
 * 1. HEAD request to check Content-Type is image/*
 * 2. Sharp metadata extraction to verify it's decodable
 *
 * Results are cached for 10 minutes.
 */
export async function validateImageUrl(
  url: string
): Promise<ImageValidationResult> {
  // Check cache first
  const cached = validationCache.get(url);
  if (cached && Date.now() - cached.timestamp < VALIDATION_CACHE_TTL) {
    return cached.result;
  }

  try {
    // Step 1: HEAD check for Content-Type
    const headResult = await checkImageUrl(url);
    if (!headResult.isImage) {
      const result: ImageValidationResult = {
        isValid: false,
        error: headResult.error ?? 'Not an image (Content-Type check failed)',
      };
      validationCache.set(url, { result, timestamp: Date.now() });
      return result;
    }

    // Step 2: Fetch and validate with Sharp
    const metadata = await getImageMetadata(url);
    if (!metadata) {
      const result: ImageValidationResult = {
        isValid: false,
        error: 'Failed to decode image metadata',
      };
      validationCache.set(url, { result, timestamp: Date.now() });
      return result;
    }

    // Both checks passed - it's a valid image
    const result: ImageValidationResult = {
      isValid: true,
      mimeType: headResult.mimeType,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
    validationCache.set(url, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    const result: ImageValidationResult = {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
    validationCache.set(url, { result, timestamp: Date.now() });
    return result;
  }
}

/**
 * Clear the validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

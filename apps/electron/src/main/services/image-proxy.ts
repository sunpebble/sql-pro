/**
 * Media Proxy Service
 *
 * Provides a custom `quarry://` protocol handler for proxying remote media (images and videos).
 * This solves CORS issues and enables clipboard operations for remote images.
 *
 * Features:
 * - LRU in-memory cache to avoid repeated downloads
 * - Sharp-based metadata extraction for detailed image info
 * - Proper MIME type handling for images and videos
 * - Local file serving for file:// paths
 */

import { Buffer } from 'node:buffer';
import { access, readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, normalize } from 'node:path';
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
  depth?: string;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  density?: number;
  pages?: number;
  // Extended metadata
  orientation?: number;
  chromaSubsampling?: string;
  isProgressive?: boolean;
  compression?: string;
  resolutionUnit?: string;
  // EXIF data
  exif?: {
    make?: string;
    model?: string;
    software?: string;
    dateTime?: string;
    exposureTime?: string;
    fNumber?: number;
    iso?: number;
    focalLength?: number;
    gpsLatitude?: number;
    gpsLongitude?: number;
  };
  // ICC profile
  iccProfile?: string;
  // File info (for local files)
  fileName?: string;
  filePath?: string;
  createdAt?: string;
  modifiedAt?: string;
}

// ============================================================================
// LRU Cache
// ============================================================================

/** Maximum number of cached images */
const MAX_CACHE_ENTRIES = 100;

/** Maximum total cache size in bytes (200MB for video support) */
const MAX_CACHE_SIZE = 200 * 1024 * 1024;

/** Maximum single file size to cache (150MB) */
const MAX_SINGLE_FILE_SIZE = 150 * 1024 * 1024;

/** Image cache using Map for LRU behavior (iteration order = insertion order) */
const imageCache = new Map<string, CachedImage>();

/** Current total cache size in bytes */
let currentCacheSize = 0;

// Regex for printable ASCII characters
const PRINTABLE_ASCII_REGEX = /^[\x20-\x7E]+$/;

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
  // Skip caching if single file is too large
  if (entry.size > MAX_SINGLE_FILE_SIZE) {
    return;
  }

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
 * Detect MIME type from buffer magic bytes (images and videos)
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'application/octet-stream';

  // Check image magic bytes
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
    // RIFF header - check for WebP or AVI
    if (buffer.length >= 12) {
      if (
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
      ) {
        return 'image/webp';
      }
      if (
        buffer[8] === 0x41 &&
        buffer[9] === 0x56 &&
        buffer[10] === 0x49 &&
        buffer[11] === 0x20
      ) {
        return 'video/x-msvideo';
      }
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

  // Check video magic bytes
  // MP4/MOV (ftyp box at offset 4)
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return 'video/mp4';
  }
  // WebM/MKV
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }

  return 'application/octet-stream';
}

/**
 * Parse EXIF data from sharp metadata
 */
function parseExifData(
  exifBuffer: Buffer | undefined
): ImageMetadata['exif'] | undefined {
  if (!exifBuffer) return undefined;

  try {
    // Sharp provides raw EXIF buffer, we need to parse it
    // For now, return undefined - full EXIF parsing would require exif-reader
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract metadata from image buffer using sharp
 */
async function extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();

    // Get ICC profile name if available
    let iccProfile: string | undefined;
    if (metadata.icc) {
      try {
        // Try to extract profile description from ICC buffer
        // ICC profile description is typically at offset 128 with length at 124
        const descOffset = metadata.icc.indexOf('desc');
        if (descOffset > 0 && descOffset + 20 < metadata.icc.length) {
          // Simple extraction - look for readable ASCII after 'desc'
          const slice = metadata.icc.subarray(
            descOffset + 12,
            descOffset + 100
          );
          const nullIndex = slice.indexOf(0);
          if (nullIndex > 0) {
            const profileName = slice.subarray(0, nullIndex).toString('ascii');
            if (profileName && PRINTABLE_ASCII_REGEX.test(profileName)) {
              iccProfile = profileName;
            }
          }
        }
        // Fallback: use space as profile indicator
        if (!iccProfile && metadata.space) {
          iccProfile = `${metadata.space.toUpperCase()} Profile`;
        }
      } catch {
        // Ignore ICC parsing errors
      }
    }

    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
      size: buffer.length,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      hasAlpha: metadata.hasAlpha,
      isAnimated: (metadata.pages ?? 1) > 1,
      density: metadata.density,
      pages: metadata.pages,
      // Extended metadata
      orientation: metadata.orientation,
      chromaSubsampling: metadata.chromaSubsampling,
      isProgressive: metadata.isProgressive,
      compression: metadata.compression,
      resolutionUnit: metadata.resolutionUnit,
      // EXIF data
      exif: parseExifData(metadata.exif),
      // ICC profile
      iccProfile,
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

const BYTE_RANGE_RE = /bytes=(\d+)-(\d*)/;

/**
 * Parse and clamp HTTP Range (bytes=) to valid buffer slice indices.
 */
function parseClampedByteRange(
  rangeHeader: string | null,
  bufferLength: number
): { start: number; end: number } | null {
  if (!rangeHeader || bufferLength <= 0) return null;
  const match = rangeHeader.match(BYTE_RANGE_RE);
  if (!match) return null;
  const maxIndex = bufferLength - 1;
  let start = Number.parseInt(match[1], 10);
  let end = match[2] ? Number.parseInt(match[2], 10) : maxIndex;
  if (Number.isNaN(start)) start = 0;
  if (Number.isNaN(end)) end = maxIndex;
  start = Math.min(Math.max(0, start), maxIndex);
  end = Math.min(Math.max(0, end), maxIndex);
  if (start > end) {
    const t = start;
    start = end;
    end = t;
  }
  return { start, end };
}

/**
 * Fetch media (image or video) from URL and process it
 */
async function fetchAndProcessMedia(
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
        'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
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
  if (
    !mimeType ||
    (!mimeType.startsWith('image/') && !mimeType.startsWith('video/'))
  ) {
    mimeType = detectMimeType(buffer);
  }

  // Extract metadata using sharp (only for images)
  let metadata: ImageMetadata;
  if (mimeType.startsWith('image/')) {
    metadata = await extractMetadata(buffer);
  } else {
    // For videos, just return basic metadata
    metadata = {
      width: 0,
      height: 0,
      format: mimeType.split('/')[1] ?? 'unknown',
      size: buffer.length,
    };
  }

  return { buffer, mimeType, metadata };
}

// ============================================================================
// Protocol Handler
// ============================================================================

/**
 * Register the quarry:// scheme as privileged.
 * MUST be called before app.whenReady()
 */
export function registerImageProxyScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'quarry',
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
 * Setup the protocol handler for quarry:// URLs.
 * Must be called after app.whenReady()
 */
export function setupImageProxyHandler(): void {
  // Extension to MIME type mapping for local files (images and videos)
  const extToMime: Record<string, string> = {
    // Image types
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.avif': 'image/avif',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    // Video types
    '.mp4': 'video/mp4',
    '.m4v': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.ogv': 'video/ogg',
    '.3gp': 'video/3gpp',
  };

  protocol.handle('quarry', async (request) => {
    const url = new URL(request.url);

    // Handle local file requests: quarry://file/<encoded-path>
    if (url.host === 'file') {
      try {
        const encodedPath = url.pathname.slice(1); // Remove leading /
        const filePath = decodeURIComponent(encodedPath);

        if (!filePath) {
          return new Response('Missing file path', {
            status: 400,
            headers: { 'content-type': 'text/plain' },
          });
        }

        // Security: Validate file path to prevent path traversal attacks
        const normalizedPath = normalize(filePath);
        if (!isAbsolute(normalizedPath)) {
          return new Response('Only absolute file paths are allowed', {
            status: 403,
            headers: { 'content-type': 'text/plain' },
          });
        }
        if (normalizedPath.includes('..')) {
          return new Response('Path traversal is not allowed', {
            status: 403,
            headers: { 'content-type': 'text/plain' },
          });
        }

        // Read the local file
        const buffer = await readFile(normalizedPath);
        const ext = extname(filePath).toLowerCase();
        const mimeType = extToMime[ext] || detectMimeType(buffer);
        const isVideo = mimeType.startsWith('video/');

        // Handle Range requests for video streaming
        const rangeHeader = request.headers.get('range');
        if (rangeHeader && isVideo) {
          const range = parseClampedByteRange(rangeHeader, buffer.length);
          if (range) {
            const { start, end } = range;
            const chunkSize = end - start + 1;

            return new Response(buffer.subarray(start, end + 1), {
              status: 206,
              headers: {
                'content-type': mimeType,
                'content-length': String(chunkSize),
                'content-range': `bytes ${start}-${end}/${buffer.length}`,
                'accept-ranges': 'bytes',
                'cache-control': 'private, max-age=3600',
              },
            });
          }
        }

        return new Response(buffer, {
          status: 200,
          headers: {
            'content-type': mimeType,
            'content-length': String(buffer.length),
            'cache-control': 'private, max-age=3600',
            ...(isVideo ? { 'accept-ranges': 'bytes' } : {}),
          },
        });
      } catch (error) {
        console.error('[ImageProxy] Error reading local file:', error);
        return new Response(
          `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            status: 500,
            headers: { 'content-type': 'text/plain' },
          }
        );
      }
    }

    // Handle image proxy requests: quarry://image/<encoded-url>
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
            await fetchAndProcessMedia(originalUrl);

          cached = {
            buffer,
            mimeType,
            metadata,
            cachedAt: Date.now(),
            size: buffer.length,
          };

          setCached(originalUrl, cached);
        }

        // Handle Range requests for video streaming
        const rangeHeader = request.headers.get('range');
        if (rangeHeader && cached.mimeType.startsWith('video/')) {
          const range = parseClampedByteRange(
            rangeHeader,
            cached.buffer.length
          );
          if (range) {
            const { start, end } = range;
            const chunkSize = end - start + 1;

            // Return partial content for Range request
            return new Response(cached.buffer.subarray(start, end + 1), {
              status: 206,
              headers: {
                'content-type': cached.mimeType,
                'content-length': String(chunkSize),
                'content-range': `bytes ${start}-${end}/${cached.size}`,
                'accept-ranges': 'bytes',
                'cache-control': 'private, max-age=3600',
                'x-image-width': String(cached.metadata.width),
                'x-image-height': String(cached.metadata.height),
                'x-image-format': cached.metadata.format,
              },
            });
          }
        }

        // Return the full media (for images or non-range video requests)
        return new Response(cached.buffer, {
          status: 200,
          headers: {
            'content-type': cached.mimeType,
            'content-length': String(cached.size),
            'accept-ranges': 'bytes',
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
    const { buffer, mimeType, metadata } = await fetchAndProcessMedia(url);

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
 * Get metadata for a local file.
 * Includes file system information (name, dates) in addition to image metadata.
 */
export async function getLocalFileMetadata(
  filePath: string
): Promise<ImageMetadata | null> {
  try {
    // Security: Validate file path to prevent path traversal attacks
    const normalizedPath = normalize(filePath);
    if (!isAbsolute(normalizedPath) || normalizedPath.includes('..')) {
      console.error('[ImageProxy] Invalid file path:', filePath);
      return null;
    }

    // Get file stats
    const fileStat = await stat(normalizedPath);
    const buffer = await readFile(normalizedPath);
    const metadata = await extractMetadata(buffer);

    // Add file info
    return {
      ...metadata,
      fileName: basename(normalizedPath),
      filePath: normalizedPath,
      createdAt: fileStat.birthtime.toISOString(),
      modifiedAt: fileStat.mtime.toISOString(),
    };
  } catch (error) {
    console.error('[ImageProxy] Error getting local file metadata:', error);
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
  isVideo?: boolean;
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
 * Check if a URL points to media (image or video) using HEAD request.
 * This is a lightweight preflight check that doesn't download the full media.
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
    Accept:
      'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8',
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
        isVideo: false,
        error: `HTTP ${response.status}`,
      };
      headCheckCache.set(url, { result, timestamp: Date.now() });
      return result;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const contentLength = response.headers.get('content-length');

    // Check if content type indicates an image or video
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');

    const result: ImageCheckResult = {
      isImage,
      isVideo,
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
      const isVideo = contentType.startsWith('video/');

      const result: ImageCheckResult = {
        isImage,
        isVideo,
        mimeType: contentType.split(';')[0].trim(),
      };

      headCheckCache.set(url, { result, timestamp: Date.now() });
      return result;
    } catch {
      const result: ImageCheckResult = {
        isImage: false,
        isVideo: false,
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

// ============================================================================
// Local File Existence Check
// ============================================================================

/** Result of file existence check */
export interface FileCheckResult {
  exists: boolean;
  error?: string;
}

/** Cache for file existence results */
const fileCheckCache = new Map<
  string,
  { result: FileCheckResult; timestamp: number }
>();

/** File check cache TTL (30 seconds - shorter since files can change) */
const FILE_CHECK_CACHE_TTL = 30 * 1000;

/**
 * Check if a local file exists.
 * Results are cached for 30 seconds.
 */
export async function checkFileExists(
  filePath: string
): Promise<FileCheckResult> {
  // Check cache first
  const cached = fileCheckCache.get(filePath);
  if (cached && Date.now() - cached.timestamp < FILE_CHECK_CACHE_TTL) {
    return cached.result;
  }

  try {
    await access(filePath);
    const result: FileCheckResult = { exists: true };
    fileCheckCache.set(filePath, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    const result: FileCheckResult = {
      exists: false,
      error: error instanceof Error ? error.message : 'File not found',
    };
    fileCheckCache.set(filePath, { result, timestamp: Date.now() });
    return result;
  }
}

/**
 * Clear the file check cache
 */
export function clearFileCheckCache(): void {
  fileCheckCache.clear();
}

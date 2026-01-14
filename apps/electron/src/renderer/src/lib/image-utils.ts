import type { ColumnSchema } from '@/types/database';

// ============================================================================
// Timeout Utility
// ============================================================================

/**
 * Wraps a promise with a timeout that properly cleans up the timer.
 * Unlike Promise.race with setTimeout, this ensures the timer is always cleared.
 *
 * @param promise - The promise to wrap with a timeout
 * @param ms - Timeout in milliseconds
 * @param fallbackValue - Optional value to return on timeout instead of throwing
 * @returns The promise result or fallback value on timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallbackValue?: T
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// Image Magic Bytes Detection
// ============================================================================

/** Known image format magic bytes */
const IMAGE_SIGNATURES: { type: string; mimeType: string; magic: number[] }[] =
  [
    { type: 'png', mimeType: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
    { type: 'jpg', mimeType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
    { type: 'gif', mimeType: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
    {
      type: 'webp',
      mimeType: 'image/webp',
      magic: [0x52, 0x49, 0x46, 0x46], // RIFF, need to check WEBP at offset 8
    },
    { type: 'bmp', mimeType: 'image/bmp', magic: [0x42, 0x4d] },
    { type: 'ico', mimeType: 'image/x-icon', magic: [0x00, 0x00, 0x01, 0x00] },
    {
      type: 'tiff',
      mimeType: 'image/tiff',
      magic: [0x49, 0x49, 0x2a, 0x00], // Little endian
    },
    {
      type: 'tiff',
      mimeType: 'image/tiff',
      magic: [0x4d, 0x4d, 0x00, 0x2a], // Big endian
    },
  ];

/** Common image file extensions */
const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.tiff',
  '.tif',
  '.avif',
  '.heic',
  '.heif',
];

/** Common video file extensions */
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.mkv',
  '.m4v',
  '.ogv',
  '.3gp',
];

/** All media extensions (image + video) */
const MEDIA_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

/** Common image hosting domains - only domains that serve direct images */
const IMAGE_HOST_PATTERNS = [
  /\.(imgur|imgbb|cloudinary|imagekit|staticflickr)\.com/i,
  /\.(githubusercontent|raw\.github)\.com/i,
  /\.sinaimg\.cn/i,
  /\.qpic\.cn/i,
  /\.alicdn\.com/i,
  /\.aliyuncs\.com\/.*\.(jpg|jpeg|png|gif|webp)/i,
  /sm\.ms/i,
  /i\.postimg\.cc/i,
  /images\.unsplash\.com/i, // Only images.unsplash.com, not unsplash.com/photos (web pages)
  /picsum\.photos/i, // Lorem Picsum image service
];

// ============================================================================
// BLOB Detection Functions
// ============================================================================

/**
 * Check if data matches a magic byte signature
 */
function matchesMagicBytes(data: Uint8Array, magic: number[]): boolean {
  if (data.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (data[i] !== magic[i]) return false;
  }
  return true;
}

/**
 * Special check for WebP format (RIFF + WEBP at offset 8)
 */
function isWebP(data: Uint8Array): boolean {
  if (data.length < 12) return false;
  // Check RIFF header
  if (!matchesMagicBytes(data, [0x52, 0x49, 0x46, 0x46])) return false;
  // Check WEBP at offset 8
  return (
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  );
}

/**
 * Special check for AVI format (RIFF + AVI at offset 8)
 */
function isAVI(data: Uint8Array): boolean {
  if (data.length < 12) return false;
  // Check RIFF header
  if (!matchesMagicBytes(data, [0x52, 0x49, 0x46, 0x46])) return false;
  // Check AVI at offset 8
  return (
    data[8] === 0x41 && // A
    data[9] === 0x56 && // V
    data[10] === 0x49 && // I
    data[11] === 0x20 // space
  );
}

/**
 * Special check for MP4/MOV format (ftyp box)
 */
function isMP4OrMOV(data: Uint8Array): boolean {
  if (data.length < 12) return false;
  // Check for 'ftyp' at offset 4
  return (
    data[4] === 0x66 && // f
    data[5] === 0x74 && // t
    data[6] === 0x79 && // y
    data[7] === 0x70 // p
  );
}

/**
 * Detect if BLOB data is an image by checking magic bytes
 */
export function isImageBlob(data: Uint8Array): boolean {
  if (!data || data.length < 2) return false;

  // Check WebP specially
  if (isWebP(data)) return true;

  // Check other formats
  return IMAGE_SIGNATURES.some((sig) => matchesMagicBytes(data, sig.magic));
}

/**
 * Detect if BLOB data is a video by checking magic bytes
 */
export function isVideoBlob(data: Uint8Array): boolean {
  if (!data || data.length < 4) return false;

  // Check MP4/MOV specially
  if (isMP4OrMOV(data)) return true;

  // Check AVI specially
  if (isAVI(data)) return true;

  // Check WebM/MKV (same signature)
  if (matchesMagicBytes(data, [0x1a, 0x45, 0xdf, 0xa3])) return true;

  return false;
}

/**
 * Detect if BLOB data is any media (image or video)
 */
export function isMediaBlob(data: Uint8Array): boolean {
  return isImageBlob(data) || isVideoBlob(data);
}

/**
 * Get image type and MIME type from BLOB data
 */
export function getImageType(
  data: Uint8Array
): { type: string; mimeType: string } | null {
  if (!data || data.length < 2) return null;

  // Check WebP specially
  if (isWebP(data)) {
    return { type: 'webp', mimeType: 'image/webp' };
  }

  // Check other formats (skip WebP in loop since we handled it)
  for (const sig of IMAGE_SIGNATURES) {
    if (sig.type === 'webp') continue;
    if (matchesMagicBytes(data, sig.magic)) {
      return { type: sig.type, mimeType: sig.mimeType };
    }
  }

  return null;
}

/**
 * Get video type and MIME type from BLOB data
 */
export function getVideoType(
  data: Uint8Array
): { type: string; mimeType: string } | null {
  if (!data || data.length < 4) return null;

  // Check MP4/MOV specially
  if (isMP4OrMOV(data)) {
    // Could be MP4, M4V, or MOV - default to MP4
    return { type: 'mp4', mimeType: 'video/mp4' };
  }

  // Check AVI specially
  if (isAVI(data)) {
    return { type: 'avi', mimeType: 'video/x-msvideo' };
  }

  // Check WebM/MKV (same signature, default to WebM as more common on web)
  if (matchesMagicBytes(data, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { type: 'webm', mimeType: 'video/webm' };
  }

  return null;
}

/**
 * Get media type (image or video) from BLOB data
 */
export function getMediaType(
  data: Uint8Array
): { type: string; mimeType: string; isVideo: boolean } | null {
  const imageType = getImageType(data);
  if (imageType) {
    return { ...imageType, isVideo: false };
  }

  const videoType = getVideoType(data);
  if (videoType) {
    return { ...videoType, isVideo: true };
  }

  return null;
}

/**
 * Convert BLOB data to a Data URL for display
 */
export function blobToDataUrl(data: Uint8Array, mimeType: string): string {
  const binary = Array.from(data)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// Local File Path Detection
// ============================================================================

/**
 * Check if a string looks like a local file path with image extension
 */
export function isLocalImagePath(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();

  // Check for common path patterns (Unix and Windows)
  const isUnixPath = trimmed.startsWith('/');
  const isWindowsPath = /^[a-z]:[/\\]/i.test(trimmed);
  const isRelativePath = trimmed.startsWith('./') || trimmed.startsWith('../');

  if (!isUnixPath && !isWindowsPath && !isRelativePath) return false;

  // Check for image extension
  const lowerPath = trimmed.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Check if a string looks like a local file path with video extension
 */
export function isLocalVideoPath(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();

  // Check for common path patterns (Unix and Windows)
  const isUnixPath = trimmed.startsWith('/');
  const isWindowsPath = /^[a-z]:[/\\]/i.test(trimmed);
  const isRelativePath = trimmed.startsWith('./') || trimmed.startsWith('../');

  if (!isUnixPath && !isWindowsPath && !isRelativePath) return false;

  // Check for video extension
  const lowerPath = trimmed.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Check if a string looks like a local file path with any media extension
 */
export function isLocalMediaPath(value: string): boolean {
  return isLocalImagePath(value) || isLocalVideoPath(value);
}

// ============================================================================
// URL Detection Functions
// ============================================================================

/**
 * Check if a string is a valid HTTP/HTTPS URL
 */
function isHttpUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * Check if a URL points to an image based on extension or known hosts
 */
export function isImageUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;

  const trimmed = value.trim().toLowerCase();

  // Check file extension
  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.toLowerCase();

    // Check for image extensions
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true;
    }

    // Check for known image hosting patterns
    if (IMAGE_HOST_PATTERNS.some((pattern) => pattern.test(value))) {
      return true;
    }

    // Check query params for image indicators
    const params = url.searchParams;
    if (
      params.get('format')?.match(/^(jpg|jpeg|png|gif|webp|svg)$/i) ||
      params.get('type')?.match(/^image/i)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Check if a URL points to an image using HEAD request preflight.
 * This is more accurate than pattern matching as it checks the actual Content-Type.
 * Falls back to pattern matching if HEAD check fails or is unavailable.
 */
export async function isImageUrlAsync(value: string): Promise<boolean> {
  if (!isHttpUrl(value)) return false;

  // First try quick pattern matching
  if (isImageUrl(value)) {
    return true;
  }

  // For URLs without clear image indicators, use HEAD request check
  try {
    const result = await window.sqlPro.image.checkUrl({ url: value.trim() });
    if (result.success) {
      return result.isImage;
    }
  } catch {
    // Fall back to pattern matching result
  }

  return false;
}

/**
 * Check if a string is a base64 data URL for an image
 */
export function isBase64Image(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^data:image\/[a-z+]+;base64,/i.test(value.trim());
}

/**
 * Check if a string is a base64 data URL for a video
 */
export function isBase64Video(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^data:video\/[a-z0-9+]+;base64,/i.test(value.trim());
}

/**
 * Check if a string is a base64 data URL for any media
 */
export function isBase64Media(value: string): boolean {
  return isBase64Image(value) || isBase64Video(value);
}

/**
 * Check if a URL points to a video based on extension
 */
export function isVideoUrl(value: string): boolean {
  if (!isHttpUrl(value)) return false;

  try {
    const url = new URL(value.trim());
    const pathname = url.pathname.toLowerCase();

    // Check for video extensions
    if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true;
    }

    // Check query params for video indicators
    const params = url.searchParams;
    if (
      params.get('format')?.match(/^(mp4|webm|mov|avi|mkv)$/i) ||
      params.get('type')?.match(/^video/i)
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Check if a URL points to any media (image or video)
 */
export function isMediaUrl(value: string): boolean {
  return isImageUrl(value) || isVideoUrl(value);
}

// ============================================================================
// Unified Detection
// ============================================================================

/** Represents the source type of media (image or video) */
export type MediaSource =
  | { type: 'blob'; data: Uint8Array; mimeType: string; isVideo: boolean }
  | { type: 'url'; url: string; isVideo: boolean }
  | { type: 'base64'; dataUrl: string; isVideo: boolean }
  | { type: 'file'; path: string; isVideo: boolean }
  | null;

/** Represents the source type of an image (legacy, alias for MediaSource) */
export type ImageSource =
  | { type: 'blob'; data: Uint8Array; mimeType: string }
  | { type: 'url'; url: string }
  | { type: 'base64'; dataUrl: string }
  | { type: 'file'; path: string }
  | null;

/**
 * Detect media source (image or video) from a cell value.
 * Returns null if the value is not a recognized media format.
 * Note: This is sync and uses pattern matching only for URLs.
 */
export function detectMediaSource(
  value: unknown,
  columnType: string
): MediaSource {
  // Check for BLOB data
  if (value instanceof Uint8Array) {
    const mediaType = getMediaType(value);
    if (mediaType) {
      return {
        type: 'blob',
        data: value,
        mimeType: mediaType.mimeType,
        isVideo: mediaType.isVideo,
      };
    }
    return null;
  }

  // Check for ArrayBuffer (also BLOB)
  if (value instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(value);
    const mediaType = getMediaType(uint8);
    if (mediaType) {
      return {
        type: 'blob',
        data: uint8,
        mimeType: mediaType.mimeType,
        isVideo: mediaType.isVideo,
      };
    }
    return null;
  }

  // Check for string values
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Check for base64 data URL
    if (isBase64Image(trimmed)) {
      return { type: 'base64', dataUrl: trimmed, isVideo: false };
    }
    if (isBase64Video(trimmed)) {
      return { type: 'base64', dataUrl: trimmed, isVideo: true };
    }

    // Check for HTTP URL with media extension
    if (isImageUrl(trimmed)) {
      return { type: 'url', url: trimmed, isVideo: false };
    }
    if (isVideoUrl(trimmed)) {
      return { type: 'url', url: trimmed, isVideo: true };
    }

    // Check for local file path with media extension
    if (isLocalImagePath(trimmed)) {
      return { type: 'file', path: trimmed, isVideo: false };
    }
    if (isLocalVideoPath(trimmed)) {
      return { type: 'file', path: trimmed, isVideo: true };
    }
  }

  // Column type hint for BLOB
  if (columnType.toLowerCase().includes('blob') && value) {
    // Try to interpret as binary if we have any data
    return null;
  }

  return null;
}

/**
 * Detect image source from a cell value.
 * Returns null if the value is not a recognized image format.
 * Note: This is sync and uses pattern matching only for URLs.
 */
export function detectImageSource(
  value: unknown,
  columnType: string
): ImageSource {
  // Check for BLOB data
  if (value instanceof Uint8Array) {
    const imageType = getImageType(value);
    if (imageType) {
      return { type: 'blob', data: value, mimeType: imageType.mimeType };
    }
    return null;
  }

  // Check for ArrayBuffer (also BLOB)
  if (value instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(value);
    const imageType = getImageType(uint8);
    if (imageType) {
      return { type: 'blob', data: uint8, mimeType: imageType.mimeType };
    }
    return null;
  }

  // Check for string values
  if (typeof value === 'string') {
    // Check for base64 data URL
    if (isBase64Image(value)) {
      return { type: 'base64', dataUrl: value };
    }

    // Check for HTTP URL with image extension
    if (isImageUrl(value)) {
      return { type: 'url', url: value };
    }

    // Check for local file path with image extension
    if (isLocalImagePath(value)) {
      return { type: 'file', path: value.trim() };
    }
  }

  // Column type hint for BLOB
  if (columnType.toLowerCase().includes('blob') && value) {
    // Try to interpret as binary if we have any data
    return null;
  }

  return null;
}

/**
 * Detect image source from a cell value with async URL validation.
 * For URLs, uses HEAD request to check Content-Type.
 * For local files, checks if the file exists.
 * This filters out non-image URLs and non-existent files without downloading.
 */
export async function detectImageSourceAsync(
  value: unknown,
  columnType: string
): Promise<ImageSource> {
  // Handle non-string values with sync detection
  if (typeof value !== 'string') {
    return detectImageSource(value, columnType);
  }

  const trimmed = value.trim();

  // Check for local file paths first
  if (isLocalImagePath(trimmed)) {
    // Verify file exists before including
    try {
      const result = await withTimeout(
        window.sqlPro.image.checkFile({ path: trimmed }),
        2000
      );
      if (result && result.success && result.exists) {
        return { type: 'file', path: trimmed };
      }
    } catch {
      // File doesn't exist or check failed
    }
    return null;
  }

  // Check for base64 data URLs (no async check needed)
  if (isBase64Image(trimmed)) {
    return { type: 'base64', dataUrl: trimmed };
  }

  // Check for HTTP URLs
  if (isHttpUrl(trimmed)) {
    // For URLs with clear image extension, trust pattern matching
    if (isImageUrl(trimmed)) {
      return { type: 'url', url: trimmed };
    }

    // For other URLs, use HEAD check with timeout
    try {
      const result = (await withTimeout(
        window.sqlPro.image.checkUrl({ url: trimmed }),
        5000
      )) as { success?: boolean; isImage?: boolean } | null;
      if (result && result.success && result.isImage) {
        return { type: 'url', url: trimmed };
      }
    } catch {
      // If check fails or times out, don't include this URL
    }
    return null;
  }

  // Fall back to sync detection for other cases
  return detectImageSource(value, columnType);
}

/**
 * Detect media source (image or video) from a cell value with async validation.
 * For URLs, uses HEAD request to check Content-Type.
 * For URLs without clear extension, uses ffprobe for video detection.
 * For local files, checks if the file exists.
 * This filters out non-media URLs and non-existent files without downloading.
 */
export async function detectMediaSourceAsync(
  value: unknown,
  columnType: string
): Promise<MediaSource> {
  // Handle non-string values with sync detection
  if (typeof value !== 'string') {
    return detectMediaSource(value, columnType);
  }

  const trimmed = value.trim();

  // Check for local file paths first (both image and video)
  if (isLocalMediaPath(trimmed)) {
    // Verify file exists before including
    try {
      const result = await withTimeout(
        window.sqlPro.image.checkFile({ path: trimmed }),
        2000
      );
      if (result && result.success && result.exists) {
        const isVideo = isLocalVideoPath(trimmed);
        return { type: 'file', path: trimmed, isVideo };
      }
    } catch {
      // File doesn't exist or check failed
    }
    return null;
  }

  // Check for base64 data URLs (no async check needed)
  if (isBase64Image(trimmed)) {
    return { type: 'base64', dataUrl: trimmed, isVideo: false };
  }
  if (isBase64Video(trimmed)) {
    return { type: 'base64', dataUrl: trimmed, isVideo: true };
  }

  // Check for HTTP URLs
  if (isHttpUrl(trimmed)) {
    // For URLs with clear media extension, trust pattern matching
    if (isImageUrl(trimmed)) {
      return { type: 'url', url: trimmed, isVideo: false };
    }
    if (isVideoUrl(trimmed)) {
      return { type: 'url', url: trimmed, isVideo: true };
    }

    // For other URLs, use HEAD check with timeout
    try {
      const result = (await withTimeout(
        window.sqlPro.image.checkUrl({ url: trimmed }),
        5000
      )) as {
        success?: boolean;
        isImage?: boolean;
        isVideo?: boolean;
        mimeType?: string;
      } | null;
      if (result && result.success) {
        if (result.isImage) {
          return { type: 'url', url: trimmed, isVideo: false };
        }
        // Check if it's a video
        if (result.isVideo) {
          return { type: 'url', url: trimmed, isVideo: true };
        }
      }

      // If HEAD check didn't identify as media, try ffprobe for video detection
      // This catches videos that don't have proper Content-Type headers
      try {
        const videoResult = (await withTimeout(
          window.sqlPro.video.checkUrl({ url: trimmed }),
          8000
        )) as {
          success?: boolean;
          isVideo?: boolean;
          mimeType?: string;
        } | null;
        if (videoResult && videoResult.success && videoResult.isVideo) {
          return { type: 'url', url: trimmed, isVideo: true };
        }
      } catch {
        // ffprobe check failed, continue
      }
    } catch {
      // If check fails or times out, don't include this URL
    }
    return null;
  }

  // Fall back to sync detection for other cases
  return detectMediaSource(value, columnType);
}

/** Result of column image detection */
export interface ImageColumnInfo {
  column: string;
  type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
}

/** Result of column media detection (image or video) */
export interface MediaColumnInfo {
  column: string;
  type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
  hasVideo: boolean;
}

/**
 * Detect columns that may contain image data by sampling rows
 */
export function detectImageColumns(
  columns: ColumnSchema[],
  sampleRows: Record<string, unknown>[],
  sampleSize = 10
): ImageColumnInfo[] {
  const results: ImageColumnInfo[] = [];

  for (const column of columns) {
    const columnName = column.name;
    const columnType = column.type;
    const seenTypes = new Set<'blob' | 'url' | 'base64' | 'file'>();
    let imageCount = 0;

    // Sample rows to detect image data
    const rowsToCheck = sampleRows.slice(0, sampleSize);
    for (const row of rowsToCheck) {
      const value = row[columnName];
      if (value === null || value === undefined) continue;

      const source = detectImageSource(value, columnType);
      if (source) {
        imageCount++;
        seenTypes.add(source.type);
      }
    }

    // If we found images in at least 1 row, consider it an image column
    if (imageCount > 0) {
      let type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
      if (seenTypes.size > 1) {
        type = 'mixed';
      } else {
        type = [...seenTypes][0];
      }
      results.push({ column: columnName, type });
    }
  }

  return results;
}

/**
 * Detect columns that may contain media data (image or video) by sampling rows.
 * Sync version using pattern matching only.
 */
export function detectMediaColumns(
  columns: ColumnSchema[],
  sampleRows: Record<string, unknown>[],
  sampleSize = 10
): MediaColumnInfo[] {
  const results: MediaColumnInfo[] = [];

  for (const column of columns) {
    const columnName = column.name;
    const columnType = column.type;
    const seenTypes = new Set<'blob' | 'url' | 'base64' | 'file'>();
    let mediaCount = 0;
    let hasVideo = false;

    // Sample rows to detect media data
    const rowsToCheck = sampleRows.slice(0, sampleSize);
    for (const row of rowsToCheck) {
      const value = row[columnName];
      if (value === null || value === undefined) continue;

      const source = detectMediaSource(value, columnType);
      if (source) {
        mediaCount++;
        seenTypes.add(source.type);
        if (source.isVideo) {
          hasVideo = true;
        }
      }
    }

    // If we found media in at least 1 row, consider it a media column
    if (mediaCount > 0) {
      let type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
      if (seenTypes.size > 1) {
        type = 'mixed';
      } else {
        type = [...seenTypes][0];
      }
      results.push({ column: columnName, type, hasVideo });
    }
  }

  return results;
}

/**
 * Detect columns that may contain image data by sampling rows.
 * Uses HEAD request preflight for URLs to verify Content-Type.
 * Uses file existence check for local paths.
 * Has timeouts to prevent hanging.
 */
export async function detectImageColumnsAsync(
  columns: ColumnSchema[],
  sampleRows: Record<string, unknown>[],
  sampleSize = 10
): Promise<ImageColumnInfo[]> {
  const results: ImageColumnInfo[] = [];

  const detection = async () => {
    for (const column of columns) {
      const columnName = column.name;
      const columnType = column.type;
      const seenTypes = new Set<'blob' | 'url' | 'base64' | 'file'>();
      let imageCount = 0;

      // Sample rows to detect image data
      const rowsToCheck = sampleRows.slice(0, sampleSize);

      // Process all values in parallel for efficiency
      const checkPromises = rowsToCheck.map(async (row) => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;

        // Handle string values
        if (typeof value === 'string') {
          const trimmed = value.trim();

          // Check for local file paths
          if (isLocalImagePath(trimmed)) {
            try {
              const result = await withTimeout(
                window.sqlPro.image.checkFile({ path: trimmed }),
                2000
              );
              if (result && result.success && result.exists) {
                return { type: 'file' as const };
              }
            } catch {
              // Ignore errors
            }
            return null;
          }

          // Check for HTTP URLs
          if (isHttpUrl(trimmed)) {
            // Quick pattern match first
            if (isImageUrl(trimmed)) {
              return { type: 'url' as const };
            }
            // HEAD check for URLs without clear image extension (with timeout)
            try {
              const result = (await withTimeout(
                window.sqlPro.image.checkUrl({ url: trimmed }),
                3000
              )) as { success?: boolean; isImage?: boolean } | null;
              if (result && result.success && result.isImage) {
                return { type: 'url' as const };
              }
            } catch {
              // Ignore errors and timeouts
            }
            return null;
          }
        }

        // For non-string values (BLOB, ArrayBuffer), use sync detection
        const source = detectImageSource(value, columnType);
        if (source) {
          return { type: source.type };
        }
        return null;
      });

      const checkResults = await Promise.all(checkPromises);

      for (const result of checkResults) {
        if (result) {
          imageCount++;
          seenTypes.add(result.type);
        }
      }

      // If we found images in at least 1 row, consider it an image column
      if (imageCount > 0) {
        let type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
        if (seenTypes.size > 1) {
          type = 'mixed';
        } else {
          type = [...seenTypes][0];
        }
        results.push({ column: columnName, type });
      }
    }

    return results;
  };

  // Overall timeout for the entire detection
  return withTimeout(detection(), 10000, results);
}

/**
 * Detect columns that may contain media data (image or video) by sampling rows.
 * Uses HEAD request preflight for URLs to verify Content-Type.
 * Uses ffprobe for URLs without clear extension to detect videos.
 * Uses file existence check for local paths.
 * Has timeouts to prevent hanging.
 */
export async function detectMediaColumnsAsync(
  columns: ColumnSchema[],
  sampleRows: Record<string, unknown>[],
  sampleSize = 10
): Promise<MediaColumnInfo[]> {
  const results: MediaColumnInfo[] = [];

  const detection = async () => {
    for (const column of columns) {
      const columnName = column.name;
      const columnType = column.type;
      const seenTypes = new Set<'blob' | 'url' | 'base64' | 'file'>();
      let mediaCount = 0;
      let hasVideo = false;

      // Sample rows to detect media data
      const rowsToCheck = sampleRows.slice(0, sampleSize);

      // Process all values in parallel for efficiency
      const checkPromises = rowsToCheck.map(async (row) => {
        const value = row[columnName];
        if (value === null || value === undefined) return null;

        // Handle string values
        if (typeof value === 'string') {
          const trimmed = value.trim();

          // Check for local file paths (both image and video)
          if (isLocalMediaPath(trimmed)) {
            try {
              const result = await withTimeout(
                window.sqlPro.image.checkFile({ path: trimmed }),
                2000
              );
              if (result && result.success && result.exists) {
                const isVideo = isLocalVideoPath(trimmed);
                return { type: 'file' as const, isVideo };
              }
            } catch {
              // Ignore errors
            }
            return null;
          }

          // Check for HTTP URLs
          if (isHttpUrl(trimmed)) {
            // Quick pattern match first
            if (isImageUrl(trimmed)) {
              return { type: 'url' as const, isVideo: false };
            }
            if (isVideoUrl(trimmed)) {
              return { type: 'url' as const, isVideo: true };
            }
            // HEAD check for URLs without clear extension (with timeout)
            try {
              const result = (await withTimeout(
                window.sqlPro.image.checkUrl({ url: trimmed }),
                3000
              )) as {
                success?: boolean;
                isImage?: boolean;
                isVideo?: boolean;
                mimeType?: string;
              } | null;
              if (result && result.success) {
                if (result.isImage) {
                  return { type: 'url' as const, isVideo: false };
                }
                if (result.isVideo) {
                  return { type: 'url' as const, isVideo: true };
                }
              }

              // If HEAD check didn't identify as media, try ffprobe for video detection
              try {
                const videoResult = (await withTimeout(
                  window.sqlPro.video.checkUrl({ url: trimmed }),
                  5000
                )) as {
                  success?: boolean;
                  isVideo?: boolean;
                } | null;
                if (videoResult && videoResult.success && videoResult.isVideo) {
                  return { type: 'url' as const, isVideo: true };
                }
              } catch {
                // ffprobe check failed
              }
            } catch {
              // Ignore errors and timeouts
            }
            return null;
          }
        }

        // For non-string values (BLOB, ArrayBuffer), use sync detection
        const source = detectMediaSource(value, columnType);
        if (source) {
          return { type: source.type, isVideo: source.isVideo };
        }
        return null;
      });

      const checkResults = await Promise.all(checkPromises);

      for (const result of checkResults) {
        if (result) {
          mediaCount++;
          seenTypes.add(result.type);
          if (result.isVideo) {
            hasVideo = true;
          }
        }
      }

      // If we found media in at least 1 row, consider it a media column
      if (mediaCount > 0) {
        let type: 'blob' | 'url' | 'base64' | 'file' | 'mixed';
        if (seenTypes.size > 1) {
          type = 'mixed';
        } else {
          type = [...seenTypes][0];
        }
        results.push({ column: columnName, type, hasVideo });
      }
    }

    return results;
  };

  // Overall timeout for the entire detection
  return withTimeout(detection(), 15000, results);
}

// ============================================================================
// Image Processing Utilities
// ============================================================================

/**
 * Convert an HTTP(S) image URL to a sqlpro:// proxy URL.
 * This enables CORS-free loading and caching in the main process.
 */
export function getProxyImageUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url; // Not a remote URL
  }
  return `sqlpro://image/${encodeURIComponent(url)}`;
}

/**
 * Decode a sqlpro:// proxy URL back to the original HTTP(S) URL.
 */
export function decodeProxyImageUrl(proxyUrl: string): string | null {
  if (!proxyUrl.startsWith('sqlpro://image/')) {
    return null;
  }
  const encoded = proxyUrl.slice('sqlpro://image/'.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * Get the display URL for an image source.
 * For remote URLs, returns a sqlpro:// proxy URL to bypass CORS.
 * For local files, returns a sqlpro://file/ URL to load via main process.
 */
export function getImageDisplayUrl(source: ImageSource): string | null {
  if (!source) return null;

  switch (source.type) {
    case 'url':
      // Use proxy URL for remote images to bypass CORS
      return getProxyImageUrl(source.url);
    case 'base64':
      return source.dataUrl;
    case 'blob':
      return blobToDataUrl(source.data, source.mimeType);
    case 'file':
      // Use custom protocol for local files
      return `sqlpro://file/${encodeURIComponent(source.path)}`;
    default:
      return null;
  }
}

/**
 * Get the display URL for a media source (image or video).
 * For remote URLs, returns a sqlpro:// proxy URL to bypass CORS.
 * For local files, returns a sqlpro://file/ URL to load via main process.
 */
export function getMediaDisplayUrl(source: MediaSource): string | null {
  if (!source) return null;

  switch (source.type) {
    case 'url':
      // Use proxy URL for remote media to bypass CORS
      return getProxyImageUrl(source.url);
    case 'base64':
      return source.dataUrl;
    case 'blob':
      return blobToDataUrl(source.data, source.mimeType);
    case 'file':
      // Use custom protocol for local files
      return `sqlpro://file/${encodeURIComponent(source.path)}`;
    default:
      return null;
  }
}

/**
 * Get appropriate file extension for an image source
 */
export function getImageExtension(source: ImageSource): string {
  if (!source) return 'bin';

  switch (source.type) {
    case 'blob': {
      const mimeToExt: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/x-icon': 'ico',
        'image/tiff': 'tiff',
      };
      return mimeToExt[source.mimeType] ?? 'bin';
    }
    case 'base64': {
      const match = source.dataUrl.match(/^data:image\/([a-z+]+);/i);
      return match?.[1] ?? 'bin';
    }
    case 'url': {
      try {
        const url = new URL(source.url);
        const ext = url.pathname.split('.').pop()?.toLowerCase();
        if (ext && IMAGE_EXTENSIONS.includes(`.${ext}`)) {
          return ext;
        }
      } catch {
        // Invalid URL
      }
      return 'jpg'; // Default for URLs
    }
    case 'file': {
      const ext = source.path.split('.').pop()?.toLowerCase();
      if (ext && IMAGE_EXTENSIONS.includes(`.${ext}`)) {
        return ext;
      }
      return 'jpg'; // Default for files
    }
    default:
      return 'bin';
  }
}

/**
 * Get appropriate file extension for a media source (image or video)
 */
export function getMediaExtension(source: MediaSource): string {
  if (!source) return 'bin';

  switch (source.type) {
    case 'blob': {
      const mimeToExt: Record<string, string> = {
        // Image types
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/x-icon': 'ico',
        'image/tiff': 'tiff',
        // Video types
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'video/x-msvideo': 'avi',
        'video/x-matroska': 'mkv',
      };
      return mimeToExt[source.mimeType] ?? 'bin';
    }
    case 'base64': {
      const imageMatch = source.dataUrl.match(/^data:image\/([a-z+]+);/i);
      if (imageMatch) return imageMatch[1];
      const videoMatch = source.dataUrl.match(/^data:video\/([a-z0-9+]+);/i);
      if (videoMatch) return videoMatch[1];
      return 'bin';
    }
    case 'url': {
      try {
        const url = new URL(source.url);
        const ext = url.pathname.split('.').pop()?.toLowerCase();
        if (ext && MEDIA_EXTENSIONS.includes(`.${ext}`)) {
          return ext;
        }
      } catch {
        // Invalid URL
      }
      return source.isVideo ? 'mp4' : 'jpg'; // Default based on type
    }
    case 'file': {
      const ext = source.path.split('.').pop()?.toLowerCase();
      if (ext && MEDIA_EXTENSIONS.includes(`.${ext}`)) {
        return ext;
      }
      return source.isVideo ? 'mp4' : 'jpg'; // Default based on type
    }
    default:
      return 'bin';
  }
}

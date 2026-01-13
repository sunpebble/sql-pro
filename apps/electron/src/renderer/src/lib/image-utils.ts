import type { ColumnSchema } from '@/types/database';

// ============================================================================
// Image Magic Bytes Detection
// ============================================================================

/** Known image format magic bytes */
const IMAGE_SIGNATURES: { type: string; mimeType: string; magic: number[] }[] =
  [
    { type: 'png', mimeType: 'image/png', magic: [0x89, 0x50, 0x4E, 0x47] },
    { type: 'jpg', mimeType: 'image/jpeg', magic: [0xFF, 0xD8, 0xFF] },
    { type: 'gif', mimeType: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
    {
      type: 'webp',
      mimeType: 'image/webp',
      magic: [0x52, 0x49, 0x46, 0x46], // RIFF, need to check WEBP at offset 8
    },
    { type: 'bmp', mimeType: 'image/bmp', magic: [0x42, 0x4D] },
    { type: 'ico', mimeType: 'image/x-icon', magic: [0x00, 0x00, 0x01, 0x00] },
    {
      type: 'tiff',
      mimeType: 'image/tiff',
      magic: [0x49, 0x49, 0x2A, 0x00], // Little endian
    },
    {
      type: 'tiff',
      mimeType: 'image/tiff',
      magic: [0x4D, 0x4D, 0x00, 0x2A], // Big endian
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

/** Common image hosting domains */
const IMAGE_HOST_PATTERNS = [
  /\.(imgur|imgbb|cloudinary|imagekit|staticflickr)\.com/i,
  /\.(githubusercontent|raw\.github)\.com/i,
  /\.sinaimg\.cn/i,
  /\.qpic\.cn/i,
  /\.alicdn\.com/i,
  /\.aliyuncs\.com\/.*\.(jpg|jpeg|png|gif|webp)/i,
  /sm\.ms/i,
  /i\.postimg\.cc/i,
  /unsplash\.com\/photos/i,
  /images\.unsplash\.com/i,
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
 * Check if a string is a base64 data URL for an image
 */
export function isBase64Image(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^data:image\/[a-z+]+;base64,/i.test(value.trim());
}

// ============================================================================
// Unified Detection
// ============================================================================

/** Represents the source type of an image */
export type ImageSource =
  | { type: 'blob'; data: Uint8Array; mimeType: string }
  | { type: 'url'; url: string }
  | { type: 'base64'; dataUrl: string }
  | null;

/**
 * Detect the image source type from a cell value
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

    // Check for HTTP URL
    if (isImageUrl(value)) {
      return { type: 'url', url: value };
    }
  }

  // Column type hint for BLOB
  if (columnType.toLowerCase().includes('blob') && value) {
    // Try to interpret as binary if we have any data
    return null;
  }

  return null;
}

/** Result of column image detection */
export interface ImageColumnInfo {
  column: string;
  type: 'blob' | 'url' | 'base64' | 'mixed';
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
    const seenTypes = new Set<'blob' | 'url' | 'base64'>();
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
      let type: 'blob' | 'url' | 'base64' | 'mixed';
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

// ============================================================================
// Image Processing Utilities
// ============================================================================

/**
 * Get the display URL for an image source
 */
export function getImageDisplayUrl(source: ImageSource): string | null {
  if (!source) return null;

  switch (source.type) {
    case 'url':
      return source.url;
    case 'base64':
      return source.dataUrl;
    case 'blob':
      return blobToDataUrl(source.data, source.mimeType);
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
    default:
      return 'bin';
  }
}

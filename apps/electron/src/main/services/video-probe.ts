/**
 * Video Probe Service
 *
 * Uses ffprobe to extract video metadata and validate video files/URLs.
 * Similar to how sharp is used for images.
 */

import { Buffer } from 'node:buffer';
import { exec } from 'node:child_process';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

/** Video metadata extracted by ffprobe */
export interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // in seconds
  format: string;
  codec: string;
  bitrate?: number;
  fps?: number;
  size: number;
}

/** Result of video validation */
export interface VideoCheckResult {
  isVideo: boolean;
  mimeType?: string;
  metadata?: VideoMetadata;
  error?: string;
}

// ============================================================================
// FFprobe Path Resolution
// ============================================================================

let ffprobePath: string = 'ffprobe';

/**
 * Get the path to ffprobe binary
 */
function getFfprobePath(): string {
  try {
    // Try to use bundled ffprobe from @ffprobe-installer/ffprobe
    // eslint-disable-next-line ts/no-require-imports
    const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
    ffprobePath = ffprobeInstaller.path;
    return ffprobePath;
  } catch {
    // Fall back to system ffprobe
    return ffprobePath;
  }
}

// ============================================================================
// Video Metadata Extraction
// ============================================================================

/**
 * Extract video metadata using ffprobe
 */
export async function getVideoMetadata(
  input: string | Buffer
): Promise<VideoMetadata | null> {
  const ffprobe = getFfprobePath();
  let inputPath: string;
  let tempFile: string | null = null;

  try {
    // If input is a Buffer, write to temp file
    if (Buffer.isBuffer(input)) {
      tempFile = join(tmpdir(), `sqlpro-video-${Date.now()}.tmp`);
      await writeFile(tempFile, input);
      inputPath = tempFile;
    } else {
      inputPath = input;
    }

    // Run ffprobe to get video info
    const { stdout } = await execAsync(
      `"${ffprobe}" -v quiet -print_format json -show_format -show_streams "${inputPath}"`,
      { timeout: 30000 }
    );

    const data = JSON.parse(stdout);

    // Find video stream
    const videoStream = data.streams?.find(
      (s: { codec_type: string }) => s.codec_type === 'video'
    );

    if (!videoStream) {
      return null;
    }

    const format = data.format || {};

    // Parse frame rate (e.g., "30/1" or "29.97")
    let fps: number | undefined;
    if (videoStream.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = den ? num / den : num;
    }

    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
      duration: Number.parseFloat(format.duration) || 0,
      format: format.format_name?.split(',')[0] || 'unknown',
      codec: videoStream.codec_name || 'unknown',
      bitrate: format.bit_rate ? Number.parseInt(format.bit_rate, 10) : undefined,
      fps,
      size: format.size ? Number.parseInt(format.size, 10) : 0,
    };
  } catch (error) {
    console.error('[VideoProbe] Error extracting metadata:', error);
    return null;
  } finally {
    // Clean up temp file
    if (tempFile) {
      try {
        await unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if a URL points to a video by downloading a small portion and probing it
 */
export async function checkVideoUrl(url: string): Promise<VideoCheckResult> {
  const { session } = await import('electron');

  try {
    // First, do a HEAD request to check content-type
    const headResponse = await session.defaultSession.fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'video/*,*/*;q=0.8',
      },
    });

    const contentType = headResponse.headers.get('content-type') || '';

    // Quick check: if content-type is clearly video
    if (contentType.startsWith('video/')) {
      return {
        isVideo: true,
        mimeType: contentType.split(';')[0].trim(),
      };
    }

    // For URLs without clear video content-type, try to probe
    // Download first 1MB to check
    const response = await session.defaultSession.fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'video/*,*/*;q=0.8',
        Range: 'bytes=0-1048575', // First 1MB
      },
    });

    if (!response.ok && response.status !== 206) {
      return {
        isVideo: false,
        error: `HTTP ${response.status}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Check magic bytes for common video formats
    if (isVideoBuffer(buffer)) {
      // Try to get full metadata
      const metadata = await getVideoMetadata(url);
      return {
        isVideo: true,
        mimeType: detectVideoMimeType(buffer),
        metadata: metadata || undefined,
      };
    }

    return { isVideo: false };
  } catch (error) {
    return {
      isVideo: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a buffer contains video data by checking magic bytes
 */
export function isVideoBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // MP4/MOV (ftyp box at offset 4)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return true;
  }

  // WebM/MKV
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return true;
  }

  // AVI (RIFF + AVI)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x41 &&
    buffer[9] === 0x56 &&
    buffer[10] === 0x49 &&
    buffer[11] === 0x20
  ) {
    return true;
  }

  // FLV
  if (buffer[0] === 0x46 && buffer[1] === 0x4c && buffer[2] === 0x56) {
    return true;
  }

  return false;
}

/**
 * Detect video MIME type from buffer
 */
export function detectVideoMimeType(buffer: Buffer): string {
  if (buffer.length < 12) return 'video/mp4';

  // MP4/MOV
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    // Check brand for MOV vs MP4
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'qt  ') return 'video/quicktime';
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

  // AVI
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    return 'video/x-msvideo';
  }

  // FLV
  if (buffer[0] === 0x46 && buffer[1] === 0x4c && buffer[2] === 0x56) {
    return 'video/x-flv';
  }

  return 'video/mp4';
}

/**
 * Validate a video URL by probing it with ffprobe
 */
export async function validateVideoUrl(url: string): Promise<VideoCheckResult> {
  try {
    const metadata = await getVideoMetadata(url);

    if (metadata && metadata.width > 0 && metadata.height > 0) {
      return {
        isVideo: true,
        mimeType: `video/${metadata.format}`,
        metadata,
      };
    }

    return { isVideo: false, error: 'Not a valid video' };
  } catch (error) {
    return {
      isVideo: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Check if a local file is a video
 */
export async function checkVideoFile(path: string): Promise<VideoCheckResult> {
  try {
    const metadata = await getVideoMetadata(path);

    if (metadata && metadata.width > 0 && metadata.height > 0) {
      return {
        isVideo: true,
        mimeType: `video/${metadata.format}`,
        metadata,
      };
    }

    return { isVideo: false, error: 'Not a valid video file' };
  } catch (error) {
    return {
      isVideo: false,
      error: error instanceof Error ? error.message : 'Check failed',
    };
  }
}

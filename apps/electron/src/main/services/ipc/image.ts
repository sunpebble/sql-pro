/**
 * IPC Handlers for Image and Video Operations
 *
 * Provides IPC channels for:
 * - Getting image metadata using sharp
 * - Getting video metadata using ffprobe
 * - Getting cache statistics
 * - Clearing image cache
 * - HEAD request preflight check
 */

import { ipcMain } from 'electron';
import {
  checkFileExists,
  checkImageUrl,
  clearImageCache,
  getCacheStats,
  getImageMetadata,
  getLocalFileMetadata,
  validateImageUrl,
} from '../image-proxy';
import {
  checkVideoFile,
  checkVideoUrl,
  getVideoMetadata,
  validateVideoUrl,
} from '../video-probe';
import { createHandler } from './utils';

// ============================================================================
// IPC Channel Names
// ============================================================================

export const IMAGE_IPC_CHANNELS = {
  GET_METADATA: 'image:get-metadata',
  GET_FILE_METADATA: 'image:get-file-metadata',
  GET_CACHE_STATS: 'image:get-cache-stats',
  CLEAR_CACHE: 'image:clear-cache',
  CHECK_URL: 'image:check-url',
  VALIDATE_URL: 'image:validate-url',
  CHECK_FILE: 'image:check-file',
  // Video channels
  VIDEO_GET_METADATA: 'video:get-metadata',
  VIDEO_CHECK_URL: 'video:check-url',
  VIDEO_VALIDATE_URL: 'video:validate-url',
  VIDEO_CHECK_FILE: 'video:check-file',
} as const;

// ============================================================================
// Handler Setup
// ============================================================================

export function setupImageHandlers(): void {
  // Get image metadata
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.GET_METADATA,
    createHandler(async (request: { url: string }) => {
      const metadata = await getImageMetadata(request.url);

      if (!metadata) {
        throw new Error('Failed to extract metadata');
      }

      return { metadata };
    })
  );

  // Get local file metadata (includes file info like name, dates)
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.GET_FILE_METADATA,
    createHandler(async (request: { path: string }) => {
      const metadata = await getLocalFileMetadata(request.path);

      if (!metadata) {
        throw new Error('Failed to extract file metadata');
      }

      return { metadata };
    })
  );

  // Get cache statistics
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.GET_CACHE_STATS,
    createHandler(async () => {
      return { stats: getCacheStats() };
    })
  );

  // Clear image cache
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.CLEAR_CACHE,
    createHandler(async () => {
      clearImageCache();
      return {};
    })
  );

  // Check if URL is an image using HEAD request
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.CHECK_URL,
    createHandler(async (request: { url: string }) => {
      const result = await checkImageUrl(request.url);
      return result;
    })
  );

  // Full validation: HEAD + Sharp
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.VALIDATE_URL,
    createHandler(async (request: { url: string }) => {
      const result = await validateImageUrl(request.url);
      return result;
    })
  );

  // Check if local file exists
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.CHECK_FILE,
    createHandler(async (request: { path: string }) => {
      const result = await checkFileExists(request.path);
      return result;
    })
  );

  // ============================================================================
  // Video Handlers
  // ============================================================================

  // Get video metadata using ffprobe
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.VIDEO_GET_METADATA,
    createHandler(async (request: { url: string }) => {
      const metadata = await getVideoMetadata(request.url);

      if (!metadata) {
        throw new Error('Failed to extract video metadata');
      }

      return { metadata };
    })
  );

  // Check if URL is a video using HEAD request
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.VIDEO_CHECK_URL,
    createHandler(async (request: { url: string }) => {
      const result = await checkVideoUrl(request.url);
      return result;
    })
  );

  // Full video validation: HEAD + ffprobe
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.VIDEO_VALIDATE_URL,
    createHandler(async (request: { url: string }) => {
      const result = await validateVideoUrl(request.url);
      return result;
    })
  );

  // Check if local file is a video
  ipcMain.handle(
    IMAGE_IPC_CHANNELS.VIDEO_CHECK_FILE,
    createHandler(async (request: { path: string }) => {
      const result = await checkVideoFile(request.path);
      return result;
    })
  );
}

export function cleanupImageHandlers(): void {
  Object.values(IMAGE_IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
}

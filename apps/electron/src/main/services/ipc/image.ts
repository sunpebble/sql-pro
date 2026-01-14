/**
 * IPC Handlers for Image Operations
 *
 * Provides IPC channels for:
 * - Getting image metadata using sharp
 * - Getting cache statistics
 * - Clearing image cache
 * - HEAD request preflight check
 */

import { ipcMain } from 'electron';
import {
  checkImageUrl,
  clearImageCache,
  getCacheStats,
  getImageMetadata,
  validateImageUrl,
} from '../image-proxy';
import { createHandler } from './utils';

// ============================================================================
// IPC Channel Names
// ============================================================================

export const IMAGE_IPC_CHANNELS = {
  GET_METADATA: 'image:get-metadata',
  GET_CACHE_STATS: 'image:get-cache-stats',
  CLEAR_CACHE: 'image:clear-cache',
  CHECK_URL: 'image:check-url',
  VALIDATE_URL: 'image:validate-url',
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
}

export function cleanupImageHandlers(): void {
  Object.values(IMAGE_IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
}

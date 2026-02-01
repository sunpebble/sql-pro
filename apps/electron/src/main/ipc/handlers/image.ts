/**
 * Image/Video IPC Handler
 *
 * Handles IPC for image and video metadata extraction and caching.
 */

import type {HandlerContext} from '../base/handler';
import {
  checkFileExists,
  checkImageUrl,
  clearImageCache,
  getCacheStats,
  getImageMetadata,
  getLocalFileMetadata,
  validateImageUrl,
} from '../../services/image-proxy';
import {
  checkVideoFile,
  checkVideoUrl,
  getVideoMetadata,
  validateVideoUrl,
} from '../../services/video-probe';
import {  IpcHandler } from '../base/handler';

// IPC Channel Names
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

export class ImageHandler extends IpcHandler {
  constructor() {
    super({ name: 'image' });
  }

  register(): void {
    // Image handlers
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.GET_METADATA,
      this.getMetadata.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.GET_FILE_METADATA,
      this.getFileMetadata.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.GET_CACHE_STATS,
      this.getCacheStats.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.CLEAR_CACHE,
      this.clearCache.bind(this)
    );
    this.handleLegacy(IMAGE_IPC_CHANNELS.CHECK_URL, this.checkUrl.bind(this));
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.VALIDATE_URL,
      this.validateUrl.bind(this)
    );
    this.handleLegacy(IMAGE_IPC_CHANNELS.CHECK_FILE, this.checkFile.bind(this));

    // Video handlers
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.VIDEO_GET_METADATA,
      this.getVideoMetadata.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.VIDEO_CHECK_URL,
      this.checkVideoUrl.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.VIDEO_VALIDATE_URL,
      this.validateVideoUrl.bind(this)
    );
    this.handleLegacy(
      IMAGE_IPC_CHANNELS.VIDEO_CHECK_FILE,
      this.checkVideoFile.bind(this)
    );
  }

  // Image handlers
  private async getMetadata(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<{ metadata: unknown }> {
    const metadata = await getImageMetadata(request.url);
    if (!metadata) {
      throw new Error('Failed to extract metadata');
    }
    return { metadata };
  }

  private async getFileMetadata(
    request: { path: string },
    _ctx: HandlerContext
  ): Promise<{ metadata: unknown }> {
    const metadata = await getLocalFileMetadata(request.path);
    if (!metadata) {
      throw new Error('Failed to extract file metadata');
    }
    return { metadata };
  }

  private async getCacheStats(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ stats: unknown }> {
    return { stats: getCacheStats() };
  }

  private async clearCache(
    _request: void,
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    clearImageCache();
    return {};
  }

  private async checkUrl(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<{ isImage: boolean; contentType?: string; error?: string }> {
    return checkImageUrl(request.url);
  }

  private async validateUrl(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<unknown> {
    return validateImageUrl(request.url);
  }

  private async checkFile(
    request: { path: string },
    _ctx: HandlerContext
  ): Promise<{ exists: boolean; isFile?: boolean; error?: string }> {
    return checkFileExists(request.path);
  }

  // Video handlers
  private async getVideoMetadata(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<{ metadata: unknown }> {
    const metadata = await getVideoMetadata(request.url);
    if (!metadata) {
      throw new Error('Failed to extract video metadata');
    }
    return { metadata };
  }

  private async checkVideoUrl(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<{ isVideo: boolean; contentType?: string; error?: string }> {
    return checkVideoUrl(request.url);
  }

  private async validateVideoUrl(
    request: { url: string },
    _ctx: HandlerContext
  ): Promise<unknown> {
    return validateVideoUrl(request.url);
  }

  private async checkVideoFile(
    request: { path: string },
    _ctx: HandlerContext
  ): Promise<{ isVideo: boolean; metadata?: unknown; error?: string }> {
    return checkVideoFile(request.path);
  }
}

// Export singleton instance
export const imageHandler = new ImageHandler();

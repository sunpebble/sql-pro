/**
 * Renderer Store IPC Handler
 *
 * Handles IPC for renderer store persistence.
 */

import type {
  GetRendererStateRequest,
  RendererStoreSchema,
  SetRendererStateRequest,
  UpdateRendererStateRequest,
} from '@shared/types/renderer-store';
import type {HandlerContext} from '../base/handler';
import { RENDERER_STORE_CHANNELS } from '@shared/types/renderer-store';
import {
  getRendererState,
  resetRendererState,
  setRendererState,
  updateRendererState,
} from '../../services/renderer-store';
import {  IpcHandler } from '../base/handler';

export class RendererStoreHandler extends IpcHandler {
  constructor() {
    super({ name: 'renderer-store' });
  }

  register(): void {
    this.handleLegacy(RENDERER_STORE_CHANNELS.GET, this.get.bind(this));
    this.handleLegacy(RENDERER_STORE_CHANNELS.SET, this.set.bind(this));
    this.handleLegacy(RENDERER_STORE_CHANNELS.UPDATE, this.update.bind(this));
    this.handleLegacy(RENDERER_STORE_CHANNELS.RESET, this.reset.bind(this));
  }

  private async get(
    request: GetRendererStateRequest,
    _ctx: HandlerContext
  ): Promise<{ data: unknown }> {
    const data = getRendererState(request.key);
    return { data };
  }

  private async set(
    request: SetRendererStateRequest,
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    setRendererState(
      request.key,
      request.value as RendererStoreSchema[typeof request.key]
    );
    return {};
  }

  private async update(
    request: UpdateRendererStateRequest,
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    updateRendererState(
      request.key,
      request.updates as Partial<RendererStoreSchema[typeof request.key]>
    );
    return {};
  }

  private async reset(
    request: { key: keyof RendererStoreSchema },
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    resetRendererState(request.key);
    return {};
  }
}

// Export singleton instance
export const rendererStoreHandler = new RendererStoreHandler();

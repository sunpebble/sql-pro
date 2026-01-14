/**
 * IPC handlers for renderer store persistence
 */

import type {
  GetRendererStateRequest,
  RendererStoreSchema,
  SetRendererStateRequest,
  UpdateRendererStateRequest,
} from '@shared/types/renderer-store';
import { RENDERER_STORE_CHANNELS } from '@shared/types/renderer-store';
import { ipcMain } from 'electron';
import {
  getRendererState,
  resetRendererState,
  setRendererState,
  updateRendererState,
} from '../renderer-store';
import { createHandler } from './utils';

export function setupRendererStoreHandlers(): void {
  // Get state for a specific key
  ipcMain.handle(
    RENDERER_STORE_CHANNELS.GET,
    createHandler(async (request: GetRendererStateRequest) => {
      const data = getRendererState(request.key);
      return { data };
    })
  );

  // Set state for a specific key (full replace)
  ipcMain.handle(
    RENDERER_STORE_CHANNELS.SET,
    createHandler(async (request: SetRendererStateRequest) => {
      setRendererState(
        request.key,
        request.value as RendererStoreSchema[typeof request.key]
      );
      return {};
    })
  );

  // Update state for a specific key (partial merge)
  ipcMain.handle(
    RENDERER_STORE_CHANNELS.UPDATE,
    createHandler(async (request: UpdateRendererStateRequest) => {
      updateRendererState(
        request.key,
        request.updates as Partial<RendererStoreSchema[typeof request.key]>
      );
      return {};
    })
  );

  // Reset state for a specific key to defaults
  ipcMain.handle(
    RENDERER_STORE_CHANNELS.RESET,
    createHandler(async (request: { key: keyof RendererStoreSchema }) => {
      resetRendererState(request.key);
      return {};
    })
  );
}

export function cleanupRendererStoreHandlers(): void {
  Object.values(RENDERER_STORE_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
}

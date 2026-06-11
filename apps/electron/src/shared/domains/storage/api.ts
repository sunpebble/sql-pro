/**
 * Storage domain API factory
 *
 * Renderer-side API methods for memory monitoring, file watching,
 * and renderer store persistence.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  FileChangeEvent,
  GetMemoryStatsRequest,
  GetMemoryStatsResponse,
  GetRendererStateRequest,
  GetRendererStateResponse,
  MemoryPressureChangeEvent,
  MemoryStatsUpdateEvent,
  MemorySubscribeRequest,
  MemorySubscribeResponse,
  MemoryTriggerGCRequest,
  MemoryTriggerGCResponse,
  MemoryUnsubscribeRequest,
  MemoryUnsubscribeResponse,
  RendererStoreSchema,
  ResetRendererStateRequest,
  SetRendererStateRequest,
  SetRendererStateResponse,
  UpdateRendererStateRequest,
  UpdateRendererStateResponse,
} from './types';
import {
  fileWatcherChannels,
  memoryChannels,
  rendererStoreChannels,
} from './channels';

export interface StorageApi {
  memory: {
    getStats: (request?: GetMemoryStatsRequest) => Promise<GetMemoryStatsResponse>;
    subscribe: (
      request?: MemorySubscribeRequest
    ) => Promise<MemorySubscribeResponse>;
    unsubscribe: (
      request: MemoryUnsubscribeRequest
    ) => Promise<MemoryUnsubscribeResponse>;
    triggerGC: (
      request?: MemoryTriggerGCRequest
    ) => Promise<MemoryTriggerGCResponse>;
    onStatsUpdate: (
      callback: (event: MemoryStatsUpdateEvent) => void
    ) => () => void;
    onPressureChange: (
      callback: (event: MemoryPressureChangeEvent) => void
    ) => () => void;
  };
  fileWatcher: {
    onFileChanged: (callback: (event: FileChangeEvent) => void) => () => void;
  };
  rendererStore: {
    get: <K extends keyof RendererStoreSchema>(
      request: GetRendererStateRequest<K>
    ) => Promise<GetRendererStateResponse<RendererStoreSchema[K]>>;
    set: <K extends keyof RendererStoreSchema>(
      request: SetRendererStateRequest<K>
    ) => Promise<SetRendererStateResponse>;
    update: <K extends keyof RendererStoreSchema>(
      request: UpdateRendererStateRequest<K>
    ) => Promise<UpdateRendererStateResponse>;
    reset: <K extends keyof RendererStoreSchema>(
      request: ResetRendererStateRequest<K>
    ) => Promise<SetRendererStateResponse>;
  };
}

export function createStorageApi({
  invoke,
  on,
  off,
}: SqlProApiDeps): StorageApi {
  return {
    memory: {
      getStats: (request) => invoke(memoryChannels.getStats.name, request),
      subscribe: (request) => invoke(memoryChannels.subscribe.name, request),
      unsubscribe: (request) =>
        invoke(memoryChannels.unsubscribe.name, request),
      triggerGC: (request) => invoke(memoryChannels.triggerGC.name, request),
      onStatsUpdate: (callback) => {
        const handler = (_event: unknown, event: MemoryStatsUpdateEvent) =>
          callback(event);
        on(memoryChannels.statsUpdate.name, handler);
        return () => off(memoryChannels.statsUpdate.name, handler);
      },
      onPressureChange: (callback) => {
        const handler = (_event: unknown, event: MemoryPressureChangeEvent) =>
          callback(event);
        on(memoryChannels.pressureChange.name, handler);
        return () => off(memoryChannels.pressureChange.name, handler);
      },
    },
    fileWatcher: {
      onFileChanged: (callback) => {
        const handler = (_event: unknown, event: FileChangeEvent) =>
          callback(event);
        on(fileWatcherChannels.fileChanged.name, handler);
        return () => off(fileWatcherChannels.fileChanged.name, handler);
      },
    },
    rendererStore: {
      get: (request) => invoke(rendererStoreChannels.get.name, request),
      set: (request) => invoke(rendererStoreChannels.set.name, request),
      update: (request) => invoke(rendererStoreChannels.update.name, request),
      reset: (request) => invoke(rendererStoreChannels.reset.name, request),
    },
  };
}

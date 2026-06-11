/**
 * Mock API definitions for the storage domain.
 * Types mirror the real API interface.
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

export interface StorageMockApi {
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

export function createStorageMock(_deps: SqlProApiDeps): StorageMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

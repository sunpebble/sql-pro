/**
 * Storage domain IPC channels
 *
 * Typed channel contracts for memory monitoring, file watching events,
 * and renderer store persistence operations.
 */

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
  RendererMemoryReport,
  ResetRendererStateRequest,
  SetRendererStateRequest,
  SetRendererStateResponse,
  UpdateRendererStateRequest,
  UpdateRendererStateResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const memoryChannels = {
  getStats: channel<GetMemoryStatsRequest, GetMemoryStatsResponse>(
    'memory:get-stats'
  ),
  subscribe: channel<MemorySubscribeRequest, MemorySubscribeResponse>(
    'memory:subscribe'
  ),
  unsubscribe: channel<MemoryUnsubscribeRequest, MemoryUnsubscribeResponse>(
    'memory:unsubscribe'
  ),
  triggerGC: channel<MemoryTriggerGCRequest, MemoryTriggerGCResponse>(
    'memory:trigger-gc'
  ),
  /** Event channel: main → renderer */
  statsUpdate: channel<MemoryStatsUpdateEvent, void>('memory:stats-update'),
  /** Event channel: main → renderer */
  pressureChange: channel<MemoryPressureChangeEvent, void>(
    'memory:pressure-change'
  ),
  /** Event channel: renderer → main */
  report: channel<RendererMemoryReport, void>('memory:report'),
} as const;

export const fileWatcherChannels = {
  /** Event channel: main → renderer */
  fileChanged: channel<FileChangeEvent, void>('file-watcher:file-changed'),
} as const;

export const rendererStoreChannels = {
  get: channel<GetRendererStateRequest, GetRendererStateResponse>(
    'renderer-store:get'
  ),
  set: channel<SetRendererStateRequest, SetRendererStateResponse>(
    'renderer-store:set'
  ),
  update: channel<UpdateRendererStateRequest, UpdateRendererStateResponse>(
    'renderer-store:update'
  ),
  reset: channel<ResetRendererStateRequest, UpdateRendererStateResponse>(
    'renderer-store:reset'
  ),
} as const;

export const storageChannels = {
  memory: memoryChannels,
  fileWatcher: fileWatcherChannels,
  rendererStore: rendererStoreChannels,
} as const;

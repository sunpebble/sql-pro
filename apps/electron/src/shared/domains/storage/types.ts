/**
 * Storage domain types
 *
 * Memory monitoring, file watching, renderer store persistence,
 * and memory budget cache management types that cross the IPC boundary.
 */

// ============ Memory Monitoring Types ============

// ============ Renderer Store IPC Types ============

import type { RendererStoreSchema } from '../../types/renderer-store';

export interface MemoryThresholds {
  warning: number;
  critical: number;
  heapWarningPercent: number;
  heapCriticalPercent: number;
}

export interface MemoryStats {
  process: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  heap: {
    totalHeapSize: number;
    totalHeapSizeExecutable: number;
    totalPhysicalSize: number;
    totalAvailableSize: number;
    usedHeapSize: number;
    heapSizeLimit: number;
    mallocedMemory: number;
    peakMallocedMemory: number;
    numberOfNativeContexts: number;
    numberOfDetachedContexts: number;
    doesZapGarbage: number;
    externalMemory: number;
  };
  metrics: {
    heapUsagePercent: number;
    totalMemoryMB: number;
    usedHeapMB: number;
    availableHeapMB: number;
  };
  timestamp: number;
}

export type MemoryPressureLevel = 'normal' | 'warning' | 'critical';

export interface GetMemoryStatsRequest {
  includeHeapDetails?: boolean;
}

export interface GetMemoryStatsResponse {
  success: boolean;
  stats?: MemoryStats;
  pressureLevel?: MemoryPressureLevel;
  error?: string;
}

export interface MemorySubscribeRequest {
  intervalMs?: number;
}

export interface MemorySubscribeResponse {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

export interface MemoryUnsubscribeRequest {
  subscriptionId: string;
}

export interface MemoryUnsubscribeResponse {
  success: boolean;
  error?: string;
}

export interface MemoryTriggerGCRequest {
  force?: boolean;
}

export interface MemoryTriggerGCResponse {
  success: boolean;
  gcTriggered: boolean;
  statsAfterGC?: MemoryStats;
  error?: string;
}

export interface MemoryStatsUpdateEvent {
  stats: MemoryStats;
  pressureLevel: MemoryPressureLevel;
}

export interface MemoryPressureChangeEvent {
  previousLevel: MemoryPressureLevel;
  currentLevel: MemoryPressureLevel;
  stats: MemoryStats;
}

export interface RendererMemoryReport {
  windowId: number;
  domNodeCount?: number;
  componentCount?: number;
  customMetrics?: Record<string, number>;
  timestamp: number;
}

export interface GCEvent {
  triggered: boolean;
  reason: 'auto' | 'manual' | 'pressure';
  statsBefore: MemoryStats;
  statsAfter?: MemoryStats;
  freedBytes?: number;
  timestamp: number;
}

// ============ File Watcher Types ============

export interface FileChangeEvent {
  connectionId: string;
  dbPath: string;
  eventType: 'change' | 'rename';
}

export type { RendererStoreSchema };

export interface GetRendererStateRequest<
  K extends keyof RendererStoreSchema = keyof RendererStoreSchema,
> {
  key: K;
}

export interface GetRendererStateResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SetRendererStateRequest<
  K extends keyof RendererStoreSchema = keyof RendererStoreSchema,
> {
  key: K;
  value: RendererStoreSchema[K];
}

export interface SetRendererStateResponse {
  success: boolean;
  error?: string;
}

export interface UpdateRendererStateRequest<
  K extends keyof RendererStoreSchema = keyof RendererStoreSchema,
> {
  key: K;
  updates: Partial<RendererStoreSchema[K]>;
}

export interface ResetRendererStateRequest<
  K extends keyof RendererStoreSchema = keyof RendererStoreSchema,
> {
  key: K;
}

export interface UpdateRendererStateResponse {
  success: boolean;
  error?: string;
}

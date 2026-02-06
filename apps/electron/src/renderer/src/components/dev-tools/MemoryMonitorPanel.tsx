/**
 * Memory Monitor Panel Component
 *
 * A developer tools panel that displays real-time memory usage statistics,
 * cache states, and memory pressure warnings. Provides controls for
 * triggering garbage collection and clearing caches.
 */

import type { CacheStats } from '@shared/lib/memory-budget-cache';
import type { MemoryPressureLevel } from '@shared/types';
import type { RendererMetrics } from '@/hooks/useMemoryMonitor';
import type { GlobalCacheStats } from '@/lib/schema-cache';
import { Button } from '@sqlpro/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sqlpro/ui/card';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Separator } from '@sqlpro/ui/separator';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { schemaCache } from '@/lib/schema-cache';
import { cn } from '@/lib/utils';
import { useQueryStore } from '@/stores/query-store';
import { useTableDataStore } from '@/stores/table-data-store';

/**
 * Memory history entry for the graph
 */
interface MemoryHistoryEntry {
  timestamp: number;
  heapUsedMB: number;
  rssMB: number;
  pressureLevel: MemoryPressureLevel;
}

/**
 * Props for MemoryMonitorPanel
 */
export interface MemoryMonitorPanelProps {
  /** Whether the panel is visible */
  isOpen?: boolean;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Class name for the panel container */
  className?: string;
}

/**
 * Maximum number of entries in the memory history graph
 */
const MAX_HISTORY_ENTRIES = 60;

/**
 * Get the pressure level color
 */
function getPressureColor(level: MemoryPressureLevel): string {
  switch (level) {
    case 'critical':
      return 'text-destructive';
    case 'warning':
      return 'text-amber-500';
    default:
      return 'text-emerald-500';
  }
}

/**
 * Get the pressure level background color
 */
function getPressureBgColor(level: MemoryPressureLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-destructive/10';
    case 'warning':
      return 'bg-amber-500/10';
    default:
      return 'bg-emerald-500/10';
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / k ** i;

  return `${value.toFixed(dm)} ${sizes[i]}`;
}

/**
 * Format percentage
 */
function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Memory usage graph component
 */
function MemoryGraph({
  history,
  maxHeap,
}: {
  history: MemoryHistoryEntry[];
  maxHeap: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 4;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scale
    const maxValue = Math.max(maxHeap, ...history.map((h) => h.heapUsedMB));
    const xStep = (width - padding * 2) / (MAX_HISTORY_ENTRIES - 1);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + ((height - padding * 2) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw heap used line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    history.forEach((entry, index) => {
      const x = padding + index * xStep;
      const y =
        height -
        padding -
        (entry.heapUsedMB / maxValue) * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw RSS line (lighter)
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    history.forEach((entry, index) => {
      const x = padding + index * xStep;
      const y =
        height - padding - (entry.rssMB / maxValue) * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw pressure indicators
    history.forEach((entry, index) => {
      if (entry.pressureLevel !== 'normal') {
        const x = padding + index * xStep;
        ctx.fillStyle =
          entry.pressureLevel === 'critical'
            ? 'rgba(239, 68, 68, 0.3)'
            : 'rgba(245, 158, 11, 0.3)';
        ctx.fillRect(x - 1, padding, 2, height - padding * 2);
      }
    });
  }, [history, maxHeap]);

  return (
    <div className="bg-muted/30 rounded-base border-border border-2 p-2">
      <canvas
        ref={canvasRef}
        width={280}
        height={80}
        className="w-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      <div
        className="text-muted-foreground mt-1 flex justify-between"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {t('devTools.memoryMonitor.heap')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-500 opacity-50" />
          {t('devTools.memoryMonitor.rss')}
        </span>
      </div>
    </div>
  );
}

/**
 * Stat item component
 */
function StatItem({
  label,
  value,
  subValue,
  className,
}: {
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span
        className="text-muted-foreground"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        {label}
      </span>
      <span
        className="font-mono font-medium"
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      >
        {value}
      </span>
      {subValue && (
        <span
          className="text-muted-foreground"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          {subValue}
        </span>
      )}
    </div>
  );
}

/**
 * Cache stats section component
 */
function CacheStatsSection({
  title,
  stats,
  onClear,
  isExpanded,
  onToggle,
}: {
  title: string;
  stats: CacheStats | null;
  onClear: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation('common');

  if (!stats) return null;

  return (
    <div className="bg-muted/30 rounded-base border-border border-2">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-accent/50 flex w-full items-center justify-between p-2 font-medium transition-colors"
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      >
        <span className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Database className="text-muted-foreground h-4 w-4" />
          {title}
        </span>
        <span
          className="text-muted-foreground"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          {t('devTools.memoryMonitor.items', { count: stats.itemCount })}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-2 border-t px-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              label={t('devTools.memoryMonitor.memoryUsed')}
              value={formatBytes(stats.totalBytes)}
            />
            <StatItem
              label={t('devTools.memoryMonitor.maxMemory')}
              value={formatBytes(stats.maxBytes)}
            />
            <StatItem
              label={t('devTools.memoryMonitor.hitRate')}
              value={formatPercent(stats.hitRate / 100)}
            />
            <StatItem
              label={t('devTools.memoryMonitor.evictions')}
              value={stats.evictions.toString()}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('devTools.memoryMonitor.hitsAndMisses', {
                hits: stats.hits,
                misses: stats.misses,
              })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              {t('devTools.memoryMonitor.clear')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renderer metrics section
 */
function RendererMetricsSection({
  metrics,
  isExpanded,
  onToggle,
}: {
  metrics: RendererMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-muted/30 rounded-base border-border border-2">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-accent/50 flex w-full items-center justify-between p-2 font-medium transition-colors"
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      >
        <span className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <HardDrive className="text-muted-foreground h-4 w-4" />
          {t('devTools.memoryMonitor.rendererProcess')}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t px-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <StatItem
              label={t('devTools.memoryMonitor.domNodes')}
              value={metrics.domNodeCount.toString()}
            />
            <StatItem
              label={t('devTools.memoryMonitor.components')}
              value={metrics.componentCount.toString()}
            />
            {metrics.usedJsHeapSize !== undefined && (
              <StatItem
                label={t('devTools.memoryMonitor.jsHeapUsed')}
                value={formatBytes(metrics.usedJsHeapSize)}
              />
            )}
            {metrics.jsHeapSize !== undefined && (
              <StatItem
                label={t('devTools.memoryMonitor.jsHeapTotal')}
                value={formatBytes(metrics.jsHeapSize)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Memory Monitor Panel
 *
 * Displays real-time memory usage statistics, cache states, and provides
 * controls for memory management operations.
 */
export function MemoryMonitorPanel({
  isOpen = true,
  onClose,
  className,
}: MemoryMonitorPanelProps) {
  const { t } = useTranslation('common');

  // Memory monitoring hook
  const {
    mainProcessStats,
    pressureLevel,
    rendererMetrics,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    triggerGC,
    refreshRendererMetrics,
  } = useMemoryMonitor({
    autoSubscribe: true,
    rendererMetricsIntervalMs: 2000,
  });

  // Memory history for graph
  const [memoryHistory, setMemoryHistory] = useState<MemoryHistoryEntry[]>([]);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    tableData: true,
    queryResults: true,
    schema: true,
    renderer: false,
  });

  // Cache stats - use local state updated via effect to avoid infinite loops
  // Calling getCacheStats() in a Zustand selector returns a new object each time,
  // which causes React to think state changed, triggering re-renders infinitely.
  const [tableDataStats, setTableDataStats] = useState<CacheStats>(() =>
    useTableDataStore.getState().getCacheStats()
  );
  const [queryResultsStats, setQueryResultsStats] = useState<CacheStats>(() =>
    useQueryStore.getState().getResultsCacheStats()
  );
  const [schemaCacheStats, setSchemaCacheStats] = useState<GlobalCacheStats>(
    () => schemaCache.getStats()
  );

  // Update cache stats periodically and when memory stats change
  useEffect(() => {
    // Update immediately - syncing with external store state is intentional
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Sync with external stores
    setTableDataStats(useTableDataStore.getState().getCacheStats());
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Sync with external stores
    setQueryResultsStats(useQueryStore.getState().getResultsCacheStats());
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Sync with external stores
    setSchemaCacheStats(schemaCache.getStats());
  }, [mainProcessStats]);

  // GC in progress state
  const [isGCRunning, setIsGCRunning] = useState(false);

  // Update memory history when stats change
  useEffect(() => {
    if (mainProcessStats?.metrics) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Updating history based on prop changes
      setMemoryHistory((prev) => {
        const newEntry: MemoryHistoryEntry = {
          timestamp: Date.now(),
          heapUsedMB: mainProcessStats.metrics.usedHeapMB,
          rssMB: mainProcessStats.metrics.totalMemoryMB,
          pressureLevel,
        };

        const updated = [...prev, newEntry];
        if (updated.length > MAX_HISTORY_ENTRIES) {
          return updated.slice(-MAX_HISTORY_ENTRIES);
        }
        return updated;
      });
    }
  }, [mainProcessStats, pressureLevel]);

  // Handle GC trigger
  const handleTriggerGC = useCallback(async () => {
    setIsGCRunning(true);
    try {
      await triggerGC(true);
      refreshRendererMetrics();
    } finally {
      setIsGCRunning(false);
    }
  }, [triggerGC, refreshRendererMetrics]);

  // Handle cache clear
  const handleClearTableDataCache = useCallback(() => {
    useTableDataStore.getState().clearCache();
  }, []);

  const handleClearQueryResultsCache = useCallback(() => {
    useQueryStore.getState().clearResultsCache();
  }, []);

  const handleClearSchemaCache = useCallback(() => {
    schemaCache.clearAll();
  }, []);

  const handleClearAllCaches = useCallback(() => {
    handleClearTableDataCache();
    handleClearQueryResultsCache();
    handleClearSchemaCache();
  }, [
    handleClearTableDataCache,
    handleClearQueryResultsCache,
    handleClearSchemaCache,
  ]);

  // Toggle section expansion
  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  // Calculate max heap for graph scaling
  const maxHeap = mainProcessStats?.metrics.availableHeapMB ?? 512;

  if (!isOpen) return null;

  return (
    <Card className={cn('flex h-full w-80 flex-col', className)}>
      <CardHeader className="flex-shrink-0 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-muted-foreground h-4 w-4" />
            <CardTitle style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
              {t('devTools.memoryMonitor.title')}
            </CardTitle>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          {t('devTools.memoryMonitor.description')}
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="space-y-4 p-4">
          {/* Error State */}
          {error && (
            <div
              className="bg-destructive/10 text-destructive rounded-base flex items-center gap-2 p-2"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pressure Level Indicator */}
          <div
            className={cn(
              'rounded-base flex items-center justify-between p-3',
              getPressureBgColor(pressureLevel)
            )}
          >
            <div className="flex items-center gap-2">
              {pressureLevel !== 'normal' && (
                <AlertTriangle
                  className={cn('h-4 w-4', getPressureColor(pressureLevel))}
                />
              )}
              <span
                className={cn('font-medium', getPressureColor(pressureLevel))}
              >
                {t('devTools.memoryMonitor.memoryPressure')}{' '}
                {pressureLevel.charAt(0).toUpperCase() + pressureLevel.slice(1)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6"
              onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
              disabled={isLoading}
            >
              {isSubscribed
                ? t('devTools.memoryMonitor.pause')
                : t('devTools.memoryMonitor.resume')}
            </Button>
          </div>

          {/* Memory Graph */}
          {memoryHistory.length > 0 && (
            <MemoryGraph history={memoryHistory} maxHeap={maxHeap} />
          )}

          {/* Main Process Stats */}
          {mainProcessStats?.metrics && mainProcessStats?.process && (
            <div className="space-y-2">
              <h3
                className="text-muted-foreground font-medium tracking-wide uppercase"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('devTools.memoryMonitor.mainProcessMemory')}
              </h3>
              <div className="bg-muted/30 rounded-base border-border grid grid-cols-2 gap-3 border-2 p-3">
                <StatItem
                  label={t('devTools.memoryMonitor.heapUsed')}
                  value={`${mainProcessStats.metrics.usedHeapMB.toFixed(1)} MB`}
                  subValue={formatPercent(
                    mainProcessStats.metrics.heapUsagePercent
                  )}
                />
                <StatItem
                  label={t('devTools.memoryMonitor.heapAvailable')}
                  value={`${mainProcessStats.metrics.availableHeapMB.toFixed(1)} MB`}
                />
                <StatItem
                  label={t('devTools.memoryMonitor.rssTotal')}
                  value={`${mainProcessStats.metrics.totalMemoryMB.toFixed(1)} MB`}
                />
                <StatItem
                  label={t('devTools.memoryMonitor.external')}
                  value={formatBytes(mainProcessStats.process.external)}
                />
                <StatItem
                  label={t('devTools.memoryMonitor.arrayBuffers')}
                  value={formatBytes(mainProcessStats.process.arrayBuffers)}
                />
                <StatItem
                  label={t('devTools.memoryMonitor.heapTotal')}
                  value={formatBytes(mainProcessStats.process.heapTotal)}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Cache Statistics */}
          <div className="space-y-2">
            <h3
              className="text-muted-foreground font-medium tracking-wide uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('devTools.memoryMonitor.cacheStatistics')}
            </h3>

            <CacheStatsSection
              title={t('devTools.memoryMonitor.tableDataCache')}
              stats={tableDataStats}
              onClear={handleClearTableDataCache}
              isExpanded={expandedSections.tableData}
              onToggle={() => toggleSection('tableData')}
            />

            <CacheStatsSection
              title={t('devTools.memoryMonitor.queryResultsCache')}
              stats={queryResultsStats}
              onClear={handleClearQueryResultsCache}
              isExpanded={expandedSections.queryResults}
              onToggle={() => toggleSection('queryResults')}
            />

            {/* Schema cache has different stats format */}
            <div className="bg-muted/30 rounded-base border-border border-2">
              <button
                type="button"
                onClick={() => toggleSection('schema')}
                className="hover:bg-accent/50 flex w-full items-center justify-between p-2 font-medium transition-colors"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                <span className="flex items-center gap-2">
                  {expandedSections.schema ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Database className="text-muted-foreground h-4 w-4" />
                  {t('devTools.memoryMonitor.schemaCache')}
                </span>
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('devTools.memoryMonitor.connections', {
                    count: schemaCacheStats.connectionCount,
                  })}
                </span>
              </button>

              {expandedSections.schema && (
                <div className="space-y-2 border-t px-3 py-2">
                  <div className="grid grid-cols-2 gap-2">
                    <StatItem
                      label={t('devTools.memoryMonitor.schemaLists')}
                      value={schemaCacheStats.schemaListCount.toString()}
                    />
                    <StatItem
                      label={t('devTools.memoryMonitor.tableDetails')}
                      value={schemaCacheStats.totalTableDetailsCount.toString()}
                    />
                    <StatItem
                      label={t('devTools.memoryMonitor.memoryUsed')}
                      value={formatBytes(
                        schemaCacheStats.totalTableDetailsBytes
                      )}
                    />
                    <StatItem
                      label={t('devTools.memoryMonitor.pendingFetches')}
                      value={schemaCacheStats.pendingFetches.toString()}
                    />
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSchemaCache}
                      className="h-6"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      {t('devTools.memoryMonitor.clear')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Renderer Metrics */}
          <div className="space-y-2">
            <h3
              className="text-muted-foreground font-medium tracking-wide uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('devTools.memoryMonitor.rendererMetrics')}
            </h3>

            <RendererMetricsSection
              metrics={rendererMetrics}
              isExpanded={expandedSections.renderer}
              onToggle={() => toggleSection('renderer')}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <h3
              className="text-muted-foreground font-medium tracking-wide uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('devTools.memoryMonitor.actions')}
            </h3>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerGC}
                disabled={isGCRunning}
                className="w-full justify-start"
              >
                <RefreshCw
                  className={cn('mr-2 h-4 w-4', isGCRunning && 'animate-spin')}
                />
                {isGCRunning
                  ? t('devTools.memoryMonitor.runningGC')
                  : t('devTools.memoryMonitor.triggerGC')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllCaches}
                className="w-full justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('devTools.memoryMonitor.clearAllCaches')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={refreshRendererMetrics}
                className="w-full justify-start"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('devTools.memoryMonitor.refreshRendererMetrics')}
              </Button>
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export default MemoryMonitorPanel;

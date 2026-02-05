import type { ColumnDistributionValue } from '@shared/types';
import type { ColumnSchema } from '@/types/database';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@sqlpro/ui/collapsible';
import { Progress } from '@sqlpro/ui/progress';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  Hash,
  Loader2,
  Percent,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColumnDistribution } from '@/hooks/useColumnDistribution';
import { cn } from '@/lib/utils';

type StatsMode = 'page' | 'full';

interface ColumnStatsProps {
  columns: ColumnSchema[];
  data: Record<string, unknown>[];
  className?: string;
  connectionId?: string | null;
  schema?: string;
  table?: string | null;
  onFilterAdd?: (column: string, value: unknown) => void;
}

interface ColumnStat {
  column: string;
  type: string;
  totalCount: number;
  nullCount: number;
  distinctCount: number;
  /** For numeric columns */
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  /** For text columns */
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
  /** Most common values */
  topValues: Array<{ value: unknown; count: number; percentage: number }>;
}

/**
 * Calculate statistics for a single column
 */
function calculateColumnStats(
  columnName: string,
  columnType: string,
  data: Record<string, unknown>[]
): ColumnStat {
  const values = data.map((row) => row[columnName]);
  const totalCount = values.length;
  const nullCount = values.filter((v) => v === null || v === undefined).length;
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);

  // Count distinct values
  const valueSet = new Set(nonNullValues.map((v) => JSON.stringify(v)));
  const distinctCount = valueSet.size;

  // Count value frequencies for top values
  const valueCounts = new Map<string, { value: unknown; count: number }>();
  for (const value of nonNullValues) {
    const key = JSON.stringify(value);
    const existing = valueCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      valueCounts.set(key, { value, count: 1 });
    }
  }

  // Sort by count and take top 5
  const sortedValues = Array.from(valueCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((v) => ({
      value: v.value,
      count: v.count,
      percentage: totalCount > 0 ? (v.count / totalCount) * 100 : 0,
    }));

  const stat: ColumnStat = {
    column: columnName,
    type: columnType,
    totalCount,
    nullCount,
    distinctCount,
    topValues: sortedValues,
  };

  // Numeric statistics
  const typeLower = columnType.toLowerCase();
  if (
    typeLower.includes('int') ||
    typeLower.includes('num') ||
    typeLower.includes('float') ||
    typeLower.includes('real') ||
    typeLower.includes('double')
  ) {
    const numbers = nonNullValues
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));

    if (numbers.length > 0) {
      stat.min = Math.min(...numbers);
      stat.max = Math.max(...numbers);
      stat.sum = numbers.reduce((a, b) => a + b, 0);
      stat.avg = stat.sum / numbers.length;
    }
  }

  // Text statistics
  if (
    typeLower.includes('text') ||
    typeLower.includes('char') ||
    typeLower.includes('varchar')
  ) {
    const lengths = nonNullValues.map((v) => String(v).length);

    if (lengths.length > 0) {
      stat.minLength = Math.min(...lengths);
      stat.maxLength = Math.max(...lengths);
      stat.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    }
  }

  return stat;
}

/**
 * A collapsible panel that shows column statistics.
 * Supports two modes:
 * - "page": Statistics from current page data (client-side)
 * - "full": Full table statistics via GROUP BY query (server-side)
 */
export const ColumnStats = memo(
  ({
    columns,
    data,
    className,
    connectionId,
    schema,
    table,
    onFilterAdd,
  }: ColumnStatsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [mode, setMode] = useState<StatsMode>('page');

    // Calculate stats for all columns (page mode)
    const pageStats = useMemo(() => {
      if (data.length === 0) return [];

      return columns.map((col) =>
        calculateColumnStats(col.name, col.type, data)
      );
    }, [columns, data]);

    const { t } = useTranslation('common');

    // Full table distribution (only fetched when mode is 'full' and column is selected)
    const {
      distribution: fullDistribution,
      totalRows: fullTotalRows,
      distinctCount: fullDistinctCount,
      nullCount: fullNullCount,
      isLoading: isLoadingFull,
      isFetching: isFetchingFull,
    } = useColumnDistribution({
      connectionId: connectionId ?? null,
      schema,
      table: table ?? null,
      column: selectedColumn,
      enabled: mode === 'full' && isOpen && !!selectedColumn,
    });

    // Get selected column stats (page mode)
    const selectedPageStats = useMemo(() => {
      if (!selectedColumn) return null;
      return pageStats.find((s) => s.column === selectedColumn);
    }, [pageStats, selectedColumn]);

    // Check if full mode is available
    const canUseFull = !!connectionId && !!table;

    if (data.length === 0) return null;

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-none border-t px-4',
            'hover:bg-muted/50 transition-all duration-200',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="text-muted-foreground h-3.5 w-3.5" />
            <span
              className="font-medium"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('table.columnStats', { defaultValue: 'Column Statistics' })}
            </span>
            <span className="text-muted-foreground text-2xs">
              (
              {t('table.columnsCount', {
                count: columns.length,
                defaultValue: '{{count}} columns',
              })}
              ,{' '}
              {mode === 'full' && fullTotalRows > 0
                ? t('table.rowsCount', {
                    count: fullTotalRows,
                    defaultValue: '{{count}} rows',
                  })
                : t('table.rowsCount', {
                    count: data.length,
                    defaultValue: '{{count}} rows',
                  })}
              )
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5 transition-transform" />
          ) : (
            <ChevronUp className="text-muted-foreground h-3.5 w-3.5 transition-transform" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="bg-muted/30 border-t">
            {/* Mode toggle and column selector */}
            <div className="flex items-center gap-2 border-b p-2">
              {/* Mode toggle */}
              {canUseFull && (
                <div className="bg-muted flex shrink-0 rounded-md p-0.5">
                  <button
                    onClick={() => setMode('page')}
                    className={cn(
                      'text-2xs flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors',
                      mode === 'page'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t('columnStats.currentPage', {
                      defaultValue: 'Current Page',
                    })}
                  </button>
                  <button
                    onClick={() => setMode('full')}
                    className={cn(
                      'text-2xs flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors',
                      mode === 'full'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Database className="h-3 w-3" />
                    {t('columnStats.fullTable', { defaultValue: 'Full Table' })}
                  </button>
                </div>
              )}

              {/* Column selector */}
              <div className="flex flex-1 gap-1 overflow-x-auto">
                {columns.map((col) => {
                  const stat = pageStats.find((s) => s.column === col.name);
                  const isSelected = selectedColumn === col.name;
                  const nullPercentage = stat
                    ? (stat.nullCount / stat.totalCount) * 100
                    : 0;

                  return (
                    <button
                      key={col.name}
                      onClick={() =>
                        setSelectedColumn(isSelected ? null : col.name)
                      }
                      className={cn(
                        'flex items-center gap-1.5 rounded px-2 py-1',
                        'whitespace-nowrap transition-all duration-150',
                        isSelected
                          ? 'bg-primary text-background shadow-sm'
                          : 'hover:bg-muted bg-background border'
                      )}
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                      }}
                    >
                      <span className="max-w-25 truncate font-medium">
                        {col.name}
                      </span>
                      {nullPercentage > 0 && (
                        <span
                          className={cn(
                            'rounded-md px-1 text-[9px]',
                            isSelected
                              ? 'bg-background/20'
                              : nullPercentage > 50
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-muted'
                          )}
                        >
                          {nullPercentage.toFixed(0)}%{' '}
                          {t('columnStats.null', { defaultValue: 'null' })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats display - fixed height to prevent layout jumps */}
            <div className="h-[280px] overflow-y-auto">
              {selectedColumn ? (
                mode === 'full' ? (
                  <FullTableStats
                    column={selectedColumn}
                    distribution={fullDistribution}
                    totalRows={fullTotalRows}
                    distinctCount={fullDistinctCount}
                    nullCount={fullNullCount}
                    isLoading={isLoadingFull}
                    isFetching={isFetchingFull}
                    onFilterAdd={onFilterAdd}
                    t={t}
                  />
                ) : (
                  selectedPageStats && (
                    <PageStats stats={selectedPageStats} t={t} />
                  )
                )
              ) : (
                <div
                  className="text-muted-foreground flex h-full items-center justify-center p-4 text-center"
                  style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
                >
                  {t('table.selectColumn', {
                    defaultValue:
                      'Select a column above to view detailed statistics',
                  })}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

ColumnStats.displayName = 'ColumnStats';

// Page stats component (existing functionality)
interface PageStatsProps {
  stats: ColumnStat;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function PageStats({ stats, t }: PageStatsProps) {
  return (
    <div className="animate-in fade-in space-y-3 p-3 duration-200">
      {/* Quick stats row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<Hash className="h-3 w-3" />}
          label={t('columnStats.distinct', { defaultValue: 'Distinct' })}
          value={stats.distinctCount.toLocaleString()}
          subtitle={t('columnStats.ofTotal', {
            count: stats.totalCount,
            defaultValue: 'of {{count}}',
          })}
        />
        <StatCard
          icon={<Percent className="h-3 w-3" />}
          label={t('columnStats.nullRate', { defaultValue: 'Null Rate' })}
          value={`${((stats.nullCount / stats.totalCount) * 100).toFixed(1)}%`}
          subtitle={t('columnStats.nullsCount', {
            count: stats.nullCount,
            defaultValue: '{{count}} nulls',
          })}
          warning={stats.nullCount / stats.totalCount > 0.5}
        />
        {stats.min !== undefined && (
          <StatCard
            icon={<TrendingDown className="h-3 w-3" />}
            label={t('columnStats.min', { defaultValue: 'Min' })}
            value={formatNumber(stats.min)}
          />
        )}
        {stats.max !== undefined && (
          <StatCard
            icon={<TrendingUp className="h-3 w-3" />}
            label={t('columnStats.max', { defaultValue: 'Max' })}
            value={formatNumber(stats.max)}
          />
        )}
        {stats.avg !== undefined && (
          <StatCard
            icon={<Sparkles className="h-3 w-3" />}
            label={t('columnStats.average', { defaultValue: 'Average' })}
            value={formatNumber(stats.avg)}
          />
        )}
        {stats.avgLength !== undefined && (
          <StatCard
            icon={<Sparkles className="h-3 w-3" />}
            label={t('columnStats.avgLength', { defaultValue: 'Avg Length' })}
            value={stats.avgLength.toFixed(1)}
            subtitle={`${stats.minLength}-${stats.maxLength}`}
          />
        )}
      </div>

      {/* Top values */}
      {stats.topValues.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-muted-foreground text-2xs font-medium uppercase">
            {t('columnStats.topValues', { defaultValue: 'Top Values' })}
          </span>
          <div className="space-y-1">
            {stats.topValues.map((item) => (
              <div
                key={`${String(item.value)}-${item.count}`}
                className="flex items-center gap-2"
                style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono">
                      {formatValue(item.value)}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      ({item.count})
                    </span>
                  </div>
                  <Progress value={item.percentage} className="mt-0.5 h-1" />
                </div>
                <span className="text-muted-foreground text-2xs w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FullTableStatsProps {
  column: string;
  distribution: ColumnDistributionValue[];
  totalRows: number;
  distinctCount: number;
  nullCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  onFilterAdd?: (column: string, value: unknown) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function FullTableStats({
  column,
  distribution,
  totalRows,
  distinctCount,
  nullCount,
  isLoading,
  isFetching,
  onFilterAdd,
  t,
}: FullTableStatsProps) {
  // Only show loading spinner on initial load (no data yet)
  // During refetch, keep showing the existing data
  if (isLoading && distribution.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 p-8">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        <span
          className="text-muted-foreground"
          style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
        >
          {t('columnStats.loading', {
            defaultValue: 'Loading full table statistics...',
          })}
        </span>
      </div>
    );
  }

  const nullPercentage = totalRows > 0 ? (nullCount / totalRows) * 100 : 0;

  return (
    <div className="animate-in fade-in relative space-y-3 p-3 duration-200">
      {/* Subtle refresh indicator */}
      {isFetching && (
        <div className="absolute top-2 right-2">
          <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Database className="h-3 w-3" />}
          label={t('columnStats.totalRows', { defaultValue: 'Total Rows' })}
          value={totalRows.toLocaleString()}
        />
        <StatCard
          icon={<Hash className="h-3 w-3" />}
          label={t('columnStats.distinct', { defaultValue: 'Distinct' })}
          value={distinctCount.toLocaleString()}
          subtitle={t('columnStats.uniqueValues', {
            defaultValue: 'unique values',
          })}
        />
        <StatCard
          icon={<Percent className="h-3 w-3" />}
          label={t('columnStats.nullRate', { defaultValue: 'Null Rate' })}
          value={`${nullPercentage.toFixed(1)}%`}
          subtitle={t('columnStats.nullsCount', {
            count: nullCount,
            defaultValue: '{{count}} nulls',
          })}
          warning={nullPercentage > 50}
        />
      </div>

      {/* All values distribution */}
      {distribution.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-2xs font-medium uppercase">
              {t('columnStats.allValues', { defaultValue: 'All Values' })}
              <span className="text-muted-foreground/70 ml-1 normal-case">
                ({distribution.length})
              </span>
            </span>
          </div>
          <div className="space-y-1">
            {distribution.map((item, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- Index needed as value may not be unique
                key={`${String(item.value)}-${index}`}
                className="group flex items-center gap-2"
                style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono">
                      {formatValue(item.value)}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      ({item.count.toLocaleString()})
                    </span>
                  </div>
                  <Progress value={item.percentage} className="mt-0.5 h-1" />
                </div>
                <span className="text-muted-foreground text-2xs w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
                {onFilterAdd && (
                  <button
                    onClick={() => onFilterAdd(column, item.value)}
                    className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    title={t('columnStats.filterByValue', {
                      defaultValue: 'Filter by this value',
                    })}
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  warning?: boolean;
}

function StatCard({ icon, label, value, subtitle, warning }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-background rounded-md border px-2.5 py-1.5',
        warning && 'border-amber-500/50 bg-amber-500/5'
      )}
    >
      <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
        {icon}
        <span className="text-2xs uppercase">{label}</span>
      </div>
      <div
        className="font-medium"
        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-muted-foreground text-2xs">{subtitle}</div>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) {
    return n.toLocaleString();
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  const str = String(value);
  return str.length > 30 ? `${str.slice(0, 30)}...` : str;
}

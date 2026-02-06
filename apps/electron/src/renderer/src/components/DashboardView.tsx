/**
 * Dashboard View Component
 *
 * A full-screen dashboard that displays database statistics, table metrics,
 * storage analysis, and data distribution visualizations.
 * Designed for the ActivityBar view mode with optimized layouts.
 */

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sqlpro/ui/card';
import { Progress } from '@sqlpro/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  HardDrive,
  Hash,
  Info,
  Layers,
  Loader2,
  PieChart,
  RefreshCw,
  Table2,
  TrendingUp,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

// Data type categories for grouping
const DATA_TYPE_CATEGORIES: Record<string, string> = {
  INTEGER: 'Numeric',
  INT: 'Numeric',
  BIGINT: 'Numeric',
  SMALLINT: 'Numeric',
  TINYINT: 'Numeric',
  REAL: 'Numeric',
  FLOAT: 'Numeric',
  DOUBLE: 'Numeric',
  DECIMAL: 'Numeric',
  NUMERIC: 'Numeric',
  TEXT: 'Text',
  VARCHAR: 'Text',
  CHAR: 'Text',
  NVARCHAR: 'Text',
  NCHAR: 'Text',
  CLOB: 'Text',
  BLOB: 'Binary',
  BINARY: 'Binary',
  VARBINARY: 'Binary',
  DATE: 'DateTime',
  TIME: 'DateTime',
  DATETIME: 'DateTime',
  TIMESTAMP: 'DateTime',
  BOOLEAN: 'Boolean',
  BOOL: 'Boolean',
};

interface TableStats {
  name: string;
  rowCount: number;
  columnCount: number;
  indexCount: number;
  sizeBytes?: number;
}

interface DatabaseStats {
  tableCount: number;
  totalRows: number;
  totalColumns: number;
  totalIndexes: number;
  totalSizeBytes: number;
  tables: TableStats[];
  dataTypeDistribution: { type: string; count: number }[];
  analyzedAt: Date;
}

// Format bytes to human-readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Get category for a data type
function getTypeCategory(type: string): string {
  const upper = type.toUpperCase();
  for (const [key, category] of Object.entries(DATA_TYPE_CATEGORIES)) {
    if (upper.includes(key)) return category;
  }
  return 'Other';
}

// Stat card component - larger for full-screen view
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: string;
  index?: number;
}

const StatCard = memo(
  ({
    label,
    value,
    subValue,
    icon: Icon,
    color = 'text-primary',
    index = 0,
  }: StatCardProps) => {
    return (
      <div
        style={{ animationDelay: `${index * 50}ms` }}
        className={cn(
          'group rounded-base relative overflow-hidden p-3',
          'bg-muted/30',
          'border-border/40 border',
          'transition-all duration-200 ease-out',
          'hover:bg-muted/50',
          'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300'
        )}
      >
        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              'rounded-base p-2',
              color === 'text-blue-500' && 'bg-blue-500/15',
              color === 'text-green-500' && 'bg-green-500/15',
              color === 'text-purple-500' && 'bg-purple-500/15',
              color === 'text-amber-500' && 'bg-amber-500/15',
              color === 'text-rose-500' && 'bg-rose-500/15',
              color === 'text-primary' && 'bg-primary/15'
            )}
          >
            <Icon className={cn('h-4 w-4', color)} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate leading-none font-semibold tabular-nums"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.4)' }}
            >
              {value}
            </p>
            {subValue && (
              <p
                className="text-muted-foreground/60 truncate"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {subValue}
              </p>
            )}
            <p
              className="text-muted-foreground truncate"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {label}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

// Table row component for the table list
interface TableRowProps {
  table: TableStats;
  maxRows: number;
  maxSize: number;
  index: number;
}

const TableRow = memo(({ table, maxRows, maxSize, index }: TableRowProps) => {
  const { t } = useTranslation('common');
  const rowPercent = maxRows > 0 ? (table.rowCount / maxRows) * 100 : 0;
  const sizePercent =
    maxSize > 0 && table.sizeBytes ? (table.sizeBytes / maxSize) * 100 : 0;

  return (
    <div
      className={cn(
        'group rounded-base border-border flex items-center gap-4 border-2 p-3',
        'transition-all duration-200',
        'hover:bg-muted/50 hover:translate-x-0.5 hover:translate-y-0.5'
      )}
    >
      <div className="bg-muted rounded-base flex h-8 w-8 items-center justify-center transition-transform duration-200">
        <span
          className="text-muted-foreground font-semibold"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Table2 className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
          <span className="truncate font-medium">{table.name}</span>
        </div>
        <div
          className="mt-1.5 flex items-center gap-4"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          <span className="text-muted-foreground font-medium">
            {table.rowCount.toLocaleString()} {t('databaseDashboard.rows')}
          </span>
          <span className="text-muted-foreground">
            {table.columnCount} {t('databaseDashboard.columns')}
          </span>
          {table.sizeBytes !== undefined && (
            <span className="text-muted-foreground">
              {formatBytes(table.sizeBytes)}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex gap-2">
          <div className="flex-1">
            <Progress value={rowPercent} className="h-1.5 shadow-sm" />
          </div>
          {table.sizeBytes !== undefined && (
            <div className="w-24">
              <Progress
                value={sizePercent}
                className="h-1.5 bg-purple-100 shadow-sm dark:bg-purple-900"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary transition-transform"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          {table.indexCount} idx
        </Badge>
      </div>
    </div>
  );
});

// Table size bar chart component - taller for full-screen
interface TableSizeChartProps {
  tables: TableStats[];
  height?: number;
}

const TableSizeChart = memo(({ tables, height = 350 }: TableSizeChartProps) => {
  const { t } = useTranslation('common');
  const chartData = useMemo(() => {
    return tables
      .filter((t) => t.rowCount > 0)
      .sort((a, b) => b.rowCount - a.rowCount)
      .slice(0, 10)
      .map((t) => ({
        name: t.name.length > 18 ? `${t.name.slice(0, 15)}...` : t.name,
        fullName: t.name,
        rows: t.rowCount,
        size: t.sizeBytes || 0,
      }));
  }, [tables]);

  if (chartData.length === 0) {
    return (
      <div
        className="border-border bg-muted/20 rounded-base flex flex-col items-center justify-center gap-3 border-2 border-dashed"
        style={{ height }}
      >
        <div className="bg-muted/50 rounded-full p-3">
          <BarChart3 className="text-muted-foreground/60 h-6 w-6" />
        </div>
        <p
          className="text-muted-foreground font-medium"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {t('databaseDashboard.noTableData')}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        barCategoryGap="20%"
      >
        <XAxis type="number" tickFormatter={formatNumber} />
        <YAxis
          dataKey="name"
          type="category"
          width={120}
          tick={{ fontSize: 12 }}
          tickMargin={4}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const data = payload[0].payload as {
              fullName?: string;
              rows?: number;
              size?: number;
            };
            return (
              <div className="bg-popover border-border rounded-base shadow-shadow border-2 px-3.5 py-2.5">
                <p className="font-semibold">{data.fullName}</p>
                <p
                  className="font-medium text-blue-500"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {data.rows?.toLocaleString()} {t('databaseDashboard.rows')}
                </p>
                {data.size && data.size > 0 && (
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {formatBytes(data.size)}
                  </p>
                )}
              </div>
            );
          }}
        />
        <Bar dataKey="rows" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// Data type distribution pie chart - larger for full-screen
interface DataTypeChartProps {
  distribution: { type: string; count: number }[];
  height?: number;
}

const DataTypeChart = memo(
  ({ distribution, height = 280 }: DataTypeChartProps) => {
    const { t } = useTranslation('common');
    const chartData = useMemo(() => {
      // Group by category
      const categoryMap = new Map<string, number>();
      for (const item of distribution) {
        const category = getTypeCategory(item.type);
        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + item.count
        );
      }

      return Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
    }, [distribution]);

    const total = useMemo(
      () => chartData.reduce((sum, item) => sum + item.value, 0),
      [chartData]
    );

    if (chartData.length === 0) {
      return (
        <div
          className="border-border bg-muted/20 rounded-base flex flex-col items-center justify-center gap-3 border-2 border-dashed"
          style={{ height }}
        >
          <div className="bg-muted/50 rounded-full p-3">
            <PieChart className="text-muted-foreground/60 h-6 w-6" />
          </div>
          <p
            className="text-muted-foreground font-medium"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {t('databaseDashboard.noDataTypeInfo')}
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-8">
        <ResponsiveContainer width="50%" height={height}>
          <RechartsPieChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="75%"
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={(props: unknown) => {
                const { active, payload } = props as {
                  active?: boolean;
                  payload?: Array<{ payload: { name: string; value: number } }>;
                };
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-popover border-border rounded-base shadow-shadow border-2 px-3.5 py-2.5">
                    <p className="font-semibold">{data.name}</p>
                    <p
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      <span className="text-foreground font-medium">
                        {data.value}
                      </span>{' '}
                      {t('databaseDashboard.columns')}{' '}
                      <span className="text-purple-500">({percentage}%)</span>
                    </p>
                  </div>
                );
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              style={{ animationDelay: `${index * 40}ms` }}
              className={cn(
                'group/legend rounded-base flex items-center gap-3 p-2.5 transition-all duration-200',
                'hover:bg-muted/60',
                'animate-in fade-in-0 slide-in-from-right-2 fill-mode-both',
                'cursor-default'
              )}
            >
              <div
                className="ring-background h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 transition-all duration-200 group-hover/legend:scale-125 group-hover/legend:shadow-md"
                style={{ backgroundColor: item.fill }}
              />
              <span
                className="group-hover/legend:text-foreground font-medium transition-colors"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {item.name}
              </span>
              <span
                className="text-muted-foreground group-hover/legend:text-primary ml-auto font-semibold tabular-nums transition-colors"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

interface InsightsCardProps {
  stats: DatabaseStats;
}

const InsightsCard = memo(({ stats }: InsightsCardProps) => {
  const { t } = useTranslation('common');

  const insights = useMemo(() => {
    const items: {
      type: 'info' | 'warning' | 'success';
      icon: React.ElementType;
      title: string;
      description: string;
    }[] = [];

    const emptyTables = stats.tables.filter((t) => t.rowCount === 0);
    if (emptyTables.length > 0) {
      items.push({
        type: 'info',
        icon: Info,
        title: t('databaseDashboard.insights.emptyTables'),
        description: t('databaseDashboard.insights.emptyTablesDesc', {
          count: emptyTables.length,
          tables: emptyTables
            .slice(0, 3)
            .map((t) => t.name)
            .join(', '),
        }),
      });
    }

    const tablesWithoutIndexes = stats.tables.filter(
      (t) => t.indexCount === 0 && t.rowCount > 100
    );
    if (tablesWithoutIndexes.length > 0) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: t('databaseDashboard.insights.missingIndexes'),
        description: t('databaseDashboard.insights.missingIndexesDesc', {
          count: tablesWithoutIndexes.length,
          tables: tablesWithoutIndexes
            .slice(0, 3)
            .map((t) => t.name)
            .join(', '),
        }),
      });
    }

    if (stats.tables.length > 0 && stats.totalRows > 0) {
      const largestTable = stats.tables[0];
      const percentage = (
        (largestTable.rowCount / stats.totalRows) *
        100
      ).toFixed(0);
      if (Number(percentage) > 50) {
        items.push({
          type: 'info',
          icon: Info,
          title: t('databaseDashboard.insights.largeTable'),
          description: t('databaseDashboard.insights.largeTableDesc', {
            table: largestTable.name,
            percentage,
          }),
        });
      }
    }

    if (items.length === 0) {
      items.push({
        type: 'success',
        icon: CheckCircle2,
        title: t('databaseDashboard.insights.healthy'),
        description: t('databaseDashboard.insights.healthyDesc'),
      });
    }

    return items;
  }, [stats, t]);

  return (
    <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle
          className="flex items-center gap-2"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
        >
          <div className="rounded-base bg-emerald-500/15 p-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          {t('databaseDashboard.insights.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <div
              key={insight.title}
              style={{ animationDelay: `${index * 75}ms` }}
              className={cn(
                'group/insight rounded-base border-border flex items-start gap-3 border-2 p-3.5',
                'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300',
                'transition-all hover:translate-x-0.5 hover:translate-y-0.5',
                insight.type === 'warning' && 'bg-amber-500/10',
                insight.type === 'info' && 'bg-blue-500/10',
                insight.type === 'success' && 'bg-green-500/10'
              )}
            >
              <div
                className={cn(
                  'rounded-base mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center',
                  'transition-transform duration-200 group-hover/insight:scale-110',
                  insight.type === 'warning' && 'bg-amber-500/15',
                  insight.type === 'info' && 'bg-blue-500/15',
                  insight.type === 'success' && 'bg-green-500/15'
                )}
              >
                <insight.icon
                  className={cn(
                    'h-4 w-4',
                    insight.type === 'warning' && 'text-amber-500',
                    insight.type === 'info' && 'text-blue-500',
                    insight.type === 'success' && 'text-green-500'
                  )}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className="leading-tight font-semibold"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {insight.title}
                </p>
                <p
                  className="text-muted-foreground leading-relaxed"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Main Dashboard View Component
export const DashboardView = memo(() => {
  const { t } = useTranslation('common');
  const { activeConnectionId, getConnection } = useConnectionStore();
  const connection = getConnection();

  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeDatabase = useCallback(async () => {
    if (!activeConnectionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const schemaResult = await sqlPro.database.getSchema(activeConnectionId);
      if (!schemaResult.success || !schemaResult.tables) {
        throw new Error(schemaResult.error || t('database.failedToGetSchema'));
      }

      const dataTypeMap = new Map<string, number>();

      for (const table of schemaResult.tables) {
        if (table.columns) {
          for (const col of table.columns) {
            const type = (col.type || 'UNKNOWN').toUpperCase();
            dataTypeMap.set(type, (dataTypeMap.get(type) || 0) + 1);
          }
        }
      }

      const tablePromises = schemaResult.tables.map(async (table) => {
        const [countResult, sizeResult] = await Promise.all([
          sqlPro.database.query(
            activeConnectionId,
            `SELECT COUNT(*) as count FROM "${table.name}"`
          ),
          sqlPro.database
            .query(
              activeConnectionId,
              `SELECT SUM(pgsize) as size FROM dbstat WHERE name = '${table.name}'`
            )
            .catch(() => ({ success: false, rows: [] })),
        ]);

        const rowCount =
          countResult.success && countResult.rows?.[0]
            ? (countResult.rows[0] as { count: number }).count
            : 0;

        const sizeBytes =
          sizeResult.success && sizeResult.rows?.[0]
            ? (sizeResult.rows[0] as { size: number | null }).size || 0
            : undefined;

        return {
          name: table.name,
          rowCount,
          columnCount: table.columns?.length || 0,
          indexCount: table.indexes?.length || 0,
          sizeBytes,
        } as TableStats;
      });

      const tables = await Promise.all(tablePromises);

      let totalRows = 0;
      let totalColumns = 0;
      let totalIndexes = 0;
      let totalSizeBytes = 0;

      for (const table of tables) {
        totalRows += table.rowCount;
        totalColumns += table.columnCount;
        totalIndexes += table.indexCount;
        if (table.sizeBytes) totalSizeBytes += table.sizeBytes;
      }

      const dataTypeDistribution = Array.from(dataTypeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        tableCount: tables.length,
        totalRows,
        totalColumns,
        totalIndexes,
        totalSizeBytes,
        tables: tables.sort((a, b) => b.rowCount - a.rowCount),
        dataTypeDistribution,
        analyzedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeConnectionId, t]);

  // Analyze on mount and when connection changes
  useEffect(() => {
    if (activeConnectionId && !stats) {
      analyzeDatabase();
    }
  }, [activeConnectionId, stats, analyzeDatabase]);

  // Reset stats when connection changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on connection change
    setStats(null);
  }, [activeConnectionId]);

  // Calculate max values for progress bars
  const maxRows = useMemo(
    () => Math.max(...(stats?.tables.map((t) => t.rowCount) || [0])),
    [stats]
  );
  const maxSize = useMemo(
    () => Math.max(...(stats?.tables.map((t) => t.sizeBytes || 0) || [0])),
    [stats]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border/50 flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 rounded-base p-2">
            <BarChart3 className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1
              className="font-semibold tracking-tight"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
            >
              {t('databaseDashboard.title')}
            </h1>
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {connection?.filename && (
                <Badge variant="secondary" className="mr-2">
                  {connection.filename}
                </Badge>
              )}
              {t('databaseDashboard.description')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeDatabase}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          {t('databaseDashboard.refresh')}
        </Button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Loading State */}
        {isLoading && !stats && (
          <div className="flex h-full flex-col items-center justify-center py-16">
            <div className="bg-primary/10 rounded-full p-5">
              <Loader2 className="text-primary h-10 w-10 animate-spin" />
            </div>
            <p className="text-muted-foreground mt-4 font-medium">
              {t('databaseDashboard.analyzing')}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="border-destructive bg-destructive/10 rounded-base flex items-center gap-3 border-2 p-4">
              <div className="bg-destructive/15 rounded-base p-2">
                <X className="text-destructive h-5 w-5" />
              </div>
              <span className="text-destructive flex-1 font-medium">
                {error}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeDatabase}
                className="hover:bg-destructive/10"
              >
                {t('databaseDashboard.retry')}
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {stats && (
          <Tabs
            defaultValue="overview"
            className="flex h-full min-h-0 flex-col px-6 pt-4"
          >
            <TabsList className="mb-4 w-fit shrink-0">
              <TabsTrigger value="overview">
                {t('databaseDashboard.overview')}
              </TabsTrigger>
              <TabsTrigger value="tables">
                {t('databaseDashboard.tables')}
              </TabsTrigger>
              <TabsTrigger value="charts">
                {t('databaseDashboard.charts')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="mt-0 min-h-0 flex-1 overflow-auto pb-6"
            >
              <div className="space-y-6">
                {/* Summary Stats - 5 columns for wider screen */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <StatCard
                    label={t('databaseDashboard.tablesLabel')}
                    value={stats.tableCount}
                    icon={Layers}
                    color="text-blue-500"
                    index={0}
                  />
                  <StatCard
                    label={t('databaseDashboard.totalRows')}
                    value={formatNumber(stats.totalRows)}
                    subValue={stats.totalRows.toLocaleString()}
                    icon={Hash}
                    color="text-green-500"
                    index={1}
                  />
                  <StatCard
                    label={t('databaseDashboard.columnsLabel')}
                    value={stats.totalColumns}
                    icon={FileText}
                    color="text-purple-500"
                    index={2}
                  />
                  <StatCard
                    label={t('databaseDashboard.indexesLabel')}
                    value={stats.totalIndexes}
                    icon={TrendingUp}
                    color="text-amber-500"
                    index={3}
                  />
                  <StatCard
                    label={t('databaseDashboard.totalSize')}
                    value={formatBytes(stats.totalSizeBytes)}
                    icon={HardDrive}
                    color="text-rose-500"
                    index={4}
                  />
                </div>

                {/* Quick Charts - side by side */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="group border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle
                        className="flex items-center gap-2"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                        }}
                      >
                        <div className="rounded-base bg-blue-500/15 p-1.5">
                          <Database className="h-4 w-4 text-blue-500" />
                        </div>
                        {t('databaseDashboard.topTablesByRowCount')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableSizeChart tables={stats.tables} height={320} />
                    </CardContent>
                  </Card>

                  <Card className="group border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle
                        className="flex items-center gap-2"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                        }}
                      >
                        <div className="rounded-base bg-purple-500/15 p-1.5">
                          <PieChart className="h-4 w-4 text-purple-500" />
                        </div>
                        {t('databaseDashboard.dataTypeDistribution')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTypeChart
                        distribution={stats.dataTypeDistribution}
                        height={280}
                      />
                    </CardContent>
                  </Card>
                </div>

                <InsightsCard stats={stats} />

                <div
                  className="flex items-center justify-center gap-2 text-center"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground/70 font-medium">
                    {t('databaseDashboard.lastAnalyzed')}:{' '}
                    <span className="text-muted-foreground">
                      {stats.analyzedAt.toLocaleString()}
                    </span>
                  </span>
                  <div className="bg-border h-px flex-1" />
                </div>
              </div>
            </TabsContent>

            {/* Tables Tab */}
            <TabsContent
              value="tables"
              className="mt-0 min-h-0 flex-1 overflow-auto pb-6"
            >
              <Card className="border-border/50 overflow-visible shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                    }}
                  >
                    <div className="rounded-base bg-indigo-500/15 p-1.5">
                      <Table2 className="h-4 w-4 text-indigo-500" />
                    </div>
                    {t('databaseDashboard.allTables')}
                  </CardTitle>
                  <CardDescription>
                    {t('databaseDashboard.allTablesDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {stats.tables.map((table, index) => (
                      <TableRow
                        key={table.name}
                        table={table}
                        maxRows={maxRows}
                        maxSize={maxSize}
                        index={index}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent
              value="charts"
              className="mt-0 min-h-0 flex-1 overflow-auto pb-6"
            >
              <div className="space-y-6">
                <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                      }}
                    >
                      <div className="rounded-base bg-blue-500/15 p-1.5">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                      </div>
                      {t('databaseDashboard.tableSizeComparison')}
                    </CardTitle>
                    <CardDescription>
                      {t('databaseDashboard.tableSizeComparisonDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableSizeChart tables={stats.tables} height={400} />
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                      }}
                    >
                      <div className="rounded-base bg-purple-500/15 p-1.5">
                        <PieChart className="h-4 w-4 text-purple-500" />
                      </div>
                      {t('databaseDashboard.columnTypeAnalysis')}
                    </CardTitle>
                    <CardDescription>
                      {t('databaseDashboard.columnTypeAnalysisDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTypeChart
                      distribution={stats.dataTypeDistribution}
                      height={320}
                    />
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle
                      className="flex items-center gap-2"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                      }}
                    >
                      <div className="rounded-base bg-cyan-500/15 p-1.5">
                        <Layers className="h-4 w-4 text-cyan-500" />
                      </div>
                      {t('databaseDashboard.dataTypeDetails')}
                    </CardTitle>
                    <CardDescription>
                      {t('databaseDashboard.dataTypeDetailsDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {stats.dataTypeDistribution.map((item, index) => (
                        <div
                          key={item.type}
                          style={{ animationDelay: `${index * 30}ms` }}
                          className={cn(
                            'group/type border-border rounded-base flex items-center gap-2 border-2 px-3 py-2',
                            'bg-muted/30',
                            'animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-200',
                            'transition-all hover:translate-x-0.5 hover:translate-y-0.5'
                          )}
                        >
                          <span
                            className="font-mono font-medium"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {item.type}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary shadow-sm transition-transform group-hover/type:scale-105"
                          >
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
});

export default DashboardView;

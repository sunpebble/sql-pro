/**
 * Database Dashboard Component
 *
 * A comprehensive dashboard that displays database statistics, table metrics,
 * storage analysis, and data distribution visualizations.
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
import { ScrollArea } from '@sqlpro/ui/scroll-area';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';

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

interface DatabaseDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId?: string;
  databaseName?: string;
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

// Stat card component
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: string;
}

const StatCard = memo(
  ({
    label,
    value,
    subValue,
    icon: Icon,
    color = 'text-primary',
  }: StatCardProps) => {
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl p-3',
          'from-background via-muted/30 to-muted/50 bg-gradient-to-br',
          'border-border/50 border',
          'shadow-sm hover:shadow-md',
          'transition-all duration-300 ease-out',
          'hover:border-border hover:scale-[1.02]'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            'bg-gradient-to-br from-transparent via-transparent to-current/[0.03]'
          )}
        />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              'rounded-lg p-2',
              'bg-gradient-to-br',
              'shadow-sm',
              'transition-transform duration-300 group-hover:scale-110',
              color === 'text-blue-500' &&
                'from-blue-500/15 to-blue-600/10 shadow-blue-500/10',
              color === 'text-green-500' &&
                'from-green-500/15 to-green-600/10 shadow-green-500/10',
              color === 'text-purple-500' &&
                'from-purple-500/15 to-purple-600/10 shadow-purple-500/10',
              color === 'text-amber-500' &&
                'from-amber-500/15 to-amber-600/10 shadow-amber-500/10',
              color === 'text-rose-500' &&
                'from-rose-500/15 to-rose-600/10 shadow-rose-500/10',
              color === 'text-primary' &&
                'from-primary/15 to-primary/10 shadow-primary/10'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 transition-all duration-300',
                color,
                'drop-shadow-sm'
              )}
            />
          </div>
          <div className="w-full space-y-0.5">
            <p className="text-lg leading-none font-bold tracking-tight whitespace-nowrap">
              {value}
            </p>
            {subValue && (
              <p className="text-muted-foreground/60 text-[10px] leading-none whitespace-nowrap">
                {subValue}
              </p>
            )}
            <p className="text-muted-foreground text-[10px] leading-tight font-medium whitespace-nowrap">
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
        'group flex items-center gap-4 rounded-xl border border-transparent p-3',
        'transition-all duration-200',
        'hover:border-border/50 hover:bg-muted/50 hover:scale-[1.01] hover:shadow-sm'
      )}
    >
      <div className="from-muted to-muted/50 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm transition-transform duration-200 group-hover:scale-105">
        <span className="text-muted-foreground text-sm font-semibold">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Table2 className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
          <span className="truncate font-medium">{table.name}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-4 text-xs">
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
            <div className="w-20">
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
          className="bg-primary/10 text-primary text-xs shadow-sm transition-transform group-hover:scale-105"
        >
          {table.indexCount} idx
        </Badge>
      </div>
    </div>
  );
});

// Table size bar chart component
interface TableSizeChartProps {
  tables: TableStats[];
}

const TableSizeChart = memo(({ tables }: TableSizeChartProps) => {
  const { t } = useTranslation('common');
  const chartData = useMemo(() => {
    return tables
      .filter((t) => t.rowCount > 0)
      .sort((a, b) => b.rowCount - a.rowCount)
      .slice(0, 10)
      .map((t) => ({
        name: t.name.length > 15 ? `${t.name.slice(0, 12)}...` : t.name,
        fullName: t.name,
        rows: t.rowCount,
        size: t.sizeBytes || 0,
      }));
  }, [tables]);

  if (chartData.length === 0) {
    return (
      <div className="border-border/50 bg-muted/20 flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
        <div className="bg-muted/50 rounded-full p-3">
          <BarChart3 className="text-muted-foreground/60 h-6 w-6" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          {t('databaseDashboard.noTableData')}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          width={100}
          tick={{ fontSize: 11 }}
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
              <div className="bg-popover border-border/50 rounded-xl border px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
                <p className="font-semibold">{data.fullName}</p>
                <p className="text-sm font-medium text-blue-500">
                  {data.rows?.toLocaleString()} {t('databaseDashboard.rows')}
                </p>
                {data.size && data.size > 0 && (
                  <p className="text-muted-foreground text-xs">
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

// Data type distribution pie chart
interface DataTypeChartProps {
  distribution: { type: string; count: number }[];
}

const DataTypeChart = memo(({ distribution }: DataTypeChartProps) => {
  const { t } = useTranslation('common');
  const chartData = useMemo(() => {
    // Group by category
    const categoryMap = new Map<string, number>();
    for (const item of distribution) {
      const category = getTypeCategory(item.type);
      categoryMap.set(category, (categoryMap.get(category) || 0) + item.count);
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
      <div className="border-border/50 bg-muted/20 flex h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
        <div className="bg-muted/50 rounded-full p-3">
          <PieChart className="text-muted-foreground/60 h-6 w-6" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">
          {t('databaseDashboard.noDataTypeInfo')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="55%" height={220}>
        <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
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
                <div className="bg-popover border-border/50 rounded-xl border px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
                  <p className="font-semibold">{data.name}</p>
                  <p className="text-muted-foreground text-sm">
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
      <div className="flex-1 space-y-2.5">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="group/legend hover:bg-muted/50 flex items-center gap-2.5 rounded-lg p-1.5 transition-all"
          >
            <div
              className="ring-background h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 transition-transform group-hover/legend:scale-125"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-muted-foreground ml-auto text-sm font-semibold tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

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
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 p-1.5 shadow-sm">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          {t('databaseDashboard.insights.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={insight.title}
              style={{ animationDelay: `${index * 75}ms` }}
              className={cn(
                'group/insight flex items-start gap-3 rounded-xl border p-3.5',
                'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-300',
                'transition-all hover:scale-[1.01]',
                insight.type === 'warning' &&
                  'border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent hover:border-amber-500/30',
                insight.type === 'info' &&
                  'border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent hover:border-blue-500/30',
                insight.type === 'success' &&
                  'border-green-500/20 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent hover:border-green-500/30'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  'transition-transform duration-200 group-hover/insight:scale-110',
                  insight.type === 'warning' &&
                    'bg-amber-500/15 shadow-sm shadow-amber-500/10',
                  insight.type === 'info' &&
                    'bg-blue-500/15 shadow-sm shadow-blue-500/10',
                  insight.type === 'success' &&
                    'bg-green-500/15 shadow-sm shadow-green-500/10'
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
                <p className="text-sm leading-tight font-semibold">
                  {insight.title}
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
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

// Main Dashboard Component
export const DatabaseDashboard = memo(
  ({
    open,
    onOpenChange,
    connectionId,
    databaseName,
  }: DatabaseDashboardProps) => {
    const { t } = useTranslation('common');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeDatabase = useCallback(async () => {
      if (!connectionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const schemaResult = await sqlPro.database.getSchema(connectionId);
        if (!schemaResult.success || !schemaResult.tables) {
          throw new Error(
            schemaResult.error || t('database.failedToGetSchema')
          );
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
              connectionId,
              `SELECT COUNT(*) as count FROM "${table.name}"`
            ),
            sqlPro.database
              .query(
                connectionId,
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
    }, [connectionId, t]);

    // Analyze on open
    useEffect(() => {
      if (open && connectionId && !stats) {
        analyzeDatabase();
      }
    }, [open, connectionId, stats, analyzeDatabase]);

    // Reset stats when connection changes
    useEffect(() => {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on connection change
      setStats(null);
    }, [connectionId]);

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('databaseDashboard.title')}
              {databaseName && (
                <Badge variant="secondary" className="ml-2">
                  {databaseName}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('databaseDashboard.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {isLoading && !stats && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="from-primary/10 to-primary/5 shadow-primary/5 rounded-full bg-gradient-to-br p-5 shadow-lg">
                <Loader2 className="text-primary h-10 w-10 animate-spin" />
              </div>
              <p className="text-muted-foreground mt-4 font-medium">
                {t('databaseDashboard.analyzing')}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border-destructive/30 from-destructive/10 via-destructive/5 flex items-center gap-3 rounded-xl border bg-gradient-to-r to-transparent p-4">
              <div className="bg-destructive/15 rounded-lg p-2">
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
          )}

          {/* Dashboard Content */}
          {stats && (
            <Tabs
              defaultValue="overview"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex shrink-0 items-center justify-between">
                <TabsList>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={analyzeDatabase}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')}
                  />
                  {t('databaseDashboard.refresh')}
                </Button>
              </div>

              {/* Overview Tab */}
              <TabsContent
                value="overview"
                className="mt-4 min-h-0 flex-1 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="space-y-6 p-1 pr-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-5 gap-3">
                      <StatCard
                        label={t('databaseDashboard.tablesLabel')}
                        value={stats.tableCount}
                        icon={Layers}
                        color="text-blue-500"
                      />
                      <StatCard
                        label={t('databaseDashboard.totalRows')}
                        value={formatNumber(stats.totalRows)}
                        subValue={stats.totalRows.toLocaleString()}
                        icon={Hash}
                        color="text-green-500"
                      />
                      <StatCard
                        label={t('databaseDashboard.columnsLabel')}
                        value={stats.totalColumns}
                        icon={FileText}
                        color="text-purple-500"
                      />
                      <StatCard
                        label={t('databaseDashboard.indexesLabel')}
                        value={stats.totalIndexes}
                        icon={TrendingUp}
                        color="text-amber-500"
                      />
                      <StatCard
                        label={t('databaseDashboard.totalSize')}
                        value={formatBytes(stats.totalSizeBytes)}
                        icon={HardDrive}
                        color="text-rose-500"
                      />
                    </div>

                    {/* Quick Charts */}
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="group border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div className="rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/10 p-1.5 shadow-sm">
                              <Database className="h-4 w-4 text-blue-500" />
                            </div>
                            {t('databaseDashboard.topTablesByRowCount')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <TableSizeChart tables={stats.tables} />
                        </CardContent>
                      </Card>

                      <Card className="group border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <div className="rounded-lg bg-gradient-to-br from-purple-500/15 to-purple-600/10 p-1.5 shadow-sm">
                              <PieChart className="h-4 w-4 text-purple-500" />
                            </div>
                            {t('databaseDashboard.dataTypeDistribution')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <DataTypeChart
                            distribution={stats.dataTypeDistribution}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <InsightsCard stats={stats} />

                    <div className="flex items-center justify-center gap-2 pb-2 text-center text-xs">
                      <div className="via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
                      <span className="text-muted-foreground/70 font-medium">
                        {t('databaseDashboard.lastAnalyzed')}:{' '}
                        <span className="text-muted-foreground">
                          {stats.analyzedAt.toLocaleString()}
                        </span>
                      </span>
                      <div className="via-border h-px flex-1 bg-gradient-to-r from-transparent to-transparent" />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tables Tab */}
              <TabsContent
                value="tables"
                className="mt-4 min-h-0 flex-1 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="pr-4">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="rounded-lg bg-gradient-to-br from-indigo-500/15 to-indigo-600/10 p-1.5 shadow-sm">
                            <Table2 className="h-4 w-4 text-indigo-500" />
                          </div>
                          {t('databaseDashboard.allTables')}
                        </CardTitle>
                        <CardDescription>
                          {t('databaseDashboard.allTablesDescription')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5">
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
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent
                value="charts"
                className="mt-4 min-h-0 flex-1 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="space-y-6 p-1 pr-4">
                    <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="rounded-lg bg-gradient-to-br from-blue-500/15 to-blue-600/10 p-1.5 shadow-sm">
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                          </div>
                          {t('databaseDashboard.tableSizeComparison')}
                        </CardTitle>
                        <CardDescription>
                          {t(
                            'databaseDashboard.tableSizeComparisonDescription'
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TableSizeChart tables={stats.tables} />
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="rounded-lg bg-gradient-to-br from-purple-500/15 to-purple-600/10 p-1.5 shadow-sm">
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
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 hover:border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <div className="rounded-lg bg-gradient-to-br from-cyan-500/15 to-cyan-600/10 p-1.5 shadow-sm">
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
                                'group/type border-border/50 flex items-center gap-2 rounded-xl border px-3 py-2',
                                'from-muted/50 via-muted/30 bg-gradient-to-br to-transparent',
                                'animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both duration-200',
                                'hover:border-border transition-all hover:scale-[1.02] hover:shadow-sm'
                              )}
                            >
                              <span className="font-mono text-sm font-medium">
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
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

export default DatabaseDashboard;

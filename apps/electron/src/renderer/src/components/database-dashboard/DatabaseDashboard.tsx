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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@sqlpro/ui/chart';
import { Progress } from '@sqlpro/ui/progress';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  BarChart3,
  Database,
  FileText,
  HardDrive,
  Hash,
  Layers,
  Loader2,
  PieChart,
  RefreshCw,
  Table2,
  TrendingUp,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
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

// Color palette for charts
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
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
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && (
              <p className="text-muted-foreground text-xs">{subValue}</p>
            )}
          </div>
          <div
            className={cn(
              'rounded-lg p-2',
              `${color.replace('text-', 'bg-')}/10`
            )}
          >
            <Icon className={cn('h-5 w-5', color)} />
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
  const rowPercent = maxRows > 0 ? (table.rowCount / maxRows) * 100 : 0;
  const sizePercent =
    maxSize > 0 && table.sizeBytes ? (table.sizeBytes / maxSize) * 100 : 0;

  return (
    <div className="hover:bg-muted/50 flex items-center gap-4 rounded-lg p-3 transition-colors">
      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-sm font-medium">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Table2 className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="truncate font-medium">{table.name}</span>
        </div>
        <div className="mt-1 flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            {table.rowCount.toLocaleString()} rows
          </span>
          <span className="text-muted-foreground">
            {table.columnCount} columns
          </span>
          {table.sizeBytes !== undefined && (
            <span className="text-muted-foreground">
              {formatBytes(table.sizeBytes)}
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <Progress value={rowPercent} className="h-1" />
          </div>
          {table.sizeBytes !== undefined && (
            <div className="w-20">
              <Progress
                value={sizePercent}
                className="h-1 bg-purple-100 dark:bg-purple-900"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Badge variant="secondary" className="text-xs">
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

  const chartConfig = {
    rows: {
      label: 'Row Count',
      color: 'hsl(var(--chart-1))',
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center">
        No table data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" tickFormatter={formatNumber} />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const payload = item.payload as
                  | { fullName?: string; size?: number }
                  | undefined;
                return (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{payload?.fullName}</span>
                    <span>{Number(value).toLocaleString()} rows</span>
                    {payload?.size && payload.size > 0 && (
                      <span className="text-muted-foreground">
                        {formatBytes(payload.size)}
                      </span>
                    )}
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="rows" fill="var(--color-rows)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
});

// Data type distribution pie chart
interface DataTypeChartProps {
  distribution: { type: string; count: number }[];
}

const DataTypeChart = memo(({ distribution }: DataTypeChartProps) => {
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
      <div className="text-muted-foreground flex h-64 items-center justify-center">
        No data type information available
      </div>
    );
  }

  return (
    <div className="flex h-64 items-center gap-4">
      <ResponsiveContainer width="60%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload;
              const percentage = ((data.value / total) * 100).toFixed(1);
              return (
                <div className="bg-background rounded-lg border px-3 py-2 shadow-lg">
                  <p className="font-medium">{data.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {data.value} columns ({percentage}%)
                  </p>
                </div>
              );
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-sm">{item.name}</span>
            <span className="text-muted-foreground ml-auto text-sm">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
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
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Analyze database and collect statistics
    const analyzeDatabase = useCallback(async () => {
      if (!connectionId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get schema information
        const schemaResult = await sqlPro.database.getSchema(connectionId);
        if (!schemaResult.success || !schemaResult.tables) {
          throw new Error(schemaResult.error || 'Failed to get schema');
        }

        const tables: TableStats[] = [];
        const dataTypeMap = new Map<string, number>();
        let totalRows = 0;
        let totalColumns = 0;
        let totalIndexes = 0;
        let totalSizeBytes = 0;

        // Analyze each table
        for (const table of schemaResult.tables) {
          // Count rows
          const countResult = await sqlPro.database.query(
            connectionId,
            `SELECT COUNT(*) as count FROM "${table.name}"`
          );
          const rowCount =
            countResult.success && countResult.rows?.[0]
              ? (countResult.rows[0] as { count: number }).count
              : 0;

          // Get column info
          const columnCount = table.columns?.length || 0;
          const indexCount = table.indexes?.length || 0;

          // Try to get table size (SQLite specific)
          let sizeBytes: number | undefined;
          try {
            const sizeResult = await sqlPro.database.query(
              connectionId,
              `SELECT SUM(pgsize) as size FROM dbstat WHERE name = '${table.name}'`
            );
            if (sizeResult.success && sizeResult.rows?.[0]) {
              sizeBytes =
                (sizeResult.rows[0] as { size: number | null }).size || 0;
            }
          } catch {
            // dbstat may not be available
          }

          tables.push({
            name: table.name,
            rowCount,
            columnCount,
            indexCount,
            sizeBytes,
          });

          totalRows += rowCount;
          totalColumns += columnCount;
          totalIndexes += indexCount;
          if (sizeBytes) totalSizeBytes += sizeBytes;

          // Count data types
          if (table.columns) {
            for (const col of table.columns) {
              const type = col.type.toUpperCase();
              dataTypeMap.set(type, (dataTypeMap.get(type) || 0) + 1);
            }
          }
        }

        // Convert data type map to array
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
    }, [connectionId]);

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
        <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Database Dashboard
              {databaseName && (
                <Badge variant="secondary" className="ml-2">
                  {databaseName}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Comprehensive overview of database statistics, table metrics, and
              data distribution.
            </DialogDescription>
          </DialogHeader>

          {/* Loading State */}
          {isLoading && !stats && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
              <p className="text-muted-foreground">Analyzing database...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-4">
              <X className="h-5 w-5" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={analyzeDatabase}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Dashboard Content */}
          {stats && (
            <Tabs defaultValue="overview" className="flex-1">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tables">Tables</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
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
                  Refresh
                </Button>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-5 gap-4">
                  <StatCard
                    label="Tables"
                    value={stats.tableCount}
                    icon={Layers}
                    color="text-blue-500"
                  />
                  <StatCard
                    label="Total Rows"
                    value={formatNumber(stats.totalRows)}
                    subValue={stats.totalRows.toLocaleString()}
                    icon={Hash}
                    color="text-green-500"
                  />
                  <StatCard
                    label="Columns"
                    value={stats.totalColumns}
                    icon={FileText}
                    color="text-purple-500"
                  />
                  <StatCard
                    label="Indexes"
                    value={stats.totalIndexes}
                    icon={TrendingUp}
                    color="text-amber-500"
                  />
                  <StatCard
                    label="Total Size"
                    value={formatBytes(stats.totalSizeBytes)}
                    icon={HardDrive}
                    color="text-rose-500"
                  />
                </div>

                {/* Quick Charts */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Database className="h-4 w-4" />
                        Top Tables by Row Count
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableSizeChart tables={stats.tables} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PieChart className="h-4 w-4" />
                        Data Type Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTypeChart
                        distribution={stats.dataTypeDistribution}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Analysis Info */}
                <div className="text-muted-foreground text-center text-xs">
                  Last analyzed: {stats.analyzedAt.toLocaleString()}
                </div>
              </TabsContent>

              {/* Tables Tab */}
              <TabsContent value="tables">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">All Tables</CardTitle>
                    <CardDescription>
                      Detailed statistics for each table in the database
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-1 pr-4">
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
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Table Size Comparison
                    </CardTitle>
                    <CardDescription>
                      Visual comparison of row counts across all tables
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TableSizeChart tables={stats.tables} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Column Type Analysis
                    </CardTitle>
                    <CardDescription>
                      Distribution of column data types across the database
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTypeChart distribution={stats.dataTypeDistribution} />
                  </CardContent>
                </Card>

                {/* Data Type Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Data Type Details
                    </CardTitle>
                    <CardDescription>
                      Breakdown of all column types in use
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {stats.dataTypeDistribution.map((item) => (
                        <div
                          key={item.type}
                          className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
                        >
                          <span className="font-mono text-sm">{item.type}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

export default DatabaseDashboard;

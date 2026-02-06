import type { QueryResult } from '@/types/database';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { BarChart3, LineChart, PieChart, Plus, TrendingUp } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'none';
  colorScheme: string;
}

interface ChartBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results?: QueryResult;
  onCreateChart?: (config: ChartConfig) => void;
}

const CHART_TYPES: {
  type: ChartType;
  icon: React.ElementType;
  labelKey: string;
}[] = [
  { type: 'bar', icon: BarChart3, labelKey: 'chartBuilder.barChart' },
  { type: 'line', icon: LineChart, labelKey: 'chartBuilder.lineChart' },
  { type: 'pie', icon: PieChart, labelKey: 'chartBuilder.pieChart' },
  { type: 'area', icon: TrendingUp, labelKey: 'chartBuilder.areaChart' },
];

const AGGREGATIONS = [
  { value: 'none', labelKey: 'chartBuilder.noneRawValues' },
  { value: 'count', labelKey: 'chartBuilder.count' },
  { value: 'sum', labelKey: 'chartBuilder.sum' },
  { value: 'avg', labelKey: 'chartBuilder.average' },
  { value: 'min', labelKey: 'chartBuilder.minimum' },
  { value: 'max', labelKey: 'chartBuilder.maximum' },
];

const COLOR_SCHEMES = [
  {
    value: 'default',
    labelKey: 'chartBuilder.default',
    colors: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'],
  },
  {
    value: 'cool',
    labelKey: 'chartBuilder.cool',
    colors: ['var(--chart-1)', 'var(--chart-4)', 'var(--chart-5)'],
  },
  {
    value: 'warm',
    labelKey: 'chartBuilder.warm',
    colors: ['var(--destructive)', 'var(--warning)', 'var(--chart-3)'],
  },
  {
    value: 'mono',
    labelKey: 'chartBuilder.monochrome',
    colors: ['var(--foreground)', 'var(--muted-foreground)', 'var(--border)'],
  },
];

const generateId = () =>
  `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ChartPreviewProps {
  config: ChartConfig;
  data: { label: string; value: number }[];
}

const ChartPreview = memo(({ config, data }: ChartPreviewProps) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors =
    COLOR_SCHEMES.find((s) => s.value === config.colorScheme)?.colors ||
    COLOR_SCHEMES[0].colors;

  if (config.type === 'pie') {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center justify-center py-4">
        <svg viewBox="0 0 100 100" className="h-48 w-48">
          {data.map((d, i) => {
            const percentage = d.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;

            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((currentAngle - 90) * Math.PI) / 180;

            // Reduce SVG coordinate precision for smaller output (rendering-svg-precision)
            const x1 = (50 + 40 * Math.cos(startRad)).toFixed(2);
            const y1 = (50 + 40 * Math.sin(startRad)).toFixed(2);
            const x2 = (50 + 40 * Math.cos(endRad)).toFixed(2);
            const y2 = (50 + 40 * Math.sin(endRad)).toFixed(2);

            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={`slice-${d.label}-${d.value}`}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[i % colors.length]}
                className="transition-opacity hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="ml-4 space-y-1">
          {data.slice(0, 5).map((d, idx) => (
            <div
              key={`legend-${d.label}`}
              className="flex items-center gap-2"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              <div
                className="h-3 w-3 rounded-md"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="truncate">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-48 items-end gap-1 px-4 py-2">
      {data.slice(0, 12).map((d, idx) => {
        const height = (d.value / maxValue) * 100;
        return (
          <div
            key={`bar-${d.label}`}
            className="group relative flex flex-1 flex-col items-center"
          >
            <div
              className={cn(
                'w-full transition-all duration-200',
                config.type === 'line'
                  ? 'rounded-full'
                  : 'rounded-t-sm group-hover:opacity-80'
              )}
              style={{
                height: `${height}%`,
                backgroundColor: colors[idx % colors.length],
                minHeight: '4px',
              }}
            />
            <span className="text-muted-foreground text-2xs mt-1 max-w-full truncate">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

export const ChartBuilder = memo(
  ({ open, onOpenChange, results, onCreateChart }: ChartBuilderProps) => {
    const { t } = useTranslation('common');
    const [config, setConfig] = useState<ChartConfig>(() => ({
      id: generateId(),
      type: 'bar',
      title: '',
      xAxis: '',
      yAxis: '',
      aggregation: 'count',
      colorScheme: 'default',
    }));

    const columns = useMemo(() => {
      if (!results?.columns) return [];
      return results.columns;
    }, [results?.columns]);

    // Auto-detect numeric columns for Y-axis
    const numericColumns = useMemo(() => {
      if (!results?.columns || !results?.rows?.length) return [];
      return results.columns.filter((col) => {
        const firstValue = results.rows[0]?.[col];
        return typeof firstValue === 'number';
      });
    }, [results?.columns, results?.rows]);

    // Generate preview data based on config
    const previewData = useMemo(() => {
      if (!results?.rows?.length || !config.xAxis) return [];

      const grouped = new Map<string, number[]>();

      for (const row of results.rows.slice(0, 100)) {
        const key = String(row[config.xAxis] ?? 'null');
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        if (config.yAxis && row[config.yAxis] !== undefined) {
          grouped.get(key)!.push(Number(row[config.yAxis]) || 0);
        } else {
          grouped.get(key)!.push(1);
        }
      }

      const data: { label: string; value: number }[] = [];
      grouped.forEach((values, label) => {
        let value: number;
        switch (config.aggregation) {
          case 'sum':
            value = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            value = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'min':
            value = Math.min(...values);
            break;
          case 'max':
            value = Math.max(...values);
            break;
          case 'count':
          default:
            value = values.length;
        }
        data.push({ label, value });
      });

      return data.sort((a, b) => b.value - a.value);
    }, [results?.rows, config.xAxis, config.yAxis, config.aggregation]);

    const handleCreate = useCallback(() => {
      if (onCreateChart && config.xAxis) {
        onCreateChart({
          ...config,
          id: generateId(),
          title:
            config.title ||
            `${config.xAxis} by ${config.yAxis || t('chartBuilder.count')}`,
        });
        onOpenChange(false);
      }
    }, [config, onCreateChart, onOpenChange, t]);

    const canCreate =
      config.xAxis && (config.yAxis || config.aggregation === 'count');

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('chartBuilder.title')}
            </DialogTitle>
            <DialogDescription>
              {t('chartBuilder.description')}
            </DialogDescription>
          </DialogHeader>

          {!results?.rows?.length ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <BarChart3 className="mb-4 h-12 w-12 opacity-30" />
              <p
                className="font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
              >
                {t('chartBuilder.noDataAvailable')}
              </p>
              <p style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                {t('chartBuilder.executeQueryFirst')}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Configuration */}
              <div className="space-y-4">
                {/* Chart Type */}
                <div className="space-y-2">
                  <Label>{t('chartBuilder.chartType')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {CHART_TYPES.map(({ type, icon: Icon, labelKey }) => (
                      <button
                        key={type}
                        onClick={() => setConfig({ ...config, type })}
                        className={cn(
                          'rounded-base flex flex-col items-center gap-1 border p-3 transition-colors',
                          config.type === type
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t(labelKey)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t('chartBuilder.chartTitle')}</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) =>
                      setConfig({ ...config, title: e.target.value })
                    }
                    placeholder={t('chartBuilder.chartTitlePlaceholder')}
                  />
                </div>

                {/* X-Axis */}
                <div className="space-y-2">
                  <Label>{t('chartBuilder.xAxis')}</Label>
                  <Select
                    value={config.xAxis}
                    onValueChange={(v) =>
                      v && setConfig({ ...config, xAxis: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('chartBuilder.selectColumn')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Y-Axis */}
                <div className="space-y-2">
                  <Label>{t('chartBuilder.yAxis')}</Label>
                  <Select
                    value={config.yAxis}
                    onValueChange={(v) =>
                      v && setConfig({ ...config, yAxis: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('chartBuilder.selectColumn')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {t('chartBuilder.useAggregationOnly')}
                      </SelectItem>
                      {numericColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aggregation */}
                <div className="space-y-2">
                  <Label>{t('chartBuilder.aggregation')}</Label>
                  <Select
                    value={config.aggregation}
                    onValueChange={(v) =>
                      v &&
                      setConfig({
                        ...config,
                        aggregation: v as ChartConfig['aggregation'],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGGREGATIONS.map((agg) => (
                        <SelectItem key={agg.value} value={agg.value}>
                          {t(agg.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Scheme */}
                <div className="space-y-2">
                  <Label>{t('chartBuilder.colorScheme')}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_SCHEMES.map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() =>
                          setConfig({ ...config, colorScheme: scheme.value })
                        }
                        className={cn(
                          'rounded-base flex flex-col items-center gap-1 border p-2 transition-colors',
                          config.colorScheme === scheme.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="flex gap-0.5">
                          {scheme.colors.map((color) => (
                            <div
                              key={color}
                              className="h-4 w-4 rounded-md"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t(scheme.labelKey)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>{t('chartBuilder.preview')}</Label>
                <div className="bg-muted/30 rounded-base flex min-h-[300px] flex-col border">
                  {previewData.length > 0 ? (
                    <>
                      <div className="border-b px-4 py-2 text-center font-medium">
                        {config.title || t('chartBuilder.chartPreview')}
                      </div>
                      <div className="flex-1">
                        <ChartPreview config={config} data={previewData} />
                      </div>
                      <div
                        className="text-muted-foreground border-t px-4 py-2 text-center"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {t('chartBuilder.showingDataPoints', {
                          count: previewData.length,
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground flex flex-1 items-center justify-center">
                      {t('chartBuilder.selectXAxisToPreview')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('chartBuilder.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!canCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('chartBuilder.createChart')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

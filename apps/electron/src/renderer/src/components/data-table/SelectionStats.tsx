import type { ColumnSchema } from '@/types/database';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SelectionStatsProps {
  /** Selected row data */
  selectedRows: Record<string, unknown>[];
  /** Column schemas for type detection */
  columns: ColumnSchema[];
  /** Additional className */
  className?: string;
}

interface QuickStats {
  count: number;
  sum: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  numericCount: number;
}

/**
 * Calculate quick statistics for selected numeric values
 */
function calculateQuickStats(
  selectedRows: Record<string, unknown>[],
  columns: ColumnSchema[]
): QuickStats {
  const numericTypes = [
    'integer',
    'int',
    'bigint',
    'smallint',
    'tinyint',
    'real',
    'float',
    'double',
    'decimal',
    'numeric',
    'number',
  ];

  const numericColumns = columns.filter((col) =>
    numericTypes.some((t) => col.type.toLowerCase().includes(t))
  );

  const numericValues: number[] = [];

  for (const row of selectedRows) {
    for (const col of numericColumns) {
      const value = row[col.name];
      if (value !== null && value !== undefined && value !== '') {
        const num = Number(value);
        if (!Number.isNaN(num) && Number.isFinite(num)) {
          numericValues.push(num);
        }
      }
    }
  }

  if (numericValues.length === 0) {
    return {
      count: selectedRows.length,
      sum: null,
      average: null,
      min: null,
      max: null,
      numericCount: 0,
    };
  }

  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const average = sum / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  return {
    count: selectedRows.length,
    sum,
    average,
    min,
    max,
    numericCount: numericValues.length,
  };
}

/**
 * Format a number for display
 */
function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  // Use fixed precision for decimals, but remove trailing zeros
  if (Math.abs(value) < 0.01 || Math.abs(value) >= 1e6) {
    return value.toExponential(2);
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Excel-like selection statistics bar.
 * Shows Sum, Average, Count, Min, Max when rows are selected.
 */
export function SelectionStats({
  selectedRows,
  columns,
  className,
}: SelectionStatsProps) {
  const stats = useMemo(
    () => calculateQuickStats(selectedRows, columns),
    [selectedRows, columns]
  );

  // Don't render if no selection
  if (selectedRows.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-muted/50 flex items-center gap-4 border-t px-4 py-1.5 text-xs',
        className
      )}
    >
      {/* Count - always show */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Count:</span>
        <span className="font-medium">{stats.count}</span>
      </div>

      {/* Numeric stats - only show if there are numeric values */}
      {stats.numericCount > 0 && (
        <>
          <div className="bg-border h-3 w-px" />

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Sum:</span>
            <span className="font-mono font-medium">
              {formatNumber(stats.sum!)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-mono font-medium">
              {formatNumber(stats.average!)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Min:</span>
            <span className="font-mono font-medium">
              {formatNumber(stats.min!)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Max:</span>
            <span className="font-mono font-medium">
              {formatNumber(stats.max!)}
            </span>
          </div>

          {stats.numericCount !== stats.count && (
            <>
              <div className="bg-border h-3 w-px" />
              <div className="text-muted-foreground">
                ({stats.numericCount} numeric values)
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

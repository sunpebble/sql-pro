import type { ColumnSchema } from '@/types/database';
import { Badge } from '@sqlpro/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@sqlpro/ui/popover';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Separator } from '@sqlpro/ui/separator';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface DataQualityIndicatorProps {
  columns: ColumnSchema[];
  data: Record<string, unknown>[];
  className?: string;
}

interface QualityIssue {
  column: string;
  type: 'null' | 'empty' | 'duplicate' | 'type-mismatch';
  count: number;
  percentage: number;
  severity: 'info' | 'warning' | 'error';
}

interface QualityScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: QualityIssue[];
  totalRows: number;
  totalColumns: number;
}

/**
 * Analyzes data quality and returns a score with issues
 */
function analyzeDataQuality(
  columns: ColumnSchema[],
  data: Record<string, unknown>[]
): QualityScore {
  const issues: QualityIssue[] = [];
  const totalRows = data.length;
  const totalColumns = columns.length;

  if (totalRows === 0) {
    return {
      score: 100,
      grade: 'A',
      issues: [],
      totalRows,
      totalColumns,
    };
  }

  let totalPenalty = 0;

  for (const col of columns) {
    const values = data.map((row) => row[col.name]);

    // Check for nulls
    const nullCount = values.filter(
      (v) => v === null || v === undefined
    ).length;
    const nullPercentage = (nullCount / totalRows) * 100;

    if (nullPercentage > 0) {
      const severity =
        nullPercentage > 50
          ? 'error'
          : nullPercentage > 20
            ? 'warning'
            : 'info';
      issues.push({
        column: col.name,
        type: 'null',
        count: nullCount,
        percentage: nullPercentage,
        severity,
      });
      totalPenalty +=
        severity === 'error' ? 10 : severity === 'warning' ? 5 : 1;
    }

    // Check for empty strings in text columns
    const typeLower = col.type.toLowerCase();
    if (
      typeLower.includes('text') ||
      typeLower.includes('char') ||
      typeLower.includes('varchar')
    ) {
      const emptyCount = values.filter(
        (v) => v !== null && v !== undefined && String(v).trim() === ''
      ).length;
      const emptyPercentage = (emptyCount / totalRows) * 100;

      if (emptyPercentage > 0) {
        const severity =
          emptyPercentage > 30
            ? 'warning'
            : emptyPercentage > 10
              ? 'info'
              : 'info';
        issues.push({
          column: col.name,
          type: 'empty',
          count: emptyCount,
          percentage: emptyPercentage,
          severity,
        });
        totalPenalty += severity === 'warning' ? 3 : 1;
      }
    }

    // Check for duplicates (if it's a primary key or unique-looking column)
    if (col.isPrimaryKey) {
      const uniqueValues = new Set(
        values.filter((v) => v !== null && v !== undefined)
      );
      const duplicateCount =
        values.filter((v) => v !== null && v !== undefined).length -
        uniqueValues.size;

      if (duplicateCount > 0) {
        issues.push({
          column: col.name,
          type: 'duplicate',
          count: duplicateCount,
          percentage: (duplicateCount / totalRows) * 100,
          severity: 'error',
        });
        totalPenalty += 15;
      }
    }
  }

  // Calculate score (max penalty capped at 100)
  const score = Math.max(0, 100 - Math.min(totalPenalty, 100));

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    issues: issues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    totalRows,
    totalColumns,
  };
}

/**
 * A compact data quality indicator that shows overall health
 */
export const DataQualityIndicator = memo(
  ({ columns, data, className }: DataQualityIndicatorProps) => {
    const { t } = useTranslation('table');
    const quality = useMemo(
      () => analyzeDataQuality(columns, data),
      [columns, data]
    );

    // Determine icon and badge variant based on grade
    const { icon: Icon, badgeVariant } = useMemo(() => {
      switch (quality.grade) {
        case 'A':
          return { icon: CheckCircle, badgeVariant: 'success' as const };
        case 'B':
          return { icon: CheckCircle, badgeVariant: 'info' as const };
        case 'C':
          return { icon: Info, badgeVariant: 'warning' as const };
        case 'D':
          return { icon: AlertCircle, badgeVariant: 'warning' as const };
        case 'F':
        default:
          return { icon: XCircle, badgeVariant: 'destructive' as const };
      }
    }, [quality.grade]);

    return (
      <Popover>
        <PopoverTrigger>
          <Badge
            variant={badgeVariant}
            className={cn('cursor-pointer gap-1.5', className)}
          >
            <Icon data-icon="inline-start" />
            {quality.grade}
            <span className="opacity-70">({quality.score}%)</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-64 gap-0 p-0">
          <PopoverHeader className="p-3">
            <div className="flex items-center justify-between">
              <PopoverTitle>{t('quality.title')}</PopoverTitle>
              <Badge variant={badgeVariant} className="text-base font-bold">
                {quality.grade}
              </Badge>
            </div>
            <PopoverDescription
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('quality.score', { score: quality.score })} •{' '}
              {t('quality.summary', {
                rows: quality.totalRows,
                columns: quality.totalColumns,
              })}
            </PopoverDescription>
          </PopoverHeader>

          <Separator />

          {quality.issues.length > 0 ? (
            <ScrollArea className="max-h-48">
              <div className="divide-y">
                {quality.issues.slice(0, 5).map((issue) => (
                  <div
                    key={`${issue.column}-${issue.type}`}
                    className="px-3 py-2"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {issue.severity === 'error' && (
                        <XCircle className="text-destructive h-3.5 w-3.5 shrink-0" />
                      )}
                      {issue.severity === 'warning' && (
                        <AlertCircle className="text-warning h-3.5 w-3.5 shrink-0" />
                      )}
                      {issue.severity === 'info' && (
                        <Info className="text-info h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="font-medium">{issue.column}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 ml-5">
                      {issue.type === 'null' &&
                        t('quality.issues.nullValues', {
                          count: issue.count,
                          percentage: issue.percentage.toFixed(1),
                        })}
                      {issue.type === 'empty' &&
                        t('quality.issues.emptyStrings', {
                          count: issue.count,
                          percentage: issue.percentage.toFixed(1),
                        })}
                      {issue.type === 'duplicate' &&
                        t('quality.issues.duplicateValues', {
                          count: issue.count,
                        })}
                    </div>
                  </div>
                ))}
              </div>
              {quality.issues.length > 5 && (
                <div
                  className="text-muted-foreground border-t px-3 py-2"
                  style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
                >
                  {t('quality.moreIssues', {
                    count: quality.issues.length - 5,
                  })}
                </div>
              )}
            </ScrollArea>
          ) : (
            <div
              className="text-muted-foreground flex flex-col items-center gap-1 p-4 text-center"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              <CheckCircle className="text-success h-5 w-5" />
              {t('quality.noIssues')}
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }
);

DataQualityIndicator.displayName = 'DataQualityIndicator';

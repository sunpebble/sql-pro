import type { DataComparisonResult, DiffType } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@sqlpro/ui/card';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Minus,
  Plus,
  TableIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDataDiffStore } from '@/stores/data-diff-store';

interface DataDiffSummaryProps {
  comparisonResult: DataComparisonResult;
  className?: string;
}

interface RowDiffCounts {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

/**
 * Summary panel showing row difference counts.
 * Provides an overview of data changes and allows filtering by clicking sections.
 */
export function DataDiffSummary({
  comparisonResult,
  className,
}: DataDiffSummaryProps) {
  const { t } = useTranslation();
  const { expandedRows, toggleSummaryExpanded, setDiffTypeFilter } =
    useDataDiffStore();

  const counts: RowDiffCounts = {
    added: comparisonResult.summary.rowsAdded,
    removed: comparisonResult.summary.rowsRemoved,
    modified: comparisonResult.summary.rowsModified,
    unchanged: comparisonResult.summary.rowsUnchanged,
  };

  const totalRows =
    counts.added + counts.removed + counts.modified + counts.unchanged;

  const handleCountClick = (diffType: DiffType) => {
    // Toggle the specific diff type filter
    setDiffTypeFilter(
      diffType as 'added' | 'removed' | 'modified' | 'unchanged',
      true
    );

    // Disable other filters
    const allDiffTypes: Array<'added' | 'removed' | 'modified' | 'unchanged'> =
      ['added', 'removed', 'modified', 'unchanged'];

    allDiffTypes.forEach((type) => {
      if (type !== diffType) {
        setDiffTypeFilter(type, false);
      }
    });
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={toggleSummaryExpanded}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t('diffFilter.rowComparisonSummary')}
          </CardTitle>
          {expandedRows.summary ? (
            <ChevronUp className="text-muted-foreground h-4 w-4" />
          ) : (
            <ChevronDown className="text-muted-foreground h-4 w-4" />
          )}
        </div>
      </CardHeader>

      {expandedRows.summary && (
        <CardContent className="space-y-4 pt-0">
          {/* Total Rows Info */}
          <div className="bg-muted/50 flex items-center gap-2 rounded-md p-3">
            <TableIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {t('diffFilter.totalRows')}
            </span>
            <span className="text-sm">{totalRows.toLocaleString()}</span>
            <span className="text-muted-foreground ml-auto text-xs">
              {t('diffFilter.sourceToTarget', {
                source: comparisonResult.summary.sourceRows.toLocaleString(),
                target: comparisonResult.summary.targetRows.toLocaleString(),
              })}
            </span>
          </div>

          {/* Diff Counts Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* Added */}
            {counts.added > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCountClick('added')}
                className="h-auto flex-col items-start gap-1 p-3 hover:bg-green-100 dark:hover:bg-green-950"
                title={t('diffFilter.filterAdded')}
              >
                <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs">{t('diffFilter.added')}</span>
                </div>
                <span className="text-foreground text-lg font-semibold">
                  {counts.added.toLocaleString()}
                </span>
              </Button>
            )}

            {/* Removed */}
            {counts.removed > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCountClick('removed')}
                className="h-auto flex-col items-start gap-1 p-3 hover:bg-red-100 dark:hover:bg-red-950"
                title={t('diffFilter.filterRemoved')}
              >
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300">
                  <Minus className="h-3.5 w-3.5" />
                  <span className="text-xs">{t('diffFilter.removed')}</span>
                </div>
                <span className="text-foreground text-lg font-semibold">
                  {counts.removed.toLocaleString()}
                </span>
              </Button>
            )}

            {/* Modified */}
            {counts.modified > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCountClick('modified')}
                className="h-auto flex-col items-start gap-1 p-3 hover:bg-amber-100 dark:hover:bg-amber-950"
                title={t('diffFilter.filterModified')}
              >
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-xs">{t('diffFilter.modified')}</span>
                </div>
                <span className="text-foreground text-lg font-semibold">
                  {counts.modified.toLocaleString()}
                </span>
              </Button>
            )}

            {/* Unchanged */}
            {counts.unchanged > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCountClick('unchanged')}
                className="h-auto flex-col items-start gap-1 p-3 hover:bg-blue-100 dark:hover:bg-blue-950"
                title={t('diffFilter.filterUnchanged')}
              >
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <span className="text-xs">{t('diffFilter.unchanged')}</span>
                </div>
                <span className="text-foreground text-lg font-semibold">
                  {counts.unchanged.toLocaleString()}
                </span>
              </Button>
            )}
          </div>

          {/* Change Summary Text */}
          <div className="text-muted-foreground text-xs">
            {counts.added + counts.removed + counts.modified === 0 ? (
              <p>{t('diffFilter.noDifferencesFound')}</p>
            ) : (
              <p>
                {counts.added + counts.removed + counts.modified === 1
                  ? t('diffFilter.rowHasDifferences', {
                      count: counts.added + counts.removed + counts.modified,
                      percent: (
                        ((counts.added + counts.removed + counts.modified) /
                          totalRows) *
                        100
                      ).toFixed(1),
                    })
                  : t('diffFilter.rowsHaveDifferences', {
                      count: counts.added + counts.removed + counts.modified,
                      percent: (
                        ((counts.added + counts.removed + counts.modified) /
                          totalRows) *
                        100
                      ).toFixed(1),
                    })}
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

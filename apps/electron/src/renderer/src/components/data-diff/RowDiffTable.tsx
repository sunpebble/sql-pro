import type { DataComparisonResult, RowDiff } from '@shared/types';
import { Badge } from '@quarry/ui/badge';
import { Button } from '@quarry/ui/button';
import { Input } from '@quarry/ui/input';
import { Separator } from '@quarry/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@quarry/ui/table';
import { Toggle } from '@quarry/ui/toggle';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileQuestion,
  Filter,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useDataDiffStore } from '@/stores/data-diff-store';

interface RowDiffTableProps {
  comparisonResult: DataComparisonResult;
  className?: string;
}

type DiffType = RowDiff['diffType'];

/**
 * Stable key for a row diff, derived from its primary key values.
 * Mirrors createRowKey in data-diff-store so store maps line up.
 */
function rowKeyOf(diff: RowDiff): string {
  return JSON.stringify(diff.primaryKey);
}

/**
 * Human-readable primary key, e.g. `id=1` or `a=1, b=2`.
 */
function formatPrimaryKey(primaryKey: Record<string, unknown>): string {
  const entries = Object.entries(primaryKey);
  if (entries.length === 0) return '—';
  return entries.map(([k, v]) => `${k}=${formatValue(v)}`).join(', ');
}

/**
 * Format a cell value for display, matching TableBody/DiffPreview conventions.
 */
function formatValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const diffTypeStyles: Record<
  DiffType,
  { row: string; badge: string; icon: React.ReactNode }
> = {
  added: {
    row: 'bg-green-50 dark:bg-green-950/40',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: <Plus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />,
  },
  removed: {
    row: 'bg-destructive/10',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icon: <Minus className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
  },
  modified: {
    row: 'bg-amber-50 dark:bg-amber-950/40',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    icon: <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
  },
  unchanged: {
    row: '',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: null,
  },
};

/**
 * Renders row-level data differences as a filterable, paginated table.
 * Modified rows can be expanded to show per-column before/after values.
 * Mirrors the schema-compare twin (SchemaDiffView/TableDiffCard) for styling.
 */
export function RowDiffTable({
  comparisonResult,
  className,
}: RowDiffTableProps) {
  const { t } = useTranslation('common');
  const {
    filters,
    pagination,
    expandedRows,
    setShowOnlyDifferences,
    setDiffTypeFilter,
    setSearchText,
    resetFilters,
    toggleRowExpanded,
    setCurrentPage,
  } = useDataDiffStore();

  const diffTypeLabel = (diffType: DiffType): string => {
    switch (diffType) {
      case 'added':
        return t('diffFilter.added');
      case 'removed':
        return t('diffFilter.removed');
      case 'modified':
        return t('diffFilter.modified');
      case 'unchanged':
      default:
        return t('diffFilter.unchanged');
    }
  };

  // Apply diff-type, show-only-differences and text filters.
  const filteredDiffs = useMemo(() => {
    let diffs = comparisonResult.rowDiffs;

    if (filters.showOnlyDifferences) {
      diffs = diffs.filter((d) => d.diffType !== 'unchanged');
    }

    diffs = diffs.filter((d) => filters.diffTypes[d.diffType]);

    const search = filters.searchText.trim().toLowerCase();
    if (search) {
      diffs = diffs.filter((d) => {
        const haystacks = [
          formatPrimaryKey(d.primaryKey),
          ...Object.values(d.sourceRow ?? {}).map(formatValue),
          ...Object.values(d.targetRow ?? {}).map(formatValue),
        ];
        return haystacks.some((h) => h.toLowerCase().includes(search));
      });
    }

    return diffs;
  }, [comparisonResult.rowDiffs, filters]);

  // Pagination over the filtered set (store keeps the canonical page index).
  const pageSize = pagination.pageSize || 100;
  const totalPages = Math.max(1, Math.ceil(filteredDiffs.length / pageSize));
  const currentPage = Math.min(pagination.currentPage, totalPages - 1);
  const pageStart = currentPage * pageSize;
  const pagedDiffs = filteredDiffs.slice(pageStart, pageStart + pageSize);

  const hasActiveFilters =
    filters.showOnlyDifferences ||
    !filters.diffTypes.added ||
    !filters.diffTypes.removed ||
    !filters.diffTypes.modified ||
    !filters.diffTypes.unchanged ||
    filters.searchText.trim() !== '';

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter bar */}
      <div className="border-border bg-muted/30 rounded-base flex flex-wrap items-center gap-3 border p-3">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <Toggle
            pressed={filters.showOnlyDifferences}
            onPressedChange={setShowOnlyDifferences}
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.onlyDifferences')}
            title={t('diffFilter.toggleOnlyDiff')}
          >
            {t('diffFilter.onlyDifferences')}
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <span
            className="text-muted-foreground font-medium"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {t('diffFilter.rowType')}
          </span>
          <div className="flex gap-1">
            <Toggle
              pressed={filters.diffTypes.added}
              onPressedChange={(pressed) => setDiffTypeFilter('added', pressed)}
              variant="outline"
              size="sm"
              aria-label={t('diffFilter.filterAdded')}
              title={t('diffFilter.filterAdded')}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span>{t('diffFilter.added')}</span>
            </Toggle>
            <Toggle
              pressed={filters.diffTypes.removed}
              onPressedChange={(pressed) =>
                setDiffTypeFilter('removed', pressed)
              }
              variant="outline"
              size="sm"
              aria-label={t('diffFilter.filterRemoved')}
              title={t('diffFilter.filterRemoved')}
              className="gap-1.5"
            >
              <Minus className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span>{t('diffFilter.removed')}</span>
            </Toggle>
            <Toggle
              pressed={filters.diffTypes.modified}
              onPressedChange={(pressed) =>
                setDiffTypeFilter('modified', pressed)
              }
              variant="outline"
              size="sm"
              aria-label={t('diffFilter.filterModified')}
              title={t('diffFilter.filterModified')}
              className="gap-1.5"
            >
              <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t('diffFilter.modified')}</span>
            </Toggle>
            <Toggle
              pressed={filters.diffTypes.unchanged}
              onPressedChange={(pressed) =>
                setDiffTypeFilter('unchanged', pressed)
              }
              variant="outline"
              size="sm"
              aria-label={t('diffFilter.filterUnchanged')}
              title={t('diffFilter.filterUnchanged')}
              className="gap-1.5"
            >
              <span>{t('diffFilter.unchanged')}</span>
            </Toggle>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="relative min-w-50 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            data-testid="row-diff-search"
            placeholder={t('diffFilter.searchByColumnValues')}
            value={filters.searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 w-full pr-8 pl-8"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            title={t('diffFilter.searchShortcut')}
          />
          {filters.searchText && (
            <button
              type="button"
              onClick={() => setSearchText('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              title={t('diffFilter.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-2"
              title={t('diffFilter.resetShortcut')}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('diffFilter.reset')}</span>
            </Button>
          </>
        )}
      </div>

      {/* Empty state */}
      {filteredDiffs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileQuestion className="text-muted-foreground mb-4 h-12 w-12 opacity-30" />
          <p className="text-muted-foreground font-medium">
            {t('rowDiff.noRowsFound', 'No rows match the current filters')}
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {hasActiveFilters
              ? t('schemaDiff.tryAdjustingFilters')
              : t('diffFilter.noDifferencesFound')}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-28">
                  {t('diffFilter.rowType')}
                </TableHead>
                <TableHead>
                  {t('rowDiff.primaryKeyHeader', 'Primary Key')}
                </TableHead>
                <TableHead>{t('rowDiff.changesHeader', 'Changes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDiffs.map((diff) => (
                <RowDiffRow
                  key={rowKeyOf(diff)}
                  diff={diff}
                  isExpanded={expandedRows.rows.get(rowKeyOf(diff)) ?? false}
                  onToggle={() => toggleRowExpanded(rowKeyOf(diff))}
                  label={diffTypeLabel(diff.diffType)}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              <span className="text-muted-foreground">
                {t('rowDiff.pageInfo', 'Page {{page}} of {{total}}', {
                  page: currentPage + 1,
                  total: totalPages,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={currentPage <= 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('rowDiff.previous', 'Previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  {t('rowDiff.next', 'Next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface RowDiffRowProps {
  diff: RowDiff;
  isExpanded: boolean;
  onToggle: () => void;
  label: string;
}

function RowDiffRow({ diff, isExpanded, onToggle, label }: RowDiffRowProps) {
  const { t } = useTranslation('common');
  const style = diffTypeStyles[diff.diffType];
  const isModified = diff.diffType === 'modified';
  const canExpand = isModified && (diff.columnChanges?.length ?? 0) > 0;

  const changesSummary = (): string => {
    switch (diff.diffType) {
      case 'modified':
        return t('rowDiff.columnsChanged', '{{count}} columns changed', {
          count: diff.columnChanges?.length ?? 0,
        });
      case 'added':
        return t('rowDiff.rowAdded', 'Row exists in source only');
      case 'removed':
        return t('rowDiff.rowRemoved', 'Row exists in target only');
      case 'unchanged':
      default:
        return t('diffFilter.noDifferences');
    }
  };

  return (
    <>
      <TableRow
        className={cn(style.row, canExpand && 'cursor-pointer')}
        onClick={canExpand ? onToggle : undefined}
      >
        <TableCell className="align-top">
          {canExpand &&
            (isExpanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            ))}
        </TableCell>
        <TableCell className="align-top">
          <Badge
            variant="secondary"
            className={cn('gap-1', style.badge)}
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {style.icon}
            {label}
          </Badge>
        </TableCell>
        <TableCell
          className="align-top font-medium"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {formatPrimaryKey(diff.primaryKey)}
        </TableCell>
        <TableCell
          className="text-muted-foreground align-top"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {changesSummary()}
        </TableCell>
      </TableRow>

      {/* Expanded per-column before/after for modified rows */}
      {canExpand && isExpanded && (
        <TableRow className={style.row}>
          <TableCell />
          <TableCell colSpan={3} className="pt-0">
            <div className="bg-background/50 rounded-base space-y-1 border p-2">
              {diff.columnChanges?.map((change) => (
                <div
                  key={change.columnName}
                  className="flex flex-wrap items-center gap-2"
                  style={{
                    fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                  }}
                >
                  <span className="font-medium">{change.columnName}</span>
                  <span className="text-red-700 line-through dark:text-red-300">
                    {formatValue(change.sourceValue)}
                  </span>
                  <ChevronRight className="text-muted-foreground h-3 w-3" />
                  <span className="text-green-700 dark:text-green-300">
                    {formatValue(change.targetValue)}
                  </span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

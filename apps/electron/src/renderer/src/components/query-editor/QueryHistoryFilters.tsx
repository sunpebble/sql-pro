import type { QueryHistoryStatus } from '@/stores/query-history-store';
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
import { Calendar, FilterX } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQueryHistoryStore } from '@/stores/query-history-store';

interface QueryHistoryFiltersProps {
  className?: string;
}

/**
 * Filter toolbar component for query history.
 * Provides status dropdown and date range picker for filtering query history.
 */
export const QueryHistoryFilters = memo(
  ({ className }: QueryHistoryFiltersProps) => {
    const { t } = useTranslation('common');
    const filter = useQueryHistoryStore((state) => state.filter);
    const setFilter = useQueryHistoryStore((state) => state.setFilter);
    const clearFilters = useQueryHistoryStore((state) => state.clearFilters);
    const getActiveFilterCount = useQueryHistoryStore(
      (state) => state.getActiveFilterCount
    );

    const activeFilterCount = getActiveFilterCount();

    const handleStatusChange = useCallback(
      (value: string | null) => {
        if (value) {
          setFilter({ status: value as QueryHistoryStatus });
        }
      },
      [setFilter]
    );

    const handleStartDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const start = e.target.value || undefined;
        setFilter({
          dateRange: {
            ...filter.dateRange,
            start,
          },
        });
      },
      [filter.dateRange, setFilter]
    );

    const handleEndDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const end = e.target.value || undefined;
        setFilter({
          dateRange: {
            ...filter.dateRange,
            end,
          },
        });
      },
      [filter.dateRange, setFilter]
    );

    const handleClearFilters = useCallback(() => {
      clearFilters();
    }, [clearFilters]);

    return (
      <div
        className={cn('flex flex-wrap items-end gap-3 px-3 py-2', className)}
        role="toolbar"
        aria-label={t('queryEditor.historyFilters.toolbar')}
      >
        {/* Status Filter */}
        <div className="flex min-w-[120px] flex-col gap-1">
          <Label
            htmlFor="status-filter"
            className="text-muted-foreground text-xs"
          >
            {t('queryEditor.historyFilters.status')}
          </Label>
          <Select
            value={filter.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger
              id="status-filter"
              size="sm"
              className="h-8 w-full"
              aria-label={t('queryEditor.historyFilters.status')}
            >
              <SelectValue placeholder={t('queryEditor.historyFilters.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('queryEditor.historyFilters.all')}
              </SelectItem>
              <SelectItem value="success">
                {t('queryEditor.historyFilters.success')}
              </SelectItem>
              <SelectItem value="failed">
                {t('queryEditor.historyFilters.failed')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="start-date-filter"
              className="text-muted-foreground flex items-center gap-1 text-xs"
            >
              <Calendar className="h-3 w-3" />
              {t('queryEditor.historyFilters.from')}
            </Label>
            <Input
              id="start-date-filter"
              type="date"
              value={filter.dateRange?.start || ''}
              onChange={handleStartDateChange}
              className="h-8 w-[130px] text-xs"
              aria-label={t('queryEditor.historyFilters.from')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="end-date-filter"
              className="text-muted-foreground text-xs"
            >
              {t('queryEditor.historyFilters.to')}
            </Label>
            <Input
              id="end-date-filter"
              type="date"
              value={filter.dateRange?.end || ''}
              onChange={handleEndDateChange}
              className="h-8 w-[130px] text-xs"
              aria-label={t('queryEditor.historyFilters.to')}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 gap-1 text-xs"
            aria-label={t('queryEditor.historyFilters.clearCount', {
              count: activeFilterCount,
            })}
          >
            <FilterX className="h-3.5 w-3.5" />
            {t('queryEditor.historyFilters.clearCount', {
              count: activeFilterCount,
            })}
          </Button>
        )}
      </div>
    );
  }
);

QueryHistoryFilters.displayName = 'QueryHistoryFilters';

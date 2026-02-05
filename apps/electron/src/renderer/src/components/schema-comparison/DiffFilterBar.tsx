import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Separator } from '@sqlpro/ui/separator';
import { Toggle } from '@sqlpro/ui/toggle';
import {
  Columns,
  Database,
  Edit,
  Filter,
  Hash,
  Link,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSchemaComparisonStore } from '@/stores/schema-comparison-store';

interface DiffFilterBarProps {
  className?: string;
}

/**
 * Toolbar with filters to show/hide different types of changes.
 * Provides filtering by change type, object type, and text search.
 */
export function DiffFilterBar({ className }: DiffFilterBarProps) {
  const {
    filters,
    setShowOnlyDifferences,
    setChangeTypeFilter,
    setObjectTypeFilter,
    setSearchText,
    resetFilters,
  } = useSchemaComparisonStore();

  const { t } = useTranslation('common');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  // Check if any filters are active (non-default state)
  const hasActiveFilters =
    filters.showOnlyDifferences ||
    !filters.changeTypes.added ||
    !filters.changeTypes.removed ||
    !filters.changeTypes.modified ||
    !filters.objectTypes.tables ||
    !filters.objectTypes.columns ||
    !filters.objectTypes.indexes ||
    !filters.objectTypes.triggers ||
    !filters.objectTypes.foreignKeys ||
    filters.searchText.trim() !== '';

  return (
    <div
      className={cn(
        'border-border bg-muted/30 rounded-base flex flex-wrap items-center gap-3 border-2 p-3',
        className
      )}
    >
      {/* Show Only Differences Toggle */}
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

      {/* Change Type Filters */}
      <div className="flex items-center gap-2">
        <span
          className="text-muted-foreground font-medium"
          style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
        >
          {t('diffFilter.changeType')}
        </span>
        <div className="flex gap-1">
          <Toggle
            pressed={filters.changeTypes.added}
            onPressedChange={(pressed) => setChangeTypeFilter('added', pressed)}
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showAddedItems')}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span>{t('diffFilter.added')}</span>
          </Toggle>
          <Toggle
            pressed={filters.changeTypes.removed}
            onPressedChange={(pressed) =>
              setChangeTypeFilter('removed', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showRemovedItems')}
            className="gap-1.5"
          >
            <Minus className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            <span>{t('diffFilter.removed')}</span>
          </Toggle>
          <Toggle
            pressed={filters.changeTypes.modified}
            onPressedChange={(pressed) =>
              setChangeTypeFilter('modified', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showModifiedItems')}
            className="gap-1.5"
          >
            <Edit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t('diffFilter.modified')}</span>
          </Toggle>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Object Type Filters */}
      <div className="flex items-center gap-2">
        <span
          className="text-muted-foreground font-medium"
          style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
        >
          {t('diffFilter.show')}
        </span>
        <div className="flex gap-1">
          <Toggle
            pressed={filters.objectTypes.tables}
            onPressedChange={(pressed) =>
              setObjectTypeFilter('tables', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showTables')}
            className="gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            <span>{t('diffFilter.tables')}</span>
          </Toggle>
          <Toggle
            pressed={filters.objectTypes.columns}
            onPressedChange={(pressed) =>
              setObjectTypeFilter('columns', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showColumns')}
            className="gap-1.5"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>{t('diffFilter.columns')}</span>
          </Toggle>
          <Toggle
            pressed={filters.objectTypes.indexes}
            onPressedChange={(pressed) =>
              setObjectTypeFilter('indexes', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showIndexes')}
            className="gap-1.5"
          >
            <Hash className="h-3.5 w-3.5" />
            <span>{t('diffFilter.indexes')}</span>
          </Toggle>
          <Toggle
            pressed={filters.objectTypes.foreignKeys}
            onPressedChange={(pressed) =>
              setObjectTypeFilter('foreignKeys', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showForeignKeys')}
            className="gap-1.5"
          >
            <Link className="h-3.5 w-3.5" />
            <span>{t('diffFilter.foreignKeys')}</span>
          </Toggle>
          <Toggle
            pressed={filters.objectTypes.triggers}
            onPressedChange={(pressed) =>
              setObjectTypeFilter('triggers', pressed)
            }
            variant="outline"
            size="sm"
            aria-label={t('diffFilter.showTriggers')}
            className="gap-1.5"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{t('diffFilter.triggers')}</span>
          </Toggle>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Search Input */}
      <div className="relative min-w-50 flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          data-testid="diff-filter-search"
          placeholder={t('diffFilter.searchPlaceholder')}
          value={filters.searchText}
          onChange={handleSearchChange}
          className="h-8 w-full pr-8 pl-8"
          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
          title={t('diffFilter.searchShortcut')}
        />
        {filters.searchText && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            title={t('diffFilter.clearSearch')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="gap-2"
            title={t('diffFilter.resetShortcut')}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{t('diffFilter.reset')}</span>
          </Button>
        </>
      )}
    </div>
  );
}

import type { TableRowData } from './data-table';
import type {
  ColumnSchema,
  QueryResult,
  QueryResultSet,
} from '@/types/database';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DataTable } from './data-table';

interface QueryResultsProps {
  results: QueryResult;
}

interface SingleResultTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

const SingleResultTable = memo<SingleResultTableProps>(({ columns, rows }) => {
  const { t } = useTranslation('common');
  // Convert simple column names to ColumnSchema objects for DataTable
  const tableColumns = useMemo<ColumnSchema[]>(() => {
    return columns.map((colName) => ({
      name: colName,
      type: 'TEXT', // Generic type for query results
      nullable: true,
      defaultValue: null,
      isPrimaryKey: false,
    }));
  }, [columns]);

  // Convert rows to TableRowData format (add __rowId)
  const data = useMemo<TableRowData[]>(() => {
    return rows.map((row, index) => ({
      ...row,
      __rowId: index,
    }));
  }, [rows]);

  if (columns.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>{t('queryResults.noResultsToDisplay')}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={tableColumns}
      data={data}
      editable={false}
      className="h-full"
    />
  );
});
SingleResultTable.displayName = 'SingleResultTable';

export function QueryResults({ results }: QueryResultsProps) {
  const { t } = useTranslation('common');
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  // Check if we have multiple result sets
  const hasMultipleResults =
    results.resultSets && results.resultSets.length > 1;

  // Get the result sets to display
  const resultSets: QueryResultSet[] = useMemo(() => {
    if (results.resultSets && results.resultSets.length > 0) {
      return results.resultSets;
    }
    // Fall back to single result format
    return [{ columns: results.columns, rows: results.rows }];
  }, [results]);

  // Handle case where no results
  if (
    resultSets.length === 0 ||
    (resultSets.length === 1 && resultSets[0].columns.length === 0)
  ) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>{t('queryResults.noResultsToDisplay')}</p>
      </div>
    );
  }

  // Single result set - show directly
  if (!hasMultipleResults) {
    return (
      <SingleResultTable
        columns={resultSets[0].columns}
        rows={resultSets[0].rows}
      />
    );
  }

  // Multiple result sets - show with tabs
  const activeResult = resultSets[activeResultIndex] || resultSets[0];

  return (
    <div className="flex h-full flex-col">
      {/* Result Set Tabs */}
      <div
        className="bg-muted flex items-center gap-1 overflow-x-auto border-b-2 px-2 py-1"
        role="tablist"
        aria-label={t('queryResults.resultSets')}
      >
        {resultSets.map((resultSet, index) => (
          <button
            type="button"
            key={`result-${resultSet.columns.join(',')}-${resultSet.rows.length}`}
            onClick={() => setActiveResultIndex(index)}
            className={cn(
              'rounded-base font-base flex items-center gap-1.5 px-3 py-1 transition-colors',
              activeResultIndex === index
                ? 'bg-background text-foreground shadow-shadow-sm border-2'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            )}
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            role="tab"
            aria-selected={activeResultIndex === index}
            aria-controls={`result-panel-${index}`}
            id={`result-tab-${index}`}
          >
            <span>{t('queryResults.result', { index: index + 1 })}</span>
            <span className="text-muted-foreground/70">
              ({resultSet.rows.length}{' '}
              {t('table.rows', { defaultValue: 'rows' })})
            </span>
          </button>
        ))}
      </div>

      {/* Active Result Table */}
      <div
        className="min-h-0 flex-1"
        role="tabpanel"
        id={`result-panel-${activeResultIndex}`}
        aria-labelledby={`result-tab-${activeResultIndex}`}
      >
        <SingleResultTable
          columns={activeResult.columns}
          rows={activeResult.rows}
        />
      </div>
    </div>
  );
}

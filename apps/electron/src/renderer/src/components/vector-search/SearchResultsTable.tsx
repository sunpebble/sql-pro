import type { VectorSearchResult } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@sqlpro/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { FileJson, Hash, Search } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface SearchResultsTableProps {
  /** Search results to display */
  results: VectorSearchResult[];
  /** Callback when "Find Similar" is clicked for a point */
  onSelectPoint?: (id: string | number) => void;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Format a payload value for display in the table cell
 */
function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    // Truncate long strings
    return value.length > 50 ? `${value.slice(0, 50)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return '{...}';
  }
  return String(value);
}

/**
 * Format the full payload value for tooltip display
 */
function formatPayloadValueFull(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Extract unique payload keys from all results
 */
function extractPayloadColumns(results: VectorSearchResult[]): string[] {
  const keysSet = new Set<string>();
  for (const result of results) {
    if (result.payload) {
      for (const key of Object.keys(result.payload)) {
        keysSet.add(key);
      }
    }
  }
  return Array.from(keysSet).sort();
}

/**
 * Table cell for payload values with optional tooltip for long content
 */
const PayloadCell = memo(
  ({ value, columnName }: { value: unknown; columnName: string }) => {
    const displayValue = formatPayloadValue(value);
    const fullValue = formatPayloadValueFull(value);
    const needsTooltip =
      typeof value === 'object' ||
      (typeof value === 'string' && value.length > 50);

    if (!needsTooltip) {
      return (
        <span className="text-muted-foreground text-xs">{displayValue}</span>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="text-muted-foreground cursor-help text-xs underline decoration-dotted">
            {displayValue}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-md">
          <div className="space-y-1">
            <p className="text-xs font-medium">{columnName}</p>
            <pre className="max-h-48 overflow-auto text-xs whitespace-pre-wrap">
              {fullValue}
            </pre>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
);

PayloadCell.displayName = 'PayloadCell';

/**
 * SearchResultsTable displays vector search results in a table format.
 *
 * Features:
 * - Displays score and ID columns
 * - Dynamically detects and displays payload columns
 * - "Find Similar" action button for each row
 * - Tooltips for complex/long payload values
 */
export const SearchResultsTable = memo(
  ({ results, onSelectPoint, className }: SearchResultsTableProps) => {
    const { t } = useTranslation('common');

    // Extract payload columns from results
    const payloadColumns = useMemo(
      () => extractPayloadColumns(results),
      [results]
    );

    // Handle find similar click
    const handleFindSimilar = (id: string | number) => {
      onSelectPoint?.(id);
    };

    if (results.length === 0) {
      return (
        <div
          className={cn(
            'text-muted-foreground flex flex-col items-center justify-center gap-2 p-8',
            className
          )}
        >
          <Search className="h-10 w-10 opacity-20" />
          <p className="text-sm">
            {t(
              'vectorSearch.noResults',
              'Enter a query to search for similar vectors'
            )}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className={cn('h-full', className)}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Rank column */}
              <TableHead className="text-muted-foreground w-12 text-center text-xs">
                #
              </TableHead>
              {/* Score column */}
              <TableHead className="w-24">
                <span className="text-muted-foreground text-xs font-medium">
                  {t('vectorSearch.columns.score', 'Score')}
                </span>
              </TableHead>
              {/* ID column */}
              <TableHead className="w-40">
                <div className="flex items-center gap-1.5">
                  <Hash className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-xs font-medium">
                    {t('vectorSearch.columns.id', 'ID')}
                  </span>
                </div>
              </TableHead>
              {/* Payload columns */}
              {payloadColumns.map((column) => (
                <TableHead key={column}>
                  <div className="flex items-center gap-1.5">
                    <FileJson className="text-muted-foreground h-3 w-3" />
                    <span className="text-muted-foreground text-xs font-medium">
                      {column}
                    </span>
                  </div>
                </TableHead>
              ))}
              {/* Actions column */}
              <TableHead className="w-28">
                <span className="text-muted-foreground text-xs font-medium">
                  {t('vectorSearch.columns.actions', 'Actions')}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={String(result.id)}>
                {/* Rank */}
                <TableCell className="text-muted-foreground text-center text-xs">
                  {index + 1}
                </TableCell>
                {/* Score */}
                <TableCell>
                  <span
                    className={cn(
                      'font-mono text-xs font-medium',
                      result.score >= 0.9
                        ? 'text-green-600 dark:text-green-400'
                        : result.score >= 0.7
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-muted-foreground'
                    )}
                  >
                    {result.score.toFixed(4)}
                  </span>
                </TableCell>
                {/* ID */}
                <TableCell>
                  <span className="font-mono text-xs">{String(result.id)}</span>
                </TableCell>
                {/* Payload columns */}
                {payloadColumns.map((column) => (
                  <TableCell key={column}>
                    <PayloadCell
                      value={result.payload?.[column]}
                      columnName={column}
                    />
                  </TableCell>
                ))}
                {/* Actions */}
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFindSimilar(result.id)}
                        className="h-7 gap-1.5 px-2 text-xs"
                      >
                        <Search className="h-3 w-3" />
                        {t('vectorSearch.findSimilar', 'Similar')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      {t(
                        'vectorSearch.findSimilarTooltip',
                        'Find vectors similar to this point'
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }
);

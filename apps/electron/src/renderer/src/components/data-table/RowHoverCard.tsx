import type { TableRowData } from './hooks/useTableCore';
import type { ColumnSchema } from '@/types/database';
import { Button } from '@sqlpro/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@sqlpro/ui/hover-card';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Copy, Maximize2 } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface RowHoverCardProps {
  row: TableRowData;
  columns: ColumnSchema[];
  children: React.ReactNode;
  /** Primary key column name for identification */
  primaryKeyColumn?: string;
  /** Callback when expand is clicked */
  onExpand?: () => void;
}

/**
 * A hover card that shows detailed row information on hover.
 * Displays all column values with type-aware formatting.
 */
export const RowHoverCard = memo(
  ({
    row,
    columns,
    children,
    primaryKeyColumn,
    onExpand,
  }: RowHoverCardProps) => {
    const { t } = useTranslation();
    const { copy, copied } = useCopyToClipboard();

    // Get the row identifier
    const rowId =
      primaryKeyColumn && row[primaryKeyColumn] !== undefined
        ? row[primaryKeyColumn]
        : row.__rowId;

    // Format a value for display
    const formatValue = (value: unknown, type: string): string => {
      if (value === null || value === undefined) {
        return t('dataTable.null');
      }

      const typeLower = type.toLowerCase();

      // Format based on type
      if (typeLower.includes('date') || typeLower.includes('time')) {
        try {
          const date = new Date(value as string | number);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString();
          }
        } catch {
          // Fall through to default
        }
      }

      if (typeLower === 'boolean' || typeLower === 'bool') {
        return value ? `✓ ${t('dataTable.true')}` : `✗ ${t('dataTable.false')}`;
      }

      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }

      const str = String(value);
      // Truncate long values
      if (str.length > 100) {
        return `${str.slice(0, 100)}...`;
      }

      return str;
    };

    // Copy row as JSON
    const handleCopyJson = async () => {
      const rowData: Record<string, unknown> = {};
      columns.forEach((col) => {
        rowData[col.name] = row[col.name];
      });

      await copy(JSON.stringify(rowData, null, 2), { showToast: false });
    };

    // Get value styling based on type/value
    const getValueStyle = (value: unknown, type: string): string => {
      if (value === null || value === undefined) {
        return 'text-muted-foreground/50 italic';
      }

      const typeLower = type.toLowerCase();

      if (typeLower.includes('int') || typeLower.includes('num')) {
        return 'text-blue-600 dark:text-blue-400 font-mono';
      }

      if (typeLower.includes('date') || typeLower.includes('time')) {
        return 'text-purple-600 dark:text-purple-400';
      }

      if (typeLower === 'boolean' || typeLower === 'bool') {
        return value
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400';
      }

      return '';
    };

    return (
      <HoverCard>
        <HoverCardTrigger>{children}</HoverCardTrigger>
        <HoverCardContent
          className="w-80 p-0"
          side="right"
          align="start"
          sideOffset={5}
        >
          {/* Header */}
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {t('dataTable.rowId')}:
                </span>
                <span className="bg-gold/10 text-gold rounded px-1.5 py-0.5 font-mono text-xs">
                  {String(rowId)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopyJson}
                  title={
                    copied ? t('common.copied') : t('dataTable.copyAsJson')
                  }
                >
                  <Copy
                    className={cn(
                      'h-3 w-3 transition-colors',
                      copied && 'text-green-500'
                    )}
                  />
                </Button>
                {onExpand && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onExpand}
                    title={t('dataTable.expandRow')}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-64">
            <div className="divide-border/50 divide-y">
              {columns.slice(0, 10).map((col) => {
                const value = row[col.name];
                const formattedValue = formatValue(value, col.type);

                return (
                  <div
                    key={col.name}
                    className="hover:bg-muted/50 flex items-start gap-2 px-3 py-1.5 transition-colors"
                  >
                    <span className="text-muted-foreground min-w-20 truncate text-xs font-medium">
                      {col.name}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-xs wrap-break-word',
                        getValueStyle(value, col.type)
                      )}
                    >
                      {formattedValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer (if more columns exist) */}
          {columns.length > 10 && (
            <div className="border-t px-3 py-1.5">
              <span className="text-muted-foreground text-2xs">
                {t('dataTable.moreColumns', { count: columns.length - 10 })}
              </span>
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  }
);

RowHoverCard.displayName = 'RowHoverCard';

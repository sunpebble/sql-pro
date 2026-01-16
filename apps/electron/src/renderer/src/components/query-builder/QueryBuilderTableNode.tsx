import type { QueryBuilderNodeData } from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Handle, Position } from '@xyflow/react';
import { Key, Link2, Table, X } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQueryBuilderStore } from '@/stores/query-builder-store';

interface QueryBuilderTableNodeProps {
  id: string;
  data: QueryBuilderNodeData;
  selected?: boolean;
}

function QueryBuilderTableNodeComponent({
  id,
  data,
  selected,
}: QueryBuilderTableNodeProps) {
  const { t } = useTranslation();
  const { table, alias, selectedColumns } = data;
  const { toggleColumn, toggleAllColumns, removeTable } =
    useQueryBuilderStore();

  // Get primary key columns
  const pkColumns = new Set(table.primaryKey);

  // Get foreign key columns
  const fkColumns = new Set(table.foreignKeys.map((fk) => fk.column));

  const handleToggleColumn = useCallback(
    (columnName: string) => {
      toggleColumn(id, table.name, alias, columnName);
    },
    [id, table.name, alias, toggleColumn]
  );

  const handleToggleAll = useCallback(() => {
    toggleAllColumns(id, table.name, alias);
  }, [id, table.name, alias, toggleAllColumns]);

  const handleRemove = useCallback(() => {
    removeTable(id);
  }, [id, removeTable]);

  const allSelected = table.columns.every((c) => selectedColumns.has(c.name));
  const someSelected = table.columns.some((c) => selectedColumns.has(c.name));

  return (
    <div
      className={cn(
        'bg-card text-card-foreground relative overflow-visible rounded-lg border shadow-md',
        'dark:border-zinc-700 dark:bg-zinc-900',
        selected && 'ring-primary ring-2'
      )}
    >
      {/* Header - draggable area */}
      <div
        className={cn(
          'drag-handle flex cursor-grab items-center gap-2 rounded-t-lg border-b px-3 py-2',
          'bg-muted/50 dark:bg-zinc-800/50'
        )}
      >
        <Table className="text-primary h-4 w-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate font-medium">
            {table.name}
          </span>
          {alias !== table.name && (
            <span className="text-muted-foreground truncate text-xs">
              AS {alias}
            </span>
          )}
        </div>

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('queryBuilder.removeTable', 'Remove table')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Select All Row */}
      <div
        className={cn(
          'flex items-center gap-2 border-b py-1.5 pr-5 pl-6',
          'hover:bg-accent/50 cursor-pointer'
        )}
        onClick={handleToggleAll}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onCheckedChange={handleToggleAll}
          className="h-4 w-4"
        />
        <span className="text-muted-foreground text-sm font-medium">
          {allSelected
            ? t('queryBuilder.deselectAll', 'Deselect all')
            : t('queryBuilder.selectAll', 'Select all')}
        </span>
        <span className="text-muted-foreground ml-auto text-xs">
          {selectedColumns.size}/{table.columns.length}
        </span>
      </div>

      {/* Columns */}
      <div className="overflow-visible py-1">
        {table.columns.map((column) => {
          const isPK = pkColumns.has(column.name);
          const isFK = fkColumns.has(column.name);
          const isSelected = selectedColumns.has(column.name);

          return (
            <div
              key={column.name}
              className={cn(
                'group relative flex items-center gap-2 overflow-visible py-1 pr-5 pl-6 text-sm',
                'hover:bg-accent/50 cursor-pointer',
                isSelected && 'bg-primary/10'
              )}
              onClick={() => handleToggleColumn(column.name)}
            >
              {/* Target handle (left side) - for receiving JOINs */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.name}-target`}
                className={cn(
                  '!absolute !-left-[24px] h-3! w-3! border-2!',
                  'border-primary! bg-background!',
                  'hover:bg-primary! transition-all hover:scale-125!'
                )}
              />

              {/* Checkbox */}
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggleColumn(column.name)}
                className="h-4 w-4"
              />

              {/* PK/FK indicators */}
              <div className="flex w-5 shrink-0 items-center justify-center gap-0.5">
                {isPK && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Key className="h-3 w-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>Primary Key</TooltipContent>
                  </Tooltip>
                )}
                {isFK && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Link2 className="h-3 w-3 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>Foreign Key</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Column name */}
              <span
                className={cn(
                  'flex-1 truncate',
                  isPK && 'font-medium',
                  !column.nullable && 'underline decoration-dotted'
                )}
                title={`${column.name}${!column.nullable ? ' (NOT NULL)' : ''}`}
              >
                {column.name}
              </span>

              {/* Column type */}
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {column.type}
              </span>

              {/* Source handle (right side) - for creating JOINs */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.name}-source`}
                className={cn(
                  '!absolute !-right-[20px] h-3! w-3! border-2!',
                  'border-primary! bg-background!',
                  'hover:bg-primary! transition-all hover:scale-125!'
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Footer with row count */}
      {table.rowCount !== undefined && (
        <div className="text-muted-foreground border-t px-3 py-1.5 text-xs">
          {table.rowCount.toLocaleString()} {t('queryBuilder.rows', 'rows')}
        </div>
      )}
    </div>
  );
}

export const QueryBuilderTableNode = memo(QueryBuilderTableNodeComponent);

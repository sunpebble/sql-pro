import type { QueryBuilderNodeData } from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Handle, Position } from '@xyflow/react';
import {
  Binary,
  Calendar,
  Hash,
  Key,
  Link2,
  Table,
  ToggleLeft,
  Type,
  X,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import { useQueryBuilderStore } from '@/stores/query-builder-store';

/**
 * Get appropriate icon and color for column data type (DBeaver-style)
 */
function getColumnTypeInfo(type: string): {
  icon: React.ReactNode;
  colorClass: string;
} {
  const normalizedType = type.toUpperCase();

  // Numeric types
  if (
    normalizedType.includes('INT') ||
    normalizedType.includes('NUMERIC') ||
    normalizedType.includes('DECIMAL') ||
    normalizedType.includes('FLOAT') ||
    normalizedType.includes('DOUBLE') ||
    normalizedType.includes('REAL') ||
    normalizedType.includes('NUMBER')
  ) {
    return {
      icon: <Hash className="h-3 w-3" />,
      colorClass: 'text-blue-500',
    };
  }

  // Date/Time types
  if (
    normalizedType.includes('DATE') ||
    normalizedType.includes('TIME') ||
    normalizedType.includes('TIMESTAMP')
  ) {
    return {
      icon: <Calendar className="h-3 w-3" />,
      colorClass: 'text-orange-500',
    };
  }

  // Boolean types
  if (normalizedType.includes('BOOL') || normalizedType.includes('BIT')) {
    return {
      icon: <ToggleLeft className="h-3 w-3" />,
      colorClass: 'text-purple-500',
    };
  }

  // Binary/Blob types
  if (
    normalizedType.includes('BLOB') ||
    normalizedType.includes('BINARY') ||
    normalizedType.includes('BYTE')
  ) {
    return {
      icon: <Binary className="h-3 w-3" />,
      colorClass: 'text-gray-500',
    };
  }

  // Text types (VARCHAR, TEXT, CHAR, etc.) - default
  return {
    icon: <Type className="h-3 w-3" />,
    colorClass: 'text-green-500',
  };
}

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
  const {
    toggleColumn,
    toggleAllColumns,
    removeTable,
    highlightedColumn,
    highlightedEdgeIds,
    setHighlightedColumn,
    clearHighlightedColumn,
    edges,
  } = useQueryBuilderStore();

  const pkColumns = useMemo(
    () => new Set(table.primaryKey),
    [table.primaryKey]
  );
  const fkColumns = useMemo(
    () => new Set(table.foreignKeys.map((fk) => fk.column)),
    [table.foreignKeys]
  );

  const relatedHighlightedColumns = useMemo(() => {
    if (!highlightedColumn || highlightedEdgeIds.size === 0)
      return new Set<string>();

    const cols = new Set<string>();
    for (const edge of edges) {
      if (!highlightedEdgeIds.has(edge.id)) continue;
      if (edge.source === id && edge.data?.sourceColumn) {
        cols.add(edge.data.sourceColumn);
      }
      if (edge.target === id && edge.data?.targetColumn) {
        cols.add(edge.data.targetColumn);
      }
    }
    return cols;
  }, [id, edges, highlightedColumn, highlightedEdgeIds]);

  const { pkColumnsList, regularColumnsList } = useMemo(() => {
    const pk: typeof table.columns = [];
    const regular: typeof table.columns = [];
    for (const col of table.columns) {
      if (pkColumns.has(col.name)) {
        pk.push(col);
      } else {
        regular.push(col);
      }
    }
    return { pkColumnsList: pk, regularColumnsList: regular };
  }, [pkColumns, table]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
      }
    },
    []
  );

  const allSelected = table.columns.every((c) => selectedColumns.has(c.name));
  const someSelected = table.columns.some((c) => selectedColumns.has(c.name));

  const handleColumnMouseEnter = useCallback(
    (columnName: string) => {
      setHighlightedColumn(id, columnName);
    },
    [id, setHighlightedColumn]
  );

  const handleColumnMouseLeave = useCallback(() => {
    clearHighlightedColumn();
  }, [clearHighlightedColumn]);

  const renderColumnRow = (
    column: (typeof table.columns)[0],
    isPK: boolean,
    isFK: boolean
  ) => {
    const isSelected = selectedColumns.has(column.name);
    const typeInfo = getColumnTypeInfo(column.type);
    const isHighlighted = relatedHighlightedColumns.has(column.name);
    const isDirectlyHighlighted =
      highlightedColumn?.nodeId === id &&
      highlightedColumn?.column === column.name;

    return (
      <div
        key={column.name}
        role="button"
        tabIndex={0}
        className={cn(
          'group relative flex items-center gap-1.5 overflow-visible py-1 pr-4 pl-5',
          'hover:bg-accent/50 cursor-pointer transition-colors',
          isSelected && 'bg-primary/10',
          isPK && 'bg-amber-500/5',
          isHighlighted && 'bg-cyan-500/20 ring-1 ring-cyan-500/40 ring-inset',
          isDirectlyHighlighted &&
            'bg-cyan-500/30 ring-2 ring-cyan-500 ring-inset'
        )}
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        onClick={() => handleToggleColumn(column.name)}
        onKeyDown={(e) =>
          handleKeyDown(e, () => handleToggleColumn(column.name))
        }
        onMouseEnter={() => handleColumnMouseEnter(column.name)}
        onMouseLeave={handleColumnMouseLeave}
      >
        <Handle
          type="target"
          position={Position.Left}
          id={`${column.name}-target`}
          className={cn(
            '!absolute !-left-2 !h-2.5 !w-2.5 !rounded-full !border',
            '!border-primary/60 !bg-background',
            'hover:!bg-primary !transition-all hover:!scale-125',
            (isPK || isFK) && '!border-primary !bg-primary/20',
            isHighlighted && '!scale-125 !border-cyan-500 !bg-cyan-500/40',
            isDirectlyHighlighted && '!scale-150 !border-cyan-500 !bg-cyan-500'
          )}
        />

        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleColumn(column.name)}
          className="h-3.5 w-3.5 shrink-0"
        />

        <Tooltip>
          <TooltipTrigger>
            <span className={cn('shrink-0', typeInfo.colorClass)}>
              {typeInfo.icon}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className={TOOLTIP_CONTENT_STYLE}>
            {column.type}
          </TooltipContent>
        </Tooltip>

        {isPK && (
          <Tooltip>
            <TooltipTrigger>
              <Key className="h-3 w-3 shrink-0 text-amber-500" />
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
              {t('queryBuilder.primaryKey')}
            </TooltipContent>
          </Tooltip>
        )}

        {isFK && (
          <Tooltip>
            <TooltipTrigger>
              <Link2 className="h-3 w-3 shrink-0 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
              {t('queryBuilder.foreignKey')}
            </TooltipContent>
          </Tooltip>
        )}

        <span
          className={cn(
            'flex-1 truncate',
            isPK && 'font-semibold',
            !column.nullable && 'underline decoration-dotted underline-offset-2'
          )}
          title={`${column.name}${!column.nullable ? ` (${t('dataTable.notNull')})` : ''}`}
        >
          {column.name}
        </span>

        <span className="text-muted-foreground text-2xs shrink-0 font-mono uppercase">
          {column.type.length > 12
            ? `${column.type.slice(0, 10)}…`
            : column.type}
        </span>

        <Handle
          type="source"
          position={Position.Right}
          id={`${column.name}-source`}
          className={cn(
            '!absolute !-right-2 !h-2.5 !w-2.5 !rounded-full !border',
            '!border-primary/60 !bg-background',
            'hover:!bg-primary !transition-all hover:!scale-125',
            (isPK || isFK) && '!border-primary !bg-primary/20',
            isHighlighted && '!scale-125 !border-cyan-500 !bg-cyan-500/40',
            isDirectlyHighlighted && '!scale-150 !border-cyan-500 !bg-cyan-500'
          )}
        />
      </div>
    );
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-base relative min-w-[200px] overflow-visible border shadow-sm',
        'dark:border-zinc-700 dark:bg-zinc-900',
        selected && 'ring-primary ring-2'
      )}
    >
      <div
        className={cn(
          'drag-handle flex cursor-grab items-center gap-2 rounded-t-[3px] border-b px-3 py-2',
          'bg-primary/10 dark:bg-primary/5'
        )}
      >
        <Table className="text-primary h-4 w-4 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate font-semibold">
            {table.name}
          </span>
          {alias !== table.name && (
            <span
              className="text-muted-foreground truncate"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              AS {alias}
            </span>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
              onClick={handleRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
            {t('queryBuilder.removeTable')}
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center gap-2 border-b py-1 pr-4 pl-5',
          'hover:bg-accent/50 cursor-pointer'
        )}
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        onClick={handleToggleAll}
        onKeyDown={(e) => handleKeyDown(e, handleToggleAll)}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onCheckedChange={handleToggleAll}
          className="h-3.5 w-3.5"
        />
        <span className="text-muted-foreground font-medium">
          {allSelected
            ? t('queryBuilder.deselectAll')
            : t('queryBuilder.selectAll')}
        </span>
        <span className="text-muted-foreground ml-auto tabular-nums">
          {selectedColumns.size}/{table.columns.length}
        </span>
      </div>

      {pkColumnsList.length > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 py-0.5">
          {pkColumnsList.map((column) =>
            renderColumnRow(column, true, fkColumns.has(column.name))
          )}
        </div>
      )}

      {regularColumnsList.length > 0 && (
        <div className="py-0.5">
          {regularColumnsList.map((column) =>
            renderColumnRow(column, false, fkColumns.has(column.name))
          )}
        </div>
      )}

      {table.rowCount !== undefined && (
        <div className="text-muted-foreground text-2xs border-t px-3 py-1 tabular-nums">
          {table.rowCount.toLocaleString()} {t('queryBuilder.rows')}
        </div>
      )}
    </div>
  );
}

export const QueryBuilderTableNode = memo(QueryBuilderTableNodeComponent);

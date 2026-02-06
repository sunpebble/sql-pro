import type { TableSchema } from '@/types/database';
import type {
  FilterCondition,
  FilterOperator,
  SortConfig,
} from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@sqlpro/ui/command';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Separator } from '@sqlpro/ui/separator';
import { Switch } from '@sqlpro/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  LayoutGrid,
  Play,
  Plus,
  RefreshCw,
  Table,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';
import { useQueryBuilderStore } from '@/stores/query-builder-store';

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: 'LIKE', label: 'LIKE' },
  { value: 'NOT LIKE', label: 'NOT LIKE' },
  { value: 'IN', label: 'IN' },
  { value: 'NOT IN', label: 'NOT IN' },
  { value: 'IS NULL', label: 'IS NULL' },
  { value: 'IS NOT NULL', label: 'IS NOT NULL' },
  { value: 'BETWEEN', label: 'BETWEEN' },
];

interface QueryBuilderToolbarProps {
  onRunQuery: () => void;
}

export function QueryBuilderToolbar({ onRunQuery }: QueryBuilderToolbarProps) {
  const { t } = useTranslation();
  const { schema } = useConnectionStore();
  const {
    nodes,
    addTable,
    autoLayout,
    filters,
    addFilter,
    updateFilter,
    removeFilter,
    sorts,
    addSort,
    updateSort,
    removeSort,
    distinct,
    setDistinct,
    limit,
    setLimit,
    clearQuery,
  } = useQueryBuilderStore();

  const [tableSearchOpen, setTableSearchOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  // Get all tables and their aliases for filter/sort dropdowns
  const tableOptions = useMemo(() => {
    return nodes.map((node) => ({
      tableName: node.data.table.name,
      alias: node.data.alias,
      columns: node.data.table.columns,
    }));
  }, [nodes]);

  const handleAddTable = useCallback(
    (table: TableSchema) => {
      // Calculate position based on existing nodes
      const existingNodes = nodes.length;
      const x = 100 + (existingNodes % 3) * 350;
      const y = 100 + Math.floor(existingNodes / 3) * 400;
      addTable(table, { x, y });
      setTableSearchOpen(false);
    },
    [nodes, addTable]
  );

  const handleAddFilter = useCallback(() => {
    if (tableOptions.length === 0) return;
    const firstTable = tableOptions[0];
    const firstColumn = firstTable.columns[0]?.name || '';
    addFilter({
      table: firstTable.alias,
      column: firstColumn,
      operator: '=',
      value: '',
      conjunction: 'AND',
    });
  }, [tableOptions, addFilter]);

  const handleAddSort = useCallback(() => {
    if (tableOptions.length === 0) return;
    const firstTable = tableOptions[0];
    const firstColumn = firstTable.columns[0]?.name || '';
    addSort({
      table: firstTable.alias,
      column: firstColumn,
      direction: 'ASC',
    });
  }, [tableOptions, addSort]);

  return (
    <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
      {/* Add Table */}
      <Popover open={tableSearchOpen} onOpenChange={setTableSearchOpen}>
        <PopoverTrigger>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <Table className="h-4 w-4" />
            {t('queryBuilder.addTable', 'Add Table')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t('queryBuilder.searchTables', 'Search tables...')}
            />
            <CommandList>
              <CommandEmpty>
                {t('queryBuilder.noTables', 'No tables found')}
              </CommandEmpty>
              <CommandGroup heading={t('queryBuilder.tables', 'Tables')}>
                {schema?.tables.map((table) => (
                  <CommandItem
                    key={`${table.schema}.${table.name}`}
                    value={table.name}
                    onSelect={() => handleAddTable(table)}
                    className="gap-2"
                  >
                    <Table className="h-4 w-4" />
                    <span>{table.name}</span>
                    <span
                      className="text-muted-foreground ml-auto"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      {table.columns.length} cols
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Filters */}
      <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
        <PopoverTrigger>
          <Button
            variant={filters.length > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            disabled={nodes.length === 0}
          >
            <Filter className="h-4 w-4" />
            {t('queryBuilder.filters', 'Filters')}
            {filters.length > 0 && (
              <span
                className="bg-primary/15 text-primary rounded-full px-1.5"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {filters.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {t('queryBuilder.whereConditions', 'WHERE Conditions')}
              </h4>
              <Button variant="outline" size="sm" onClick={handleAddFilter}>
                <Plus className="mr-1 h-3 w-3" />
                {t('queryBuilder.add', 'Add')}
              </Button>
            </div>

            {filters.length === 0 ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('queryBuilder.noFilters', 'No filters added')}
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {filters.map((filter, index) => (
                  <FilterRow
                    key={filter.id}
                    filter={filter}
                    index={index}
                    tableOptions={tableOptions}
                    onUpdate={(updates) => updateFilter(filter.id, updates)}
                    onRemove={() => removeFilter(filter.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sort */}
      <Popover open={sortPopoverOpen} onOpenChange={setSortPopoverOpen}>
        <PopoverTrigger>
          <Button
            variant={sorts.length > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            disabled={nodes.length === 0}
          >
            <ArrowDownAZ className="h-4 w-4" />
            {t('queryBuilder.sort', 'Sort')}
            {sorts.length > 0 && (
              <span
                className="bg-primary/15 text-primary rounded-full px-1.5"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {sorts.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {t('queryBuilder.orderBy', 'ORDER BY')}
              </h4>
              <Button variant="outline" size="sm" onClick={handleAddSort}>
                <Plus className="mr-1 h-3 w-3" />
                {t('queryBuilder.add', 'Add')}
              </Button>
            </div>

            {sorts.length === 0 ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('queryBuilder.noSorts', 'No sorting applied')}
              </p>
            ) : (
              <div className="space-y-2">
                {sorts.map((sort, index) => (
                  <SortRow
                    // eslint-disable-next-line react/no-array-index-key -- Sort items have no stable ID
                    key={index}
                    sort={sort}
                    tableOptions={tableOptions}
                    onUpdate={(updates) =>
                      updateSort(index, { ...sort, ...updates })
                    }
                    onRemove={() => removeSort(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* Options */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="distinct"
            checked={distinct}
            onCheckedChange={setDistinct}
            disabled={nodes.length === 0}
          />
          <Label
            htmlFor="distinct"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            DISTINCT
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Label style={{ fontSize: 'var(--font-ui-size, 13px)' }}>LIMIT</Label>
          <Input
            type="number"
            min={0}
            value={limit || ''}
            onChange={(e) =>
              setLimit(
                e.target.value ? Number.parseInt(e.target.value) : undefined
              )
            }
            className="h-8 w-20"
            placeholder="∞"
            disabled={nodes.length === 0}
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={autoLayout}
            disabled={nodes.length < 2}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
          {t('queryBuilder.autoLayout', 'Auto Layout')}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearQuery}
            disabled={nodes.length === 0}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
          {t('queryBuilder.clear', 'Clear query')}
        </TooltipContent>
      </Tooltip>

      <Button
        variant="accent"
        size="sm"
        className="gap-2"
        onClick={onRunQuery}
        disabled={nodes.length === 0}
      >
        <Play className="h-4 w-4" />
        {t('queryBuilder.run', 'Run Query')}
      </Button>
    </div>
  );
}

interface FilterRowProps {
  filter: FilterCondition;
  index: number;
  tableOptions: {
    tableName: string;
    alias: string;
    columns: { name: string; type: string }[];
  }[];
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterRow({
  filter,
  index,
  tableOptions,
  onUpdate,
  onRemove,
}: FilterRowProps) {
  const { t } = useTranslation();
  const selectedTable = tableOptions.find((t) => t.alias === filter.table);
  const columns = selectedTable?.columns || [];

  const needsValue = !['IS NULL', 'IS NOT NULL'].includes(filter.operator);

  return (
    <div className="bg-muted/30 rounded-base flex items-center gap-2 border-2 p-2">
      {index > 0 && (
        <Select
          value={filter.conjunction}
          onValueChange={(v) => onUpdate({ conjunction: v as 'AND' | 'OR' })}
        >
          <SelectTrigger className="h-7 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      )}

      <Select
        value={filter.table}
        onValueChange={(v) => {
          if (!v) return;
          const table = tableOptions.find((t) => t.alias === v);
          onUpdate({
            table: v,
            column: table?.columns[0]?.name || '',
          });
        }}
      >
        <SelectTrigger className="h-7 w-24">
          <SelectValue placeholder={t('queryBuilder.table', 'Table')} />
        </SelectTrigger>
        <SelectContent>
          {tableOptions.map((t) => (
            <SelectItem key={t.alias} value={t.alias}>
              {t.alias}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">.</span>

      <Select
        value={filter.column}
        onValueChange={(v) => v && onUpdate({ column: v })}
      >
        <SelectTrigger className="h-7 w-28">
          <SelectValue placeholder={t('queryBuilder.column', 'Column')} />
        </SelectTrigger>
        <SelectContent>
          {columns.map((col) => (
            <SelectItem key={col.name} value={col.name}>
              {col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(v) => onUpdate({ operator: v as FilterOperator })}
      >
        <SelectTrigger className="h-7 w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        <Input
          value={filter.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder={t('queryBuilder.value', 'Value')}
          className="h-7 flex-1"
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface SortRowProps {
  sort: SortConfig;
  tableOptions: {
    tableName: string;
    alias: string;
    columns: { name: string; type: string }[];
  }[];
  onUpdate: (updates: Partial<SortConfig>) => void;
  onRemove: () => void;
}

function SortRow({ sort, tableOptions, onUpdate, onRemove }: SortRowProps) {
  const { t } = useTranslation();
  const selectedTable = tableOptions.find((tbl) => tbl.alias === sort.table);
  const columns = selectedTable?.columns || [];

  return (
    <div className="bg-muted/30 rounded-base flex items-center gap-2 border-2 p-2">
      <Select
        value={sort.table}
        onValueChange={(v) => {
          if (!v) return;
          const table = tableOptions.find((tbl) => tbl.alias === v);
          onUpdate({
            table: v,
            column: table?.columns[0]?.name || '',
          });
        }}
      >
        <SelectTrigger className="h-7 w-28">
          <SelectValue placeholder={t('queryBuilder.table', 'Table')} />
        </SelectTrigger>
        <SelectContent>
          {tableOptions.map((tbl) => (
            <SelectItem key={tbl.alias} value={tbl.alias}>
              {tbl.alias}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">.</span>

      <Select
        value={sort.column}
        onValueChange={(v) => v && onUpdate({ column: v })}
      >
        <SelectTrigger className="h-7 flex-1">
          <SelectValue placeholder={t('queryBuilder.column', 'Column')} />
        </SelectTrigger>
        <SelectContent>
          {columns.map((col) => (
            <SelectItem key={col.name} value={col.name}>
              {col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={sort.direction === 'ASC' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={() => onUpdate({ direction: 'ASC' })}
      >
        <ArrowUpAZ className="h-4 w-4" />
      </Button>

      <Button
        variant={sort.direction === 'DESC' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-7 w-7"
        onClick={() => onUpdate({ direction: 'DESC' })}
      >
        <ArrowDownAZ className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

import type {
  TableMetadata,
  TagDefinition,
} from '@/stores/table-organization-store';
import type { SchemaInfo, TableSchema, TriggerSchema } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@sqlpro/ui/alert-dialog';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@sqlpro/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@sqlpro/ui/empty';
import { Input } from '@sqlpro/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import { ScrollArea, ScrollBar } from '@sqlpro/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Code,
  Copy,
  Database,
  Dices,
  Edit2,
  Eye,
  FileDown,
  FileSearch,
  Filter,
  Pin,
  PinOff,
  Plus,
  Search,
  SortAsc,
  Table,
  Tag,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ColoredTagBadge,
  CreateTagDialog,
  EditTagDialog,
  TagColorDot,
} from '@/components/tags';
import { ShortcutKbd } from '@/components/ui/kbd';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useVimKeyHandler } from '@/hooks/useVimKeyHandler';
import { sqlPro } from '@/lib/api';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
import { useQueryTabsStore } from '@/stores/query-tabs-store';
import { useSettingsStore, useTableFont } from '@/stores/settings-store';
import { useTableOrganizationStore } from '@/stores/table-organization-store';
import { MockDataGeneratorDialog } from './mock-data-generator';
import { SchemaExportDialog } from './sharing/SchemaExportDialog';

interface SidebarProps {
  onSwitchToQuery?: () => void;
  onSwitchToData?: () => void;
}

// Sample CREATE TABLE SQL template for empty database state
const SAMPLE_CREATE_TABLE_SQL = `CREATE TABLE example (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

// Hoist static skeleton widths outside component (rendering-hoist-jsx)
const SKELETON_WIDTHS = [80, 120, 95, 140, 75, 110, 130, 85];

export function Sidebar({ onSwitchToQuery, onSwitchToData }: SidebarProps) {
  const {
    schema,
    selectedTable,
    setSelectedTable,
    connection,
    activeConnectionId,
    isLoadingSchema,
    setSchema,
  } = useConnectionStore();
  const { openTable } = useDataTabsStore();
  const { createTab } = useQueryTabsStore();

  // Table organization store
  const {
    sortOption,
    setSortOption,
    tags,
    createTag,
    updateTag,
    deleteTag,
    activeTagFilter,
    setActiveTagFilter,
    addTableTag,
    removeTableTag,
    setTablePinned,
    getTableKey,
    getTableMetadata,
    getTagsByIds,
  } = useTableOrganizationStore();

  // i18n hook
  const { t } = useTranslation('sidebar');

  // Expansion state for schemas (key is schema name)
  const [expandedSchemas, setExpandedSchemas] = useState<
    Record<string, boolean>
  >({});
  // Expansion state for tables/views within schemas (key is "schemaName:tables" or "schemaName:views" or "schemaName:triggers")
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  // Track if all items are expanded
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation dialogs state
  const [tableToTruncate, setTableToTruncate] = useState<TableSchema | null>(
    null
  );
  const [tableToDrop, setTableToDrop] = useState<TableSchema | null>(null);

  // Schema export dialog state
  const [showSchemaExport, setShowSchemaExport] = useState(false);

  // Mock data generator dialog state
  const [showMockDataGenerator, setShowMockDataGenerator] = useState(false);
  const [mockDataTable, setMockDataTable] = useState<TableSchema | null>(null);

  // Font settings for sidebar
  const tableFont = useTableFont();

  // Vim navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const appVimMode = useSettingsStore((s) => s.appVimMode);
  const { handleKey: handleVimKey, resetSequence } = useVimKeyHandler();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Determine if we have multiple schemas (to show/hide schema-level grouping)
  const hasMultipleSchemas = useMemo(() => {
    if (!schema?.schemas) return false;
    // Filter out empty schemas
    const nonEmptySchemas = schema.schemas.filter(
      (s) => s.tables.length > 0 || s.views.length > 0
    );
    return nonEmptySchemas.length > 1;
  }, [schema?.schemas]);

  // Toggle schema expansion
  const toggleSchema = useCallback((schemaName: string) => {
    setExpandedSchemas((prev) => ({
      ...prev,
      [schemaName]: !prev[schemaName],
    }));
  }, []);

  // Toggle section (tables/views) expansion
  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Track previously seen schema names to detect new schemas
  const prevSchemaKeysRef = useRef<Set<string>>(new Set());

  // Initialize expansion state for new schemas (default expanded)
  // Using render-time detection to avoid useEffect setState
  if (schema?.schemas) {
    const currentSchemaKeys = new Set(schema.schemas.map((s) => s.name));
    const hasNewSchemas = schema.schemas.some(
      (s) => !prevSchemaKeysRef.current.has(s.name)
    );

    if (hasNewSchemas) {
      // Check if we need to update expandedSchemas
      const needsSchemaUpdate = schema.schemas.some(
        (s) => expandedSchemas[s.name] === undefined
      );
      if (needsSchemaUpdate) {
        const newExpandedSchemas: Record<string, boolean> = {
          ...expandedSchemas,
        };
        for (const s of schema.schemas) {
          if (newExpandedSchemas[s.name] === undefined) {
            newExpandedSchemas[s.name] = true; // Expand by default
          }
        }
        setExpandedSchemas(newExpandedSchemas);
      }

      // Check if we need to update expandedSections
      const needsSectionsUpdate = schema.schemas.some((s) => {
        const tablesKey = `${s.name}:tables`;
        return expandedSections[tablesKey] === undefined;
      });
      if (needsSectionsUpdate) {
        const newExpandedSections: Record<string, boolean> = {
          ...expandedSections,
        };
        for (const s of schema.schemas) {
          const tablesKey = `${s.name}:tables`;
          const viewsKey = `${s.name}:views`;
          const triggersKey = `${s.name}:triggers`;
          if (newExpandedSections[tablesKey] === undefined) {
            newExpandedSections[tablesKey] = true; // Expand tables by default
          }
          if (newExpandedSections[viewsKey] === undefined) {
            newExpandedSections[viewsKey] = true; // Expand views by default
          }
          if (newExpandedSections[triggersKey] === undefined) {
            newExpandedSections[triggersKey] = false; // Collapse triggers by default
          }
        }
        setExpandedSections(newExpandedSections);
      }

      prevSchemaKeysRef.current = currentSchemaKeys;
    }
  }

  // Expand all schemas and sections
  const expandAll = useCallback(() => {
    if (!schema?.schemas) return;
    const newSchemas: Record<string, boolean> = {};
    const newSections: Record<string, boolean> = {};
    for (const s of schema.schemas) {
      newSchemas[s.name] = true;
      newSections[`${s.name}:tables`] = true;
      newSections[`${s.name}:views`] = true;
      newSections[`${s.name}:triggers`] = true;
    }
    setExpandedSchemas(newSchemas);
    setExpandedSections(newSections);
    setIsAllExpanded(true);
  }, [schema?.schemas]);

  // Collapse all schemas and sections
  const collapseAll = useCallback(() => {
    if (!schema?.schemas) return;
    const newSchemas: Record<string, boolean> = {};
    const newSections: Record<string, boolean> = {};
    for (const s of schema.schemas) {
      newSchemas[s.name] = false;
      newSections[`${s.name}:tables`] = false;
      newSections[`${s.name}:views`] = false;
      newSections[`${s.name}:triggers`] = false;
    }
    setExpandedSchemas(newSchemas);
    setExpandedSections(newSections);
    setIsAllExpanded(false);
  }, [schema?.schemas]);

  // Toggle expand/collapse all
  const toggleExpandAll = useCallback(() => {
    if (isAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  }, [isAllExpanded, expandAll, collapseAll]);

  const handleSelectTable = useCallback(
    (table: TableSchema) => {
      if (!connection || !activeConnectionId) return;

      setSelectedTable(table);
      // Open the table in a data tab (or switch to existing tab)
      // TableView will fetch data automatically via useTableData hook
      openTable(activeConnectionId, table);
      // Switch to data view if not already there
      onSwitchToData?.();
    },
    [
      connection,
      activeConnectionId,
      setSelectedTable,
      openTable,
      onSwitchToData,
    ]
  );

  // Copy to clipboard hook
  const { copy } = useCopyToClipboard();

  // Table context menu handlers
  const handleCopyTableName = useCallback(
    (table: TableSchema) => {
      copy(table.name, { showToast: false });
    },
    [copy]
  );

  const handleCopyCreateStatement = useCallback(
    (table: TableSchema) => {
      if (table.sql) {
        copy(table.sql, { showToast: false });
      }
    },
    [copy]
  );

  // Open SQL Query Editor for empty state
  const handleOpenSqlTab = useCallback(() => {
    if (activeConnectionId) {
      createTab(activeConnectionId, t('newQuery'), '');
      onSwitchToQuery?.();
    }
  }, [activeConnectionId, createTab, onSwitchToQuery, t]);

  // Copy sample CREATE TABLE SQL to clipboard
  const handleCopySampleSQL = useCallback(async () => {
    await copy(SAMPLE_CREATE_TABLE_SQL, {
      successMessage: t('empty.sampleSqlCopied'),
      errorMessage: t('empty.sampleSqlCopyFailed'),
    });
  }, [copy, t]);

  const handleOpenInQueryEditor = useCallback(
    (table: TableSchema) => {
      if (!activeConnectionId) return;
      const schemaPrefix =
        table.schema && table.schema !== 'main' ? `"${table.schema}".` : '';
      const query = `SELECT * FROM ${schemaPrefix}"${table.name}" LIMIT 100;`;
      createTab(activeConnectionId, `SELECT ${table.name}`, query);
      // Switch to SQL Query tab
      onSwitchToQuery?.();
    },
    [activeConnectionId, createTab, onSwitchToQuery]
  );

  // Show schema export dialog
  const handleExportSchema = useCallback(() => {
    setShowSchemaExport(true);
  }, []);

  // Show mock data generator dialog
  const handleGenerateMockData = useCallback((table: TableSchema) => {
    setMockDataTable(table);
    setShowMockDataGenerator(true);
  }, []);

  // Show truncate confirmation dialog
  const handleTruncateTableRequest = useCallback((table: TableSchema) => {
    setTableToTruncate(table);
  }, []);

  // Execute truncate operation
  const handleConfirmTruncate = useCallback(async () => {
    const table = tableToTruncate;
    if (!table || !connection || !activeConnectionId) return;
    const schemaPrefix =
      table.schema && table.schema !== 'main' ? `"${table.schema}".` : '';
    const query = `DELETE FROM ${schemaPrefix}"${table.name}";`;
    try {
      await sqlPro.db.executeQuery({
        connectionId: connection.id,
        query,
      });
      // Refresh the table data if it's currently selected
      if (selectedTable?.name === table.name) {
        handleSelectTable(table);
      }
    } catch (err) {
      console.error('Failed to truncate table:', err);
    } finally {
      setTableToTruncate(null);
    }
  }, [
    tableToTruncate,
    connection,
    activeConnectionId,
    selectedTable,
    handleSelectTable,
  ]);

  // Show drop confirmation dialog
  const handleDropTableRequest = useCallback((table: TableSchema) => {
    setTableToDrop(table);
  }, []);

  // Execute drop operation
  const handleConfirmDrop = useCallback(async () => {
    const table = tableToDrop;
    if (!table || !connection || !activeConnectionId) return;
    const schemaPrefix =
      table.schema && table.schema !== 'main' ? `"${table.schema}".` : '';
    const objectType = table.type === 'view' ? 'VIEW' : 'TABLE';
    const query = `DROP ${objectType} ${schemaPrefix}"${table.name}";`;
    try {
      await sqlPro.db.executeQuery({
        connectionId: connection.id,
        query,
      });
      // Refresh schema after dropping
      const schemaResult = await sqlPro.db.getSchema({
        connectionId: connection.id,
      });
      if (schemaResult.success && schemaResult.schemas) {
        setSchema(activeConnectionId, {
          schemas: schemaResult.schemas,
          tables: schemaResult.schemas.flatMap((s: SchemaInfo) => s.tables),
          views: schemaResult.schemas.flatMap((s: SchemaInfo) => s.views),
        });
      }
    } catch (err) {
      console.error('Failed to drop table:', err);
    } finally {
      setTableToDrop(null);
    }
  }, [tableToDrop, connection, activeConnectionId, setSchema]);

  // Filter schemas based on search query
  const filteredSchemas = useMemo(() => {
    if (!schema?.schemas) return [];

    // Helper function to sort tables based on current sort option
    const sortTables = (tables: TableSchema[]): TableSchema[] => {
      const sorted = [...tables];

      // First, separate pinned and non-pinned tables
      const pinned: TableSchema[] = [];
      const unpinned: TableSchema[] = [];

      for (const table of sorted) {
        const key = getTableKey(
          connection?.path || '',
          table.schema,
          table.name
        );
        const metadata = getTableMetadata(key);
        if (metadata.pinned) {
          pinned.push(table);
        } else {
          unpinned.push(table);
        }
      }

      // Sort unpinned tables based on sort option
      const sortFn = (a: TableSchema, b: TableSchema): number => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'row-count-asc':
            return (a.rowCount ?? 0) - (b.rowCount ?? 0);
          case 'row-count-desc':
            return (b.rowCount ?? 0) - (a.rowCount ?? 0);
          case 'custom': {
            const keyA = getTableKey(connection?.path || '', a.schema, a.name);
            const keyB = getTableKey(connection?.path || '', b.schema, b.name);
            const orderA = getTableMetadata(keyA).sortOrder ?? Infinity;
            const orderB = getTableMetadata(keyB).sortOrder ?? Infinity;
            return orderA - orderB;
          }
          default:
            return a.name.localeCompare(b.name);
        }
      };

      pinned.sort(sortFn);
      unpinned.sort(sortFn);

      return [...pinned, ...unpinned];
    };

    // Helper function to filter by active tag
    const filterByTag = (tables: TableSchema[]): TableSchema[] => {
      if (!activeTagFilter) return tables;
      return tables.filter((table) => {
        const key = getTableKey(
          connection?.path || '',
          table.schema,
          table.name
        );
        const metadata = getTableMetadata(key);
        return metadata.tagIds.includes(activeTagFilter);
      });
    };

    return schema.schemas
      .map((s) => {
        // Aggregate all triggers from all tables in this schema
        const allTriggers: TriggerSchema[] = s.tables.flatMap(
          (t) => t.triggers || []
        );

        // Filter by search query
        let tables = s.tables.filter((t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        let views = s.views.filter((v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const triggers = allTriggers.filter((tr) =>
          tr.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Filter by active tag
        tables = filterByTag(tables);
        views = filterByTag(views);

        // Sort tables and views
        tables = sortTables(tables);
        views = sortTables(views);

        return {
          ...s,
          tables,
          views,
          triggers,
        };
      })
      .filter(
        (s) =>
          s.tables.length > 0 ||
          s.views.length > 0 ||
          s.triggers.length > 0 ||
          !searchQuery
      );
  }, [
    schema?.schemas,
    searchQuery,
    sortOption,
    activeTagFilter,
    connection?.path,
    getTableKey,
    getTableMetadata,
  ]);

  // Check if the database has any tables/views at all (before filtering)
  const isDatabaseEmpty = useMemo(() => {
    if (!schema?.schemas) return true;
    return schema.schemas.every(
      (s) => s.tables.length === 0 && s.views.length === 0
    );
  }, [schema?.schemas]);

  // Check if current filters result in no items
  const hasNoFilteredResults = useMemo(() => {
    if (isDatabaseEmpty) return false; // Let isDatabaseEmpty handle this case
    return filteredSchemas.every(
      (s) =>
        s.tables.length === 0 && s.views.length === 0 && s.triggers.length === 0
    );
  }, [filteredSchemas, isDatabaseEmpty]);

  // Combined list of navigable items for vim navigation
  const navigableItems = useMemo(() => {
    const items: Array<{ type: 'table' | 'view'; item: TableSchema }> = [];

    for (const schemaInfo of filteredSchemas) {
      const isSchemaExpanded = hasMultipleSchemas
        ? expandedSchemas[schemaInfo.name] !== false
        : true;
      if (!isSchemaExpanded) continue;

      const tablesKey = `${schemaInfo.name}:tables`;
      const viewsKey = `${schemaInfo.name}:views`;

      if (expandedSections[tablesKey] !== false) {
        schemaInfo.tables.forEach((t) =>
          items.push({ type: 'table', item: t })
        );
      }
      if (expandedSections[viewsKey] !== false) {
        schemaInfo.views.forEach((v) => items.push({ type: 'view', item: v }));
      }
    }

    return items;
  }, [filteredSchemas, hasMultipleSchemas, expandedSchemas, expandedSections]);

  // Handle vim keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't handle keys when search input is focused (except Escape)
      if (isSearchFocused && e.key !== 'Escape') return;

      if (!appVimMode) return;

      const { command, handled } = handleVimKey(e.key, e.shiftKey);

      if (handled) {
        e.preventDefault();

        switch (command) {
          case 'move-down': {
            if (navigableItems.length > 0) {
              setFocusedIndex((prev) =>
                prev < navigableItems.length - 1 ? prev + 1 : prev
              );
            }
            break;
          }
          case 'move-up': {
            if (navigableItems.length > 0) {
              setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            }
            break;
          }
          case 'jump-top': {
            if (navigableItems.length > 0) {
              setFocusedIndex(0);
            }
            break;
          }
          case 'jump-bottom': {
            if (navigableItems.length > 0) {
              setFocusedIndex(navigableItems.length - 1);
            }
            break;
          }
          case 'select':
          case 'enter-edit': {
            if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
              const { item } = navigableItems[focusedIndex];
              handleSelectTable(item);
            }
            break;
          }
          case 'toggle-expand': {
            // Toggle expand for the section containing the focused item
            if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
              const { item } = navigableItems[focusedIndex];
              const sectionKey = `${item.schema}:${item.type === 'table' ? 'tables' : 'views'}`;
              toggleSection(sectionKey);
            }
            break;
          }
          case 'search': {
            searchInputRef.current?.focus();
            break;
          }
          case 'exit-mode': {
            // Clear search and unfocus
            if (isSearchFocused) {
              setSearchQuery('');
              searchInputRef.current?.blur();
              containerRef.current?.focus();
            }
            setFocusedIndex(-1);
            resetSequence();
            break;
          }
        }
      }
    },
    [
      appVimMode,
      isSearchFocused,
      handleVimKey,
      navigableItems,
      focusedIndex,
      handleSelectTable,
      toggleSection,
      resetSequence,
    ]
  );

  // Track previous selected table to sync focused index when selection changes externally
  const prevSelectedTableRef = useRef(selectedTable);
  const prevNavigableItemsRef = useRef(navigableItems);

  // Sync focused index with selected table when selection changes externally
  // Using render-time comparison to avoid useEffect setState
  if (
    selectedTable &&
    (prevSelectedTableRef.current !== selectedTable ||
      prevNavigableItemsRef.current !== navigableItems)
  ) {
    const idx = navigableItems.findIndex(
      (n) =>
        n.item.name === selectedTable.name &&
        n.item.schema === selectedTable.schema
    );
    if (idx !== -1 && idx !== focusedIndex) {
      setFocusedIndex(idx);
    }
  }
  prevSelectedTableRef.current = selectedTable;
  prevNavigableItemsRef.current = navigableItems;

  // Helper to get the index for vim focus within navigable items
  const getItemIndex = useCallback(
    (schemaName: string, type: 'table' | 'view', itemIndex: number) => {
      let count = 0;
      for (const s of filteredSchemas) {
        const isSchemaExpanded = hasMultipleSchemas
          ? expandedSchemas[s.name] !== false
          : true;
        if (!isSchemaExpanded) continue;

        if (s.name === schemaName) {
          if (type === 'table') {
            return count + itemIndex;
          } else {
            const tablesKey = `${s.name}:tables`;
            if (expandedSections[tablesKey] !== false) {
              count += s.tables.length;
            }
            return count + itemIndex;
          }
        }

        const tablesKey = `${s.name}:tables`;
        const viewsKey = `${s.name}:views`;
        if (expandedSections[tablesKey] !== false) {
          count += s.tables.length;
        }
        if (expandedSections[viewsKey] !== false) {
          count += s.views.length;
        }
      }
      return -1;
    },
    [filteredSchemas, hasMultipleSchemas, expandedSchemas, expandedSections]
  );

  return (
    <div
      ref={containerRef}
      className="bg-background flex h-full w-full flex-col overflow-hidden outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-tour-target="sidebar"
    >
      {/* Search - matches DataTabBar height */}
      <div className="border-border mt-1 flex h-8 shrink-0 items-center border-b-2 px-1.5">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              appVimMode
                ? t('schema.searchVim', {
                    defaultValue: 'Search tables (/ to focus)',
                  })
                : t('schema.search')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="placeholder:text-muted-foreground focus:ring-main rounded-base h-6 w-full bg-transparent pr-2 pl-6 focus:ring-2 focus:outline-none"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          />
        </div>
      </div>

      {/* Sort and Filter Controls */}
      <ScrollArea className="border-border h-8 w-full shrink-0 border-b-2">
        <div className="flex h-full min-w-0 items-center gap-1 px-1.5">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1 px-2"
              >
                <SortAsc className="h-3.5 w-3.5 shrink-0" />
                <span
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {sortOption === 'name-asc' && t('sort.aToZ')}
                  {sortOption === 'name-desc' && t('sort.zToA')}
                  {sortOption === 'row-count-asc' && t('sort.rowsAscShort')}
                  {sortOption === 'row-count-desc' && t('sort.rowsDescShort')}
                  {sortOption === 'custom' && t('sort.custom')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-auto">
              <DropdownMenuItem
                onClick={() => setSortOption('name-asc')}
                className="whitespace-nowrap"
              >
                <ArrowDownAZ className="mr-2 h-4 w-4" />
                {t('sort.nameAsc')}
                {sortOption === 'name-asc' && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption('name-desc')}
                className="whitespace-nowrap"
              >
                <ArrowUpAZ className="mr-2 h-4 w-4" />
                {t('sort.nameDesc')}
                {sortOption === 'name-desc' && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortOption('row-count-asc')}
                className="whitespace-nowrap"
              >
                {t('sort.rowsAsc')}
                {sortOption === 'row-count-asc' && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortOption('row-count-desc')}
                className="whitespace-nowrap"
              >
                {t('sort.rowsDesc')}
                {sortOption === 'row-count-desc' && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter & Tags Combined */}
          <FilterTagsPopover
            tags={tags}
            activeTagFilter={activeTagFilter}
            onSetActiveTagFilter={setActiveTagFilter}
            onCreateTag={createTag}
            onUpdateTag={updateTag}
            onDeleteTag={deleteTag}
          />

          {/* Expand/Collapse All Toggle */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 w-7 shrink-0 p-0"
                onClick={toggleExpandAll}
                aria-label={
                  isAllExpanded
                    ? t('filter.collapseAll', { defaultValue: 'Collapse All' })
                    : t('filter.expandAll', { defaultValue: 'Expand All' })
                }
              >
                {isAllExpanded ? (
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className={TOOLTIP_CONTENT_STYLE}>
              {isAllExpanded ? t('filter.collapseAll') : t('filter.expandAll')}
            </TooltipContent>
          </Tooltip>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Schema Tree */}
      <ScrollArea className="min-h-0 min-w-0 flex-1">
        <div
          className="min-w-0 overflow-hidden p-1.5"
          style={{
            fontFamily: tableFont.family || 'inherit',
            fontSize: `${tableFont.size || 13}px`,
          }}
        >
          {isLoadingSchema ? (
            <div className="space-y-1 py-1">
              {/* Skeleton items that mimic table entries */}
              {SKELETON_WIDTHS.map((width, i) => (
                <div
                  key={`skeleton-${String(i)}`}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                >
                  <div className="bg-muted h-4 w-4 animate-pulse rounded-md" />
                  <div
                    className="bg-muted h-3.5 animate-pulse rounded-md"
                    style={{ width: `${width}px` }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredSchemas.map((schemaInfo) => (
                <SchemaSection
                  key={schemaInfo.name}
                  schemaInfo={schemaInfo}
                  showSchemaHeader={hasMultipleSchemas}
                  isSchemaExpanded={
                    hasMultipleSchemas
                      ? expandedSchemas[schemaInfo.name] !== false
                      : true
                  }
                  onToggleSchema={() => toggleSchema(schemaInfo.name)}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                  selectedTable={selectedTable}
                  focusedIndex={focusedIndex}
                  appVimMode={appVimMode}
                  getItemIndex={getItemIndex}
                  onSelectTable={handleSelectTable}
                  onCopyTableName={handleCopyTableName}
                  onCopyCreateStatement={handleCopyCreateStatement}
                  onOpenInQueryEditor={handleOpenInQueryEditor}
                  onExportSchema={handleExportSchema}
                  onTruncateTable={handleTruncateTableRequest}
                  onDropTable={handleDropTableRequest}
                  onGenerateMockData={handleGenerateMockData}
                  connectionPath={connection?.path || ''}
                  tags={tags}
                  getTableMetadata={getTableMetadata}
                  getTableKey={getTableKey}
                  getTagsByIds={getTagsByIds}
                  onAddTableTag={addTableTag}
                  onRemoveTableTag={removeTableTag}
                  onTogglePinned={setTablePinned}
                />
              ))}

              {/* Empty State - Database has no tables */}
              {isDatabaseEmpty && (
                <Empty className="border-0 px-4 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Database className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>{t('empty.title')}</EmptyTitle>
                    <EmptyDescription>
                      {t('empty.databaseEmpty')}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={handleOpenSqlTab}
                        className="w-full sm:w-auto"
                      >
                        <Code className="mr-2 size-4" />
                        {t('empty.openSqlQueryEditor')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopySampleSQL}
                        className="hover:border-primary/50 hover:text-primary w-full sm:w-auto"
                      >
                        <Copy className="mr-2 size-4" />
                        {t('empty.copySampleSql')}
                      </Button>
                    </div>
                  </EmptyContent>
                </Empty>
              )}

              {/* Empty State - Filters result in no matches */}
              {!isDatabaseEmpty && hasNoFilteredResults && (
                <Empty className="border-0 px-4 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>{t('noResults.title')}</EmptyTitle>
                    <EmptyDescription>
                      {searchQuery
                        ? t('noResults.noTablesMatch')
                        : activeTagFilter
                          ? t('noResults.noTablesWithTag')
                          : t('noResults.noTablesFound')}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Truncate Table Confirmation Dialog */}
      <AlertDialog
        open={!!tableToTruncate}
        onOpenChange={(open) => !open && setTableToTruncate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.truncateTable')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.truncateConfirm')}{' '}
              <span className="font-semibold">{tableToTruncate?.name}</span>?
              {t('dialog.truncateWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTruncate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dialog.truncate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drop Table/View Confirmation Dialog */}
      <AlertDialog
        open={!!tableToDrop}
        onOpenChange={(open) => !open && setTableToDrop(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tableToDrop?.type === 'view'
                ? t('dialog.dropView')
                : t('dialog.dropTable')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.dropConfirm')}{' '}
              <span className="font-semibold">{tableToDrop?.name}</span>?{' '}
              {t('dialog.dropWarning')}
              {tableToDrop?.type === 'view'
                ? t('schema.views').toLowerCase()
                : t('schema.tables').toLowerCase()}{' '}
              {t('dialog.andCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDrop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dialog.drop')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schema Export Dialog */}
      {activeConnectionId && (
        <SchemaExportDialog
          open={showSchemaExport}
          onOpenChange={setShowSchemaExport}
          connectionId={activeConnectionId}
          databaseName={connection?.filename || connection?.path || ''}
        />
      )}

      {/* Mock Data Generator Dialog */}
      <MockDataGeneratorDialog
        open={showMockDataGenerator}
        onOpenChange={setShowMockDataGenerator}
        initialTable={mockDataTable || undefined}
      />
    </div>
  );
}

interface SchemaSectionProps {
  schemaInfo: SchemaInfo & { triggers: TriggerSchema[] };
  showSchemaHeader: boolean;
  isSchemaExpanded: boolean;
  onToggleSchema: () => void;
  expandedSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  selectedTable: TableSchema | null;
  focusedIndex: number;
  appVimMode: boolean;
  getItemIndex: (
    schemaName: string,
    type: 'table' | 'view',
    itemIndex: number
  ) => number;
  onSelectTable: (table: TableSchema) => void;
  onCopyTableName: (table: TableSchema) => void;
  onCopyCreateStatement: (table: TableSchema) => void;
  onOpenInQueryEditor: (table: TableSchema) => void;
  onExportSchema: () => void;
  onTruncateTable: (table: TableSchema) => void;
  onDropTable: (table: TableSchema) => void;
  onGenerateMockData: (table: TableSchema) => void;
  // Tag and organization props
  connectionPath: string;
  tags: TagDefinition[];
  getTableMetadata: (tableKey: string) => TableMetadata;
  getTableKey: (
    connectionPath: string,
    schemaName: string,
    tableName: string
  ) => string;
  getTagsByIds: (ids: string[]) => TagDefinition[];
  onAddTableTag: (tableKey: string, tag: string) => void;
  onRemoveTableTag: (tableKey: string, tag: string) => void;
  onTogglePinned: (tableKey: string, pinned: boolean) => void;
}

function SchemaSection({
  schemaInfo,
  showSchemaHeader,
  isSchemaExpanded,
  onToggleSchema,
  expandedSections,
  onToggleSection,
  selectedTable,
  focusedIndex,
  appVimMode,
  getItemIndex,
  onSelectTable,
  onCopyTableName,
  onCopyCreateStatement,
  onOpenInQueryEditor,
  onExportSchema,
  onTruncateTable,
  onDropTable,
  onGenerateMockData,
  connectionPath,
  tags,
  getTableMetadata,
  getTableKey,
  getTagsByIds,
  onAddTableTag,
  onRemoveTableTag,
  onTogglePinned,
}: SchemaSectionProps) {
  const { t } = useTranslation('sidebar');
  const tablesKey = `${schemaInfo.name}:tables`;
  const viewsKey = `${schemaInfo.name}:views`;
  const triggersKey = `${schemaInfo.name}:triggers`;
  const tablesExpanded = expandedSections[tablesKey] !== false;
  const viewsExpanded = expandedSections[viewsKey] !== false;
  const triggersExpanded = expandedSections[triggersKey] !== false;

  return (
    <div className="min-w-0">
      {/* Schema Header (only shown when multiple schemas) */}
      {showSchemaHeader && (
        <button
          onClick={onToggleSchema}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-base flex w-full items-center gap-2 px-2 py-1 font-medium"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {isSchemaExpanded ? (
            <ChevronDown className="h-2.5 w-2.5 transition-transform" />
          ) : (
            <ChevronRight className="h-2.5 w-2.5 transition-transform" />
          )}
          <Database className="h-3.5 w-3.5" />
          <span>{schemaInfo.name}</span>
        </button>
      )}

      {/* Schema Content */}
      {isSchemaExpanded && (
        <div className={showSchemaHeader ? 'ml-2' : ''}>
          {/* Tables Section */}
          {schemaInfo.tables.length > 0 && (
            <div>
              <button
                onClick={() => onToggleSection(tablesKey)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-base flex w-full items-center gap-1.5 px-2 py-1 font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {tablesExpanded ? (
                  <ChevronDown className="h-2.5 w-2.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5 transition-transform" />
                )}
                {t('schema.tables')}
                <span className="text-muted-foreground/60 font-normal">
                  ({schemaInfo.tables.length})
                </span>
              </button>
              {tablesExpanded && (
                <div className="ml-2 min-w-0">
                  {schemaInfo.tables.map((table, idx) => {
                    const itemIdx = getItemIndex(schemaInfo.name, 'table', idx);
                    const tableKey = getTableKey(
                      connectionPath,
                      table.schema,
                      table.name
                    );
                    const metadata = getTableMetadata(tableKey);
                    return (
                      <TableItem
                        key={`${table.schema}:${table.name}`}
                        table={table}
                        isSelected={
                          selectedTable?.name === table.name &&
                          selectedTable?.schema === table.schema
                        }
                        isFocused={appVimMode && focusedIndex === itemIdx}
                        onClick={() => onSelectTable(table)}
                        onCopyTableName={() => onCopyTableName(table)}
                        onCopyCreateStatement={() =>
                          onCopyCreateStatement(table)
                        }
                        onOpenInQueryEditor={() => onOpenInQueryEditor(table)}
                        onExportSchema={onExportSchema}
                        onTruncateTable={() => onTruncateTable(table)}
                        onDropTable={() => onDropTable(table)}
                        onGenerateMockData={() => onGenerateMockData(table)}
                        tableKey={tableKey}
                        tableTags={getTagsByIds(metadata.tagIds)}
                        isPinned={metadata.pinned}
                        allTags={tags}
                        onAddTag={(tagName) => onAddTableTag(tableKey, tagName)}
                        onRemoveTag={(tagName) =>
                          onRemoveTableTag(tableKey, tagName)
                        }
                        onTogglePinned={() =>
                          onTogglePinned(tableKey, !metadata.pinned)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Views Section */}
          {schemaInfo.views.length > 0 && (
            <div>
              <button
                onClick={() => onToggleSection(viewsKey)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-base flex w-full items-center gap-1.5 px-2 py-1 font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {viewsExpanded ? (
                  <ChevronDown className="h-2.5 w-2.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5 transition-transform" />
                )}
                {t('schema.views')}
                <span className="text-muted-foreground/60 font-normal">
                  ({schemaInfo.views.length})
                </span>
              </button>
              {viewsExpanded && (
                <div className="ml-2 min-w-0">
                  {schemaInfo.views.map((view, idx) => {
                    const itemIdx = getItemIndex(schemaInfo.name, 'view', idx);
                    const tableKey = getTableKey(
                      connectionPath,
                      view.schema,
                      view.name
                    );
                    const metadata = getTableMetadata(tableKey);
                    return (
                      <TableItem
                        key={`${view.schema}:${view.name}`}
                        table={view}
                        isSelected={
                          selectedTable?.name === view.name &&
                          selectedTable?.schema === view.schema
                        }
                        isFocused={appVimMode && focusedIndex === itemIdx}
                        onClick={() => onSelectTable(view)}
                        onCopyTableName={() => onCopyTableName(view)}
                        onCopyCreateStatement={() =>
                          onCopyCreateStatement(view)
                        }
                        onOpenInQueryEditor={() => onOpenInQueryEditor(view)}
                        onExportSchema={onExportSchema}
                        onTruncateTable={() => onTruncateTable(view)}
                        onDropTable={() => onDropTable(view)}
                        onGenerateMockData={() => onGenerateMockData(view)}
                        isView
                        tableKey={tableKey}
                        tableTags={getTagsByIds(metadata.tagIds)}
                        isPinned={metadata.pinned}
                        allTags={tags}
                        onAddTag={(tagName) => onAddTableTag(tableKey, tagName)}
                        onRemoveTag={(tagName) =>
                          onRemoveTableTag(tableKey, tagName)
                        }
                        onTogglePinned={() =>
                          onTogglePinned(tableKey, !metadata.pinned)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Triggers Section */}
          {schemaInfo.triggers.length > 0 && (
            <div>
              <button
                onClick={() => onToggleSection(triggersKey)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-base flex w-full items-center gap-1.5 px-2 py-1 font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {triggersExpanded ? (
                  <ChevronDown className="h-2.5 w-2.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5 transition-transform" />
                )}
                {t('schema.triggers')}
                <span className="text-muted-foreground/60 font-normal">
                  ({schemaInfo.triggers.length})
                </span>
              </button>
              {triggersExpanded && (
                <div className="ml-2 min-w-0">
                  {schemaInfo.triggers.map((trigger) => (
                    <TriggerItem
                      key={`${schemaInfo.name}:${trigger.name}`}
                      trigger={trigger}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TableItemProps {
  table: TableSchema;
  isSelected: boolean;
  isFocused?: boolean;
  onClick: () => void;
  onCopyTableName: () => void;
  onCopyCreateStatement: () => void;
  onOpenInQueryEditor: () => void;
  onExportSchema: () => void;
  onTruncateTable: () => void;
  onDropTable: () => void;
  onGenerateMockData: () => void;
  isView?: boolean;
  // Tag and organization props
  tableKey: string;
  tableTags: TagDefinition[];
  isPinned?: boolean;
  allTags: TagDefinition[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
  onTogglePinned: () => void;
}

function TableItem({
  table,
  isSelected,
  isFocused,
  onClick,
  onCopyTableName,
  onCopyCreateStatement,
  onOpenInQueryEditor,
  onExportSchema,
  onTruncateTable,
  onDropTable,
  onGenerateMockData,
  isView,
  tableTags,
  isPinned,
  allTags,
  onAddTag,
  onRemoveTag,
  onTogglePinned,
}: TableItemProps) {
  const [newTagInput, setNewTagInput] = useState('');
  const { t } = useTranslation('sidebar');

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      onAddTag(newTagInput.trim());
      setNewTagInput('');
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          onClick={onClick}
          className={cn(
            'rounded-base flex w-full cursor-pointer items-center gap-1.5 overflow-hidden px-2 py-0.5 transition-colors',
            isSelected
              ? 'bg-main/15 text-main font-medium'
              : 'hover:bg-muted text-foreground',
            isFocused && !isSelected && 'ring-main ring-2 ring-inset'
          )}
        >
          {isPinned && <Pin className="text-main h-3 w-3 shrink-0" />}
          {isView ? (
            <Eye
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isSelected ? 'text-main' : 'text-muted-foreground'
              )}
            />
          ) : (
            <Table
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isSelected ? 'text-main' : 'text-muted-foreground'
              )}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-left">
            {table.name}
          </span>
          {tableTags.length > 0 && (
            <div className="flex shrink-0 gap-0.5">
              {tableTags.slice(0, 2).map((tag) => (
                <ColoredTagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {tableTags.length > 2 && (
                <Badge variant="outline" className="text-2xs h-4 px-1">
                  +{tableTags.length - 2}
                </Badge>
              )}
            </div>
          )}
          {table.rowCount !== undefined && (
            <span
              className={cn(
                'shrink-0 tabular-nums',
                isSelected ? 'text-main' : 'text-muted-foreground'
              )}
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {table.rowCount.toLocaleString()}
            </span>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onOpenInQueryEditor}>
          <FileSearch className="size-4" />
          {t('contextMenu.openInQueryEditor', {
            defaultValue: 'Open in Query Editor',
          })}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onTogglePinned}>
          {isPinned ? (
            <>
              <PinOff className="size-4" />
              {t('contextMenu.unpin', { defaultValue: 'Unpin' })}
            </>
          ) : (
            <>
              <Pin className="size-4" />
              {t('contextMenu.pinToTop', { defaultValue: 'Pin to Top' })}
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger nativeButton={false}>
            <Tag className="size-4" />
            {t('contextMenu.tags', { defaultValue: 'Tags' })}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {tableTags.length > 0 && (
              <>
                <div
                  className="text-muted-foreground px-2 py-1 font-medium"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('contextMenu.currentTags', {
                    defaultValue: 'Current Tags',
                  })}
                </div>
                {tableTags.map((tag) => (
                  <ContextMenuItem
                    key={tag.id}
                    onClick={() => onRemoveTag(tag.name)}
                  >
                    <X className="text-destructive size-4" />
                    <TagColorDot color={tag.color} className="mr-1" />
                    {tag.name}
                  </ContextMenuItem>
                ))}
                <ContextMenuSeparator />
              </>
            )}
            {/* Available tags to add */}
            {allTags.filter((t) => !tableTags.some((tt) => tt.id === t.id))
              .length > 0 && (
              <>
                <div
                  className="text-muted-foreground px-2 py-1 font-medium"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('contextMenu.addTag', { defaultValue: 'Add Tag' })}
                </div>
                {allTags
                  .filter((t) => !tableTags.some((tt) => tt.id === t.id))
                  .map((tag) => (
                    <ContextMenuItem
                      key={tag.id}
                      onClick={() => onAddTag(tag.name)}
                    >
                      <TagColorDot color={tag.color} className="mr-1" />
                      {tag.name}
                    </ContextMenuItem>
                  ))}
                <ContextMenuSeparator />
              </>
            )}
            {/* Create new tag */}
            <div className="p-2">
              <div className="flex gap-1">
                <Input
                  placeholder={t('contextMenu.newTagPlaceholder', {
                    defaultValue: 'New tag...',
                  })}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                  className="h-7"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={handleAddNewTag}
                  disabled={!newTagInput.trim()}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCopyTableName}>
          <Copy className="size-4" />
          {t('contextMenu.copyName', { defaultValue: 'Copy Name' })}
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyCreateStatement} disabled={!table.sql}>
          <Code className="size-4" />
          {t('contextMenu.copyCreateStatement', {
            defaultValue: 'Copy CREATE Statement',
          })}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onExportSchema}>
          <FileDown className="size-4" />
          {t('contextMenu.exportSchema', { defaultValue: 'Export Schema' })}
          <ShortcutKbd action="action.export-data" className="ml-auto" />
        </ContextMenuItem>
        {!isView && (
          <ContextMenuItem onClick={onGenerateMockData}>
            <Dices className="size-4" />
            {t('contextMenu.generateMockData', {
              defaultValue: 'Generate Mock Data',
            })}
          </ContextMenuItem>
        )}
        {!isView && (
          <ContextMenuItem onClick={onTruncateTable}>
            <Trash2 className="size-4" />
            {t('contextMenu.truncateTable', { defaultValue: 'Truncate Table' })}
          </ContextMenuItem>
        )}
        <ContextMenuItem variant="destructive" onClick={onDropTable}>
          <Trash2 className="size-4" />
          {isView
            ? t('contextMenu.dropView', { defaultValue: 'Drop View' })
            : t('contextMenu.dropTable', { defaultValue: 'Drop Table' })}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface TriggerItemProps {
  trigger: TriggerSchema;
}

function TriggerItem({ trigger }: TriggerItemProps) {
  return (
    <div
      className="text-foreground hover:bg-muted/50 flex w-full items-center gap-1.5 rounded-md px-2 py-0.5 transition-colors"
      style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.95)' }}
    >
      <Zap className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{trigger.name}</span>
      <span
        className="text-muted-foreground/60 ml-auto"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        {trigger.timing} {trigger.event}
      </span>
    </div>
  );
}

// Combined Filter & Tags Popover Component
interface FilterTagsPopoverProps {
  tags: TagDefinition[];
  activeTagFilter: string | null;
  onSetActiveTagFilter: (tagId: string | null) => void;
  onCreateTag: (name: string, color?: string) => string;
  onUpdateTag: (id: string, updates: { name?: string; color?: string }) => void;
  onDeleteTag: (id: string) => void;
}

function FilterTagsPopover({
  tags,
  activeTagFilter,
  onSetActiveTagFilter,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}: FilterTagsPopoverProps) {
  const { t } = useTranslation('sidebar');
  const [activeTab, setActiveTab] = useState<'filter' | 'manage'>('filter');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagDefinition | null>(null);

  // Get active tag name for display
  const activeTag = tags.find((t) => t.id === activeTagFilter);

  const handleCreateTag = (name: string, color: string) => {
    onCreateTag(name, color);
  };

  const handleUpdateTag = (
    id: string,
    updates: { name?: string; color?: string }
  ) => {
    onUpdateTag(id, updates);
  };

  const handleDeleteTag = (id: string) => {
    onDeleteTag(id);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger
          nativeButton
          render={
            <Button
              variant={activeTagFilter ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 shrink-0 gap-1 px-2"
            >
              <Filter className="h-3.5 w-3.5 shrink-0" />
              {activeTag ? (
                <Badge
                  variant="secondary"
                  className="h-5 max-w-15 gap-1 truncate px-1"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  <TagColorDot
                    color={activeTag.color}
                    className="h-1.5 w-1.5"
                  />
                  {activeTag.name}
                </Badge>
              ) : (
                <span
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('filter.filter')}
                </span>
              )}
              {!activeTagFilter && tags.length > 0 && (
                <Badge variant="outline" className="text-2xs h-4 px-1">
                  {tags.length}
                </Badge>
              )}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-56 p-0">
          {/* Tab Header */}
          <div className="flex gap-1 p-1">
            <button
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 font-medium transition-colors',
                activeTab === 'filter'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              onClick={() => setActiveTab('filter')}
            >
              {t('filter.filter')}
            </button>
            <button
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 font-medium transition-colors',
                activeTab === 'manage'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              onClick={() => setActiveTab('manage')}
            >
              {t('filter.manageTags')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-2">
            {activeTab === 'filter' ? (
              <div className="space-y-1">
                {tags.length === 0 ? (
                  <div
                    className="text-muted-foreground py-2 text-center"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('filter.noTags')}
                    <br />
                    {t('filter.goToManageTags')}
                  </div>
                ) : (
                  <>
                    {activeTagFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-full justify-start gap-2 px-2"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                        onClick={() => onSetActiveTagFilter(null)}
                      >
                        <X className="h-3 w-3" />
                        {t('filter.clearFilter')}
                      </Button>
                    )}
                    {tags.map((tag) => (
                      <Button
                        key={tag.id}
                        variant={
                          activeTagFilter === tag.id ? 'secondary' : 'ghost'
                        }
                        size="sm"
                        className="h-7 w-full justify-start gap-2 px-2"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                        onClick={() =>
                          onSetActiveTagFilter(
                            activeTagFilter === tag.id ? null : tag.id
                          )
                        }
                      >
                        <TagColorDot color={tag.color} />
                        {tag.name}
                        {activeTagFilter === tag.id && (
                          <Check className="ml-auto h-3 w-3" />
                        )}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Create new tag button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-full justify-start gap-2"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3" />
                  {t('tags.createTag', { defaultValue: 'Create Tag' })}
                </Button>

                {/* Existing tags */}
                {tags.length > 0 ? (
                  <ScrollArea className="h-32">
                    <div className="space-y-0.5">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="hover:bg-muted/50 group flex items-center justify-between rounded px-2 py-1"
                        >
                          <div className="flex items-center gap-2">
                            <TagColorDot color={tag.color} />
                            <span
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {tag.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground focus:opacity-100 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => setEditingTag(tag)}
                            aria-label={t('tags.editTag', { defaultValue: 'Edit Tag' })}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('filter.noTagsYet')}
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Create Tag Dialog */}
      <CreateTagDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTag={handleCreateTag}
        existingTagNames={tags.map((t) => t.name.toLowerCase())}
      />

      {/* Edit Tag Dialog */}
      <EditTagDialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
        tag={editingTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
        existingTagNames={tags.map((t) => t.name.toLowerCase())}
      />
    </>
  );
}

import type { QueryParameter, SavedQuery } from '@shared/types/saved-query';
import type {
  QueryTemplate,
  TemplateCategory,
} from '@/stores/query-templates-store';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { GoldButton } from '@sqlpro/ui/gold-button';
import { Input } from '@sqlpro/ui/input';
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel as ResizablePanelUI,
} from '@sqlpro/ui/resizable';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import {
  AlertCircle,
  CheckSquare,
  Clock,
  Code,
  Copy,
  FileDown,
  FileText,
  FileUp,
  FolderOpen,
  History,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Plus,
  Save,
  Search,
  Share2,
  Square,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsDialog } from '@/components/SettingsDialog';
import {
  QueryBundleExportDialog,
  QueryExportDialog,
  QueryImportDialog,
} from '@/components/sharing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShortcutKbd } from '@/components/ui/kbd';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { sqlPro } from '@/lib/api';
import { generateSuggestions } from '@/lib/query-plan-analyzer';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useQueryHistoryStore } from '@/stores/query-history-store';
import { useQueryStore } from '@/stores/query-store';
import { useQueryTabsStore } from '@/stores/query-tabs-store';
import {
  TEMPLATE_CATEGORIES,
  useQueryTemplatesStore,
} from '@/stores/query-templates-store';
import {
  parseParameters,
  substituteParameters,
  useSavedQueriesStore,
} from '@/stores/saved-queries-store';
import { QueryOptimizerPanel } from './data-tools/QueryOptimizerPanel';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { QueryHistoryFilters } from './query-editor/QueryHistoryFilters';
import { QueryPane } from './query-editor/QueryPane';
import { QueryTabBar } from './query-editor/QueryTabBar';
import { NewTemplateDialog } from './query-editor/QueryTemplatesPicker';
import { SkeletonQueryResults } from './query-editor/SkeletonQueryResults';
import { QueryResults } from './QueryResults';
import { ResizablePanel } from './ResizablePanel';
import {
  ParameterInputDialog,
  SavedQueriesBrowser,
  SaveQueryDialog,
} from './saved-queries';

/** Side panel tab options */
type SidePanelTab = 'share' | 'templates' | 'history';

/** Template category color mapping */
const CATEGORY_COLORS: Record<TemplateCategory | 'all', string> = {
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  select: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  insert:
    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  update:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  schema:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  analysis: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  maintenance: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  custom: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
};

/** Template card component for displaying a single template */
interface TemplateCardProps {
  template: QueryTemplate;
  onSelect: (query: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function TemplateCard({
  template,
  onSelect,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const { t } = useTranslation('common');
  return (
    <div
      className={cn(
        'group hover:border-primary/50 hover:bg-accent/30 relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all duration-200',
        template.isBuiltIn && 'border-dashed'
      )}
      onClick={() => onSelect(template.query)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {template.isBuiltIn ? (
            <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          ) : (
            <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate text-sm font-medium">{template.name}</span>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            'text-2xs shrink-0 font-medium',
            CATEGORY_COLORS[template.category]
          )}
        >
          {template.category}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
        {template.description}
      </p>

      {/* Code Preview */}
      <SqlHighlight
        code={template.query}
        maxLines={2}
        className="bg-muted/50 rounded-md p-2 text-xs"
      />

      {/* Actions - appear on hover */}
      <div className="bg-background/80 absolute top-2 right-2 flex items-center gap-0.5 rounded-md opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(template.id);
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
              {t('queryTemplates.duplicateTemplate')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!template.isBuiltIn && (
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('queryTemplates.deleteTemplate')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

/**
 * Formats duration in milliseconds to a readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted string like '234ms' or '1.2s'
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function QueryEditor() {
  const { t } = useTranslation('common');
  const { connection, schema, activeConnectionId } = useConnectionStore();
  const {
    currentQuery,
    results,
    error,
    isExecuting,
    executionTime,
    history,
    setCurrentQuery,
    setResults,
    setError,
    setIsExecuting,
    setExecutionTime,
    addToHistory,
    loadHistory,
    deleteHistoryItem,
    clearHistory,
  } = useQueryStore();

  // Multi-tab state - now connection-aware
  const {
    getActiveTab,
    updateTabQuery,
    updateTabResults,
    updateTabError,
    setTabExecuting,
    setActiveConnectionId: setTabsActiveConnection,
    isSplit,
    closeSplit,
    setActivePaneId,
    tabsByConnection,
  } = useQueryTabsStore();

  // Get connection-specific tab state
  const connectionTabState = activeConnectionId
    ? tabsByConnection[activeConnectionId]
    : null;
  const activeTabId = connectionTabState?.activeTabId || null;
  const splitLayout = connectionTabState?.splitLayout || {
    direction: null,
    panes: [],
  };
  const activePaneId = connectionTabState?.activePaneId || 'pane-main';

  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('history');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showQueryExport, setShowQueryExport] = useState(false);
  const [showQueryImport, setShowQueryImport] = useState(false);
  const [showQueryBundleExport, setShowQueryBundleExport] = useState(false);
  const [historySelectionMode, setHistorySelectionMode] = useState(false);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(
    () => new Set()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Saved queries state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<SavedQuery | null>(null);
  const [pendingParams, setPendingParams] = useState<QueryParameter[]>([]);
  const { recordExecution } = useSavedQueriesStore();

  // Query templates store
  const {
    searchQuery: templateSearchQuery,
    selectedCategory,
    setSearchQuery: setTemplateSearchQuery,
    setSelectedCategory,
    getFilteredTemplates,
    duplicateTemplate,
    deleteTemplate,
  } = useQueryTemplatesStore();

  // Query history filter store
  const historyFilter = useQueryHistoryStore((state) => state.filter);
  const setHistoryFilter = useQueryHistoryStore((state) => state.setFilter);
  const getFilteredHistory = useQueryHistoryStore(
    (state) => state.getFilteredHistory
  );
  const getActiveFilterCount = useQueryHistoryStore(
    (state) => state.getActiveFilterCount
  );

  // Check if in split view mode
  const isSplitView = activeConnectionId ? isSplit(activeConnectionId) : false;

  // Get active tab state
  const activeTab = getActiveTab(activeConnectionId || undefined);
  const tabQuery = activeTab?.query ?? currentQuery;
  const tabResults = activeTab?.results ?? results;
  const tabError = activeTab?.error ?? error;
  const tabIsExecuting = activeTab?.isExecuting ?? isExecuting;
  const tabExecutionTime = activeTab?.executionTime ?? executionTime;

  // Initialize tabs when connection changes
  useEffect(() => {
    if (activeConnectionId) {
      setTabsActiveConnection(activeConnectionId);
    }
  }, [activeConnectionId, setTabsActiveConnection]);

  // Filter history using the query history store
  // Note: historyFilter dependency is needed to trigger re-computation when filters change,
  // even though it's not directly used in the callback (getFilteredHistory accesses it via store)
  const filteredHistory = useMemo(() => {
    return getFilteredHistory(history);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, getFilteredHistory, historyFilter]);

  // Load history when connection changes
  useEffect(() => {
    if (connection?.path) {
      loadHistory(connection.path);
    }
  }, [connection?.path, loadHistory]);

  // Keyboard shortcuts for history toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // History toggle: Cmd/Ctrl+H
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && !e.shiftKey) {
        e.preventDefault();
        if (showSidePanel) {
          setShowSidePanel(false);
        } else {
          setShowSidePanel(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSidePanel]);

  const handleExecute = useCallback(async () => {
    if (!connection || !activeConnectionId || !tabQuery.trim() || !activeTabId)
      return;

    setTabExecuting(activeConnectionId, activeTabId, true);
    setIsExecuting(true);
    setError(null);
    setResults(null);
    updateTabError(activeConnectionId, activeTabId, null);

    try {
      const result = await sqlPro.db.executeQuery({
        connectionId: connection.id,
        query: tabQuery.trim(),
      });

      if (result.success) {
        const queryResult = {
          columns: result.columns || [],
          rows: result.rows || [],
          rowsAffected: result.rowsAffected || result.totalChanges || 0,
          lastInsertRowId: result.lastInsertRowId,
          executedStatements: result.executedStatements,
          resultSets: result.resultSets,
        };
        setResults(queryResult);
        setExecutionTime(result.executionTime || 0);
        updateTabResults(
          activeConnectionId,
          activeTabId,
          queryResult,
          result.executionTime || 0
        );
        addToHistory(
          connection.path,
          tabQuery.trim(),
          true,
          result.executionTime || 0
        );
      } else {
        setError(result.error || t('queryEditor.queryFailed'));
        updateTabError(
          activeConnectionId,
          activeTabId,
          result.error || t('queryEditor.queryFailed')
        );
        addToHistory(connection.path, tabQuery.trim(), false, 0, result.error);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('queryEditor.unknownError');
      setError(errorMessage);
      updateTabError(activeConnectionId, activeTabId, errorMessage);
      addToHistory(connection.path, tabQuery.trim(), false, 0, errorMessage);
    } finally {
      setTabExecuting(activeConnectionId, activeTabId, false);
      setIsExecuting(false);
    }
  }, [
    connection,
    activeConnectionId,
    tabQuery,
    activeTabId,
    setTabExecuting,
    setIsExecuting,
    setError,
    setResults,
    updateTabError,
    setExecutionTime,
    updateTabResults,
    addToHistory,
    t,
  ]);

  const handleQueryChange = useCallback(
    (query: string) => {
      setCurrentQuery(query);
      if (activeConnectionId && activeTabId) {
        updateTabQuery(activeConnectionId, activeTabId, query);
      }
    },
    [activeConnectionId, activeTabId, setCurrentQuery, updateTabQuery]
  );

  const handleTemplateSelect = useCallback(
    (query: string) => {
      handleQueryChange(query);
    },
    [handleQueryChange]
  );

  const handleHistorySelect = (query: string) => {
    handleQueryChange(query);
    setShowSidePanel(false);
  };

  const handleHistoryDelete = (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (connection?.path) {
      deleteHistoryItem(connection.path, entryId);
    }
  };

  const handleClearAllHistory = () => {
    if (connection?.path) {
      clearHistory(connection.path);
      setShowClearConfirm(false);
    }
  };

  const handleEnterSelectionMode = () => {
    setHistorySelectionMode(true);
    setSelectedHistoryIds(new Set());
  };

  const handleExitSelectionMode = () => {
    setHistorySelectionMode(false);
    setSelectedHistoryIds(new Set());
  };

  const handleToggleHistoryItem = (itemId: string) => {
    setSelectedHistoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAllHistory = () => {
    setSelectedHistoryIds(new Set(filteredHistory.map((item) => item.id)));
  };

  const handleDeselectAllHistory = () => {
    setSelectedHistoryIds(new Set());
  };

  const handleExportSelected = () => {
    if (selectedHistoryIds.size === 0) return;
    setShowQueryBundleExport(true);
  };

  // Saved queries handlers
  const handleSelectSavedQuery = useCallback(
    (query: SavedQuery) => {
      handleQueryChange(query.query);
    },
    [handleQueryChange]
  );

  const handleRunSavedQuery = useCallback(
    (query: SavedQuery) => {
      const params = parseParameters(query.query);
      if (params.length > 0) {
        // Has parameters - show parameter dialog
        setPendingQuery(query);
        setPendingParams(params);
        setParamDialogOpen(true);
      } else {
        // No parameters - load and execute directly
        handleQueryChange(query.query);
        recordExecution(query.id);
        // Execute after state update
        setTimeout(() => {
          const executeBtn = document.querySelector(
            '[data-action="execute-query"]'
          );
          if (executeBtn instanceof HTMLButtonElement) {
            executeBtn.click();
          }
        }, 0);
      }
    },
    [handleQueryChange, recordExecution]
  );

  const handleParameterSubmit = useCallback(
    (values: Record<string, string>) => {
      if (!pendingQuery) return;

      const substitutedQuery = substituteParameters(pendingQuery.query, values);
      handleQueryChange(substitutedQuery);
      recordExecution(pendingQuery.id);

      // Execute after state update
      setTimeout(() => {
        const executeBtn = document.querySelector(
          '[data-action="execute-query"]'
        );
        if (executeBtn instanceof HTMLButtonElement) {
          executeBtn.click();
        }
      }, 0);

      setPendingQuery(null);
      setPendingParams([]);
    },
    [pendingQuery, handleQueryChange, recordExecution]
  );

  const handleAnalyze = useCallback(
    async (query: string) => {
      if (!connection) {
        throw new Error(t('queryEditor.noDbConnection'));
      }

      const result = await sqlPro.db.analyzeQueryPlan({
        connectionId: connection.id,
        query: query.trim(),
      });

      if (!result.success || !result.plan || !result.stats) {
        throw new Error(result.error || t('queryEditor.failedToAnalyze'));
      }

      const suggestions = generateSuggestions(result.plan, result.stats);

      return {
        plan: result.plan,
        stats: result.stats,
        suggestions,
      };
    },
    [connection, t]
  );

  return (
    <div ref={containerRef} className="relative flex h-full flex-col">
      {/* Tab Bar */}
      <QueryTabBar />

      {/* Editor Header */}
      <div className="flex min-w-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="toolbar-section">
          <h2 className="font-medium">{t('queryEditor.title')}</h2>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {t('queryEditor.executeHint')}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
          {/* Saved Queries Buttons */}
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!tabQuery.trim()}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t('savedQueries.save', { defaultValue: 'Save' })}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('savedQueries.saveTitle', { defaultValue: 'Save Query' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBrowserOpen(true)}
                  className="gap-1"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t('savedQueries.browse', { defaultValue: 'Saved' })}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('savedQueries.title', { defaultValue: 'Saved Queries' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Side Panel Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="gap-1"
            data-action="toggle-side-panel"
          >
            {showSidePanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
            {t('queryEditor.sidePanel')}
            <ShortcutKbd action="view.toggle-history" className="ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptimizer(true)}
            disabled={!tabQuery.trim()}
            className="gap-1"
            title={t('queryEditor.analyzeQueryPlan')}
          >
            <Zap className="h-4 w-4" />
            {t('queryEditor.analyze')}
          </Button>
          <GoldButton
            size="sm"
            onClick={handleExecute}
            disabled={tabIsExecuting || !tabQuery.trim()}
            className="gap-1"
            data-action="execute-query"
          >
            {tabIsExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {t('queryEditor.execute')}
          </GoldButton>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 overflow-hidden">
        {/* Split View Mode */}
        {isSplitView ? (
          <ResizablePanelGroup
            direction={splitLayout.direction as 'horizontal' | 'vertical'}
            className="h-full"
          >
            {splitLayout.panes.map((pane, index) => (
              <React.Fragment key={pane.id}>
                {index > 0 && <ResizableHandle withHandle />}
                <ResizablePanelUI defaultSize={50} minSize={20}>
                  <QueryPane
                    pane={pane}
                    connectionId={connection?.id || ''}
                    schema={schema}
                    isActive={pane.id === activePaneId}
                    onActivate={() =>
                      activeConnectionId &&
                      setActivePaneId(activeConnectionId, pane.id)
                    }
                    onClose={
                      index > 0
                        ? () =>
                            activeConnectionId && closeSplit(activeConnectionId)
                        : undefined
                    }
                    showCloseButton={index > 0}
                  />
                </ResizablePanelUI>
              </React.Fragment>
            ))}
          </ResizablePanelGroup>
        ) : (
          /* Single Pane Mode */
          <>
            {/* Editor */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="shrink-0 border-b">
                <MonacoSqlEditor
                  value={tabQuery}
                  onChange={handleQueryChange}
                  onExecute={handleExecute}
                  schema={schema}
                />
              </div>

              {/* Results Area */}
              <div className="min-w-0 flex-1 overflow-hidden">
                {tabIsExecuting ? (
                  <SkeletonQueryResults columns={5} rows={10} />
                ) : tabError ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <div className="border-destructive/50 bg-destructive/10 flex max-w-md items-start gap-3 rounded-lg border p-4">
                      <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
                      <div>
                        <p className="text-destructive font-medium">
                          {t('queryEditor.queryError')}
                        </p>
                        <p className="text-destructive/80 mt-1 text-sm">
                          {tabError}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : tabResults ? (
                  <div className="flex h-full flex-col">
                    {/* Results Header */}
                    <div className="text-muted-foreground flex items-center gap-4 border-b px-4 py-2 text-sm">
                      {tabResults.resultSets &&
                      tabResults.resultSets.length > 1 ? (
                        <span>
                          {tabResults.executedStatements
                            ? t('queryEditor.resultSetsWithStatements', {
                                count: tabResults.resultSets.length,
                                statements: tabResults.executedStatements,
                              })
                            : t('queryEditor.resultSets', {
                                count: tabResults.resultSets.length,
                              })}
                        </span>
                      ) : tabResults.executedStatements &&
                        tabResults.executedStatements > 1 ? (
                        <span>
                          {tabResults.rowsAffected > 0
                            ? t('queryEditor.statementsWithRows', {
                                count: tabResults.executedStatements,
                                rows: tabResults.rowsAffected,
                              })
                            : t('queryEditor.statementsExecuted', {
                                count: tabResults.executedStatements,
                              })}
                        </span>
                      ) : (
                        <span>
                          {tabResults.rows.length > 0
                            ? t('queryEditor.rowsCount', {
                                count: tabResults.rows.length,
                              })
                            : tabResults.rowsAffected > 0
                              ? t('queryEditor.rowsAffected', {
                                  count: tabResults.rowsAffected,
                                })
                              : t('queryEditor.queryExecuted')}
                        </span>
                      )}
                      {tabExecutionTime !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tabExecutionTime.toFixed(2)}ms
                        </span>
                      )}
                      {tabResults.lastInsertRowId !== undefined &&
                        tabResults.lastInsertRowId > 0 && (
                          <span>
                            {t('queryEditor.lastInsertId', {
                              id: tabResults.lastInsertRowId,
                            })}
                          </span>
                        )}
                    </div>
                    {/* Results Table */}
                    <div className="h-0 min-w-0 flex-1 overflow-hidden">
                      <QueryResults results={tabResults} />
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <p>{t('queryEditor.noResults')}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Side Panel (Share, Templates, History) - Resizable */}
        {showSidePanel && (
          <ResizablePanel
            side="right"
            defaultWidth={650}
            minWidth={550}
            maxWidth={1000}
            storageKey="query-side-panel-v3"
          >
            <div className="bg-background flex h-full flex-col border-l">
              {/* Header with Tabs */}
              <Tabs
                value={sidePanelTab}
                onValueChange={(v) => setSidePanelTab(v as SidePanelTab)}
                className="flex h-full flex-col"
              >
                <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
                  <TabsList className="h-8 p-1">
                    <TabsTrigger
                      value="share"
                      className="h-6 gap-1.5 px-3 text-xs"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {t('queryEditor.share')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="templates"
                      className="h-6 gap-1.5 px-3 text-xs"
                    >
                      <Code className="h-3.5 w-3.5" />
                      {t('queryEditor.templates')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="h-6 gap-1.5 px-3 text-xs"
                    >
                      <History className="h-3.5 w-3.5" />
                      {t('queryEditor.history')}
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSidePanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Share Tab */}
                <TabsContent
                  value="share"
                  className="mt-0 flex-1 overflow-hidden"
                >
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-medium">
                        {t('queryEditor.exportQuery')}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {t('queryEditor.exportQueryDesc', {
                          defaultValue:
                            'Export current query as JSON or SQL file',
                        })}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowQueryExport(true)}
                        disabled={!tabQuery.trim()}
                      >
                        <FileDown className="h-4 w-4" />
                        {t('queryEditor.exportQuery')}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-medium">
                        {t('queryEditor.importQuery')}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {t('queryEditor.importQueryDesc', {
                          defaultValue: 'Import query from JSON or SQL file',
                        })}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setShowQueryImport(true)}
                      >
                        <FileUp className="h-4 w-4" />
                        {t('queryEditor.importQuery')}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="mt-0 min-h-0 flex-1">
                  <div className="flex h-full flex-col">
                    {/* Search and Filter */}
                    <div className="shrink-0 border-b px-3 py-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                          <Input
                            placeholder={t('queryTemplates.searchPlaceholder')}
                            value={templateSearchQuery}
                            onChange={(e) =>
                              setTemplateSearchQuery(e.target.value)
                            }
                            className="h-8 pl-8 text-sm"
                          />
                          {templateSearchQuery && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1/2 right-1 h-5 w-5 -translate-y-1/2"
                              onClick={() => setTemplateSearchQuery('')}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Select
                            value={selectedCategory}
                            onValueChange={(v) =>
                              setSelectedCategory(v as TemplateCategory | 'all')
                            }
                          >
                            <SelectTrigger className="h-8 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => setShowNewTemplateDialog(true)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {t('queryTemplates.new')}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Template Grid */}
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="p-3">
                        {getFilteredTemplates().length === 0 ? (
                          <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                            <FileText className="mb-3 h-10 w-10 opacity-40" />
                            <p className="text-sm font-medium">
                              {t('queryTemplates.noTemplatesFound')}
                            </p>
                            <p className="text-xs opacity-70">
                              {t('queryTemplates.tryAdjustingSearch')}
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {getFilteredTemplates().map((template) => (
                              <TemplateCard
                                key={template.id}
                                template={template}
                                onSelect={handleTemplateSelect}
                                onDuplicate={duplicateTemplate}
                                onDelete={deleteTemplate}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-0 min-h-0 flex-1">
                  <div className="flex h-full flex-col">
                    {/* History Header Actions */}
                    <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
                      <span className="text-muted-foreground text-xs">
                        {historySelectionMode
                          ? t('queryEditor.selected', {
                              count: selectedHistoryIds.size,
                            })
                          : t('queryEditor.queryHistory')}
                      </span>
                      <div className="flex items-center gap-1">
                        {historySelectionMode ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={
                                selectedHistoryIds.size ===
                                filteredHistory.length
                                  ? handleDeselectAllHistory
                                  : handleSelectAllHistory
                              }
                              disabled={filteredHistory.length === 0}
                            >
                              {selectedHistoryIds.size ===
                              filteredHistory.length
                                ? t('queryEditor.deselectAll')
                                : t('queryEditor.selectAll')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              onClick={handleExportSelected}
                              disabled={selectedHistoryIds.size === 0}
                            >
                              <FileDown className="h-3 w-3" />
                              {t('queryEditor.export')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleExitSelectionMode}
                            >
                              {t('actions.cancel')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={handleEnterSelectionMode}
                              disabled={history.length === 0}
                              title={t('queryEditor.selectMultiple')}
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setShowClearConfirm(true)}
                              disabled={history.length === 0}
                              title={t('queryEditor.clearAllHistory')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="shrink-0 border-b px-3 py-2">
                      <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                        <Input
                          type="text"
                          placeholder={t('queryEditor.searchHistory')}
                          value={historyFilter.searchText || ''}
                          onChange={(e) =>
                            setHistoryFilter({
                              searchText: e.target.value || undefined,
                            })
                          }
                          className="h-8 pl-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* History Filters */}
                    <QueryHistoryFilters className="shrink-0 border-b" />

                    {/* History List */}
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="space-y-1 p-2">
                        {filteredHistory.length === 0 ? (
                          <p className="text-muted-foreground py-8 text-center text-sm">
                            {getActiveFilterCount() > 0
                              ? t('queryEditor.noMatchingQueries')
                              : t('queryEditor.noQueriesYet')}
                          </p>
                        ) : (
                          filteredHistory.map((item) => {
                            const isSelected = selectedHistoryIds.has(item.id);
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'hover:bg-accent group relative w-full rounded-md text-left text-sm transition-colors',
                                  !item.success &&
                                    'border-destructive border-l-2',
                                  historySelectionMode && 'px-2 py-2',
                                  !historySelectionMode && 'px-3 py-2'
                                )}
                              >
                                {historySelectionMode ? (
                                  <div
                                    className="flex cursor-pointer items-start gap-2"
                                    onClick={() =>
                                      handleToggleHistoryItem(item.id)
                                    }
                                  >
                                    <div className="pt-0.5">
                                      {isSelected ? (
                                        <CheckSquare className="text-primary h-4 w-4" />
                                      ) : (
                                        <Square className="text-muted-foreground h-4 w-4" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        {item.success ? (
                                          <span className="text-xs text-green-600">
                                            {formatDuration(
                                              item.durationMs ?? 0
                                            )}
                                          </span>
                                        ) : (
                                          <span className="text-destructive text-xs">
                                            Failed
                                          </span>
                                        )}
                                        <span className="text-muted-foreground text-xs">
                                          {new Date(
                                            item.executedAt ?? ''
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <SqlHighlight
                                        code={item.queryText ?? ''}
                                        maxLines={3}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleHistorySelect(
                                          item.queryText ?? ''
                                        )
                                      }
                                      className="w-full text-left"
                                    >
                                      <div className="flex items-center gap-2 pr-6">
                                        {item.success ? (
                                          <span className="text-xs text-green-600">
                                            {formatDuration(
                                              item.durationMs ?? 0
                                            )}
                                          </span>
                                        ) : (
                                          <span className="text-destructive text-xs">
                                            Failed
                                          </span>
                                        )}
                                        <span className="text-muted-foreground text-xs">
                                          {new Date(
                                            item.executedAt ?? ''
                                          ).toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <SqlHighlight
                                        code={item.queryText ?? ''}
                                        maxLines={3}
                                        className="mt-1 pr-6"
                                      />
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                                      onClick={(e) =>
                                        handleHistoryDelete(e, item.id)
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('queryEditor.clearQueryHistory')}</DialogTitle>
            <DialogDescription>
              {t('queryEditor.clearHistoryDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleClearAllHistory}>
              {t('queryEditor.clearAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <NewTemplateDialog
        open={showNewTemplateDialog}
        onOpenChange={setShowNewTemplateDialog}
      />

      {/* Query Optimizer Panel */}
      <QueryOptimizerPanel
        open={showOptimizer}
        onOpenChange={setShowOptimizer}
        query={tabQuery}
        onAnalyze={handleAnalyze}
      />

      {/* AI: Settings Dialog */}
      <SettingsDialog open={showAISettings} onOpenChange={setShowAISettings} />

      {/* Query Export Dialog */}
      <QueryExportDialog
        open={showQueryExport}
        onOpenChange={setShowQueryExport}
        sql={tabQuery}
        initialDatabaseContext={connection?.filename || connection?.path || ''}
        onExportComplete={() => {
          setShowQueryExport(false);
        }}
      />

      {/* Query Import Dialog */}
      <QueryImportDialog
        open={showQueryImport}
        onOpenChange={setShowQueryImport}
        onImportComplete={(query) => {
          handleQueryChange(query.sql);
          setShowQueryImport(false);
        }}
      />

      {/* Query Bundle Export Dialog */}
      <QueryBundleExportDialog
        open={showQueryBundleExport}
        onOpenChange={setShowQueryBundleExport}
        queries={filteredHistory.filter((item) =>
          selectedHistoryIds.has(item.id)
        )}
        initialDatabaseContext={connection?.filename || connection?.path || ''}
        onExportComplete={() => {
          setShowQueryBundleExport(false);
          setHistorySelectionMode(false);
          setSelectedHistoryIds(new Set());
        }}
      />

      {/* Save Query Dialog */}
      <SaveQueryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        initialQuery={tabQuery}
      />

      {/* Saved Queries Browser */}
      <SavedQueriesBrowser
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        onSelect={handleSelectSavedQuery}
        onRun={handleRunSavedQuery}
      />

      {/* Parameter Input Dialog */}
      <ParameterInputDialog
        open={paramDialogOpen}
        onOpenChange={setParamDialogOpen}
        parameters={pendingParams}
        queryName={pendingQuery?.name || ''}
        onSubmit={handleParameterSubmit}
      />
    </div>
  );
}

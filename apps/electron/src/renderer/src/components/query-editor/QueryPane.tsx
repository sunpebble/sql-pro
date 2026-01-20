import type { SplitPane } from '@/stores/query-tabs-store';
import type { DatabaseSchema } from '@/types/database';
import { GoldButton } from '@sqlpro/ui';
import { Button } from '@sqlpro/ui/button';
import { AlertCircle, Clock, Loader2, Play, X, Zap } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';
import { generateSuggestions } from '@/lib/query-plan-analyzer';
import { cn } from '@/lib/utils';
import { useQueryTabsStore } from '@/stores/query-tabs-store';
import { QueryOptimizerPanel } from '../data-tools/QueryOptimizerPanel';
import { MonacoSqlEditor } from '../MonacoSqlEditor';
import { QueryResults } from '../QueryResults';

interface QueryPaneProps {
  pane: SplitPane;
  connectionId: string;
  schema: DatabaseSchema | null;
  isActive: boolean;
  onActivate: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const QueryPane = memo(
  ({
    pane,
    connectionId,
    schema,
    isActive,
    onActivate,
    onClose,
    showCloseButton = false,
  }: QueryPaneProps) => {
    const { t } = useTranslation('common');
    const {
      tabsByConnection,
      updateTabQuery,
      updateTabResults,
      updateTabError,
      setTabExecuting,
      setPaneActiveTab,
      updateTabCursorPosition,
      updateTabScrollTop,
    } = useQueryTabsStore();

    const [showOptimizer, setShowOptimizer] = useState(false);

    // Get tabs for this connection
    const connectionTabState = tabsByConnection[connectionId];
    const tabs = connectionTabState?.tabs || [];

    // Get the tab for this pane
    const tab = tabs.find((t) => t.id === pane.activeTabId);

    const handleQueryChange = useCallback(
      (query: string) => {
        if (tab) {
          updateTabQuery(connectionId, tab.id, query);
        }
      },
      [tab, connectionId, updateTabQuery]
    );

    const handleExecute = useCallback(async () => {
      if (!tab || !tab.query.trim()) return;

      setTabExecuting(connectionId, tab.id, true);
      updateTabError(connectionId, tab.id, null);

      try {
        const result = await sqlPro.db.executeQuery({
          connectionId,
          query: tab.query.trim(),
        });

        if (result.success) {
          const queryResult = {
            columns: result.columns || [],
            rows: result.rows || [],
            rowsAffected: result.rowsAffected || 0,
            lastInsertRowId: result.lastInsertRowId,
          };
          updateTabResults(
            connectionId,
            tab.id,
            queryResult,
            result.executionTime || 0
          );
        } else {
          updateTabError(
            connectionId,
            tab.id,
            result.error || t('query.queryFailed')
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t('common.unknownError');
        updateTabError(connectionId, tab.id, errorMessage);
      } finally {
        setTabExecuting(connectionId, tab.id, false);
      }
    }, [tab, connectionId, setTabExecuting, updateTabError, updateTabResults]);

    const handleAnalyze = useCallback(
      async (query: string) => {
        const result = await sqlPro.db.analyzeQueryPlan({
          connectionId,
          query: query.trim(),
        });

        if (!result.success || !result.plan || !result.stats) {
          throw new Error(result.error || t('query.failedToAnalyzeQuery'));
        }

        const suggestions = generateSuggestions(result.plan, result.stats);

        return {
          plan: result.plan,
          stats: result.stats,
          suggestions,
        };
      },
      [connectionId]
    );

    const handleTabSelect = useCallback(
      (tabId: string) => {
        setPaneActiveTab(connectionId, pane.id, tabId);
      },
      [connectionId, pane.id, setPaneActiveTab]
    );

    const handleCursorPositionChange = useCallback(
      (position: { line: number; column: number }) => {
        if (tab) {
          updateTabCursorPosition(connectionId, tab.id, position);
        }
      },
      [tab, connectionId, updateTabCursorPosition]
    );

    const handleScrollPositionChange = useCallback(
      (scrollTop: number) => {
        if (tab) {
          updateTabScrollTop(connectionId, tab.id, scrollTop);
        }
      },
      [tab, connectionId, updateTabScrollTop]
    );

    if (!tab) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center">
          <p>{t('queryTabs.noTabSelected')}</p>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex h-full min-w-0 flex-col',
          isActive && 'ring-gold/50 ring-2 ring-inset'
        )}
        onClick={onActivate}
      >
        {/* Pane Header with Tab Selector */}
        <div className="bg-muted/30 flex items-center justify-between border-b px-2 py-1">
          <div className="flex items-center gap-2">
            <select
              value={tab.id}
              onChange={(e) => handleTabSelect(e.target.value)}
              className="bg-background h-7 rounded border px-2 text-sm"
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setShowOptimizer(true)}
              disabled={!tab.query.trim()}
              title={t('queryEditor.analyzeQuery')}
            >
              <Zap className="h-3.5 w-3.5" />
            </Button>
            <GoldButton
              size="sm"
              className="h-7 gap-1 px-3"
              onClick={handleExecute}
              disabled={tab.isExecuting || !tab.query.trim()}
            >
              {tab.isExecuting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run
            </GoldButton>
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                title={t('queryEditor.closeSplit')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="shrink-0 border-b">
          <MonacoSqlEditor
            value={tab.query}
            onChange={handleQueryChange}
            onExecute={handleExecute}
            schema={schema}
            initialCursorPosition={tab.cursorPosition}
            initialScrollPosition={tab.scrollTop}
            onCursorPositionChange={handleCursorPositionChange}
            onScrollPositionChange={handleScrollPositionChange}
          />
        </div>

        {/* Results Area */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {tab.isExecuting ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : tab.error ? (
            <div className="flex h-full items-center justify-center p-4">
              <div className="border-destructive/50 bg-destructive/10 flex max-w-md items-start gap-3 rounded-lg border p-4">
                <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
                <div>
                  <p className="text-destructive font-medium">
                    {t('queryEditor.queryError')}
                  </p>
                  <p className="text-destructive/80 mt-1 text-sm">
                    {tab.error}
                  </p>
                </div>
              </div>
            </div>
          ) : tab.results ? (
            <div className="flex h-full flex-col">
              {/* Results Header */}
              <div className="text-muted-foreground flex items-center gap-4 border-b px-4 py-2 text-sm">
                <span>{tab.results.rowsAffected} rows</span>
                {tab.executionTime !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tab.executionTime.toFixed(2)}ms
                  </span>
                )}
              </div>
              {/* Results Table */}
              <div className="h-0 min-w-0 flex-1 overflow-hidden">
                <QueryResults results={tab.results} />
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p>{t('queryEditor.noResults')}</p>
            </div>
          )}
        </div>

        {/* Query Optimizer Panel */}
        <QueryOptimizerPanel
          open={showOptimizer}
          onOpenChange={setShowOptimizer}
          query={tab.query}
          onAnalyze={handleAnalyze}
        />
      </div>
    );
  }
);

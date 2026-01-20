import { Alert, AlertDescription, AlertTitle } from '@sqlpro/ui/alert';
import { Button } from '@sqlpro/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@sqlpro/ui/card';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import {
  AlertCircle,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Database,
  GitCompare,
  Keyboard,
  Loader2,
  Table2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { useConnectionStore, useDataDiffStore } from '@/stores';

interface DataDiffPanelProps {
  className?: string;
}

/**
 * Main container component for data diff feature.
 * Provides source/target table selection and displays comparison results.
 */
export function DataDiffPanel({ className }: DataDiffPanelProps) {
  const {
    source,
    target,
    comparisonResult,
    isComparing,
    comparisonError,
    filters,
    setSource,
    setTarget,
    setIsComparing,
    setComparisonError,
    setShowOnlyDifferences,
    resetFilters,
  } = useDataDiffStore();

  const { getAllConnections, getSchemaByConnectionId } = useConnectionStore();

  const connections = getAllConnections();

  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { t } = useTranslation('common');

  // Ref to hold handleCompare function for keyboard shortcuts
  const handleCompareRef = useRef<(() => void) | null>(null);

  // Get tables from schema for source connection
  const sourceTables = source?.connectionId
    ? getSchemaByConnectionId(source.connectionId)?.tables || []
    : [];

  // Get tables from schema for target connection
  const targetTables = target?.connectionId
    ? getSchemaByConnectionId(target.connectionId)?.tables || []
    : [];

  // Keyboard shortcuts for common comparison actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea or editable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Cmd/Ctrl+Enter to trigger comparison works even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          if (source && target && !isComparing) {
            handleCompareRef.current?.();
          }
        }
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'Enter':
            // Cmd/Ctrl+Enter: Run comparison
            e.preventDefault();
            if (source && target && !isComparing) {
              handleCompareRef.current?.();
            }
            break;
          case 'd':
          case 'D':
            // Cmd/Ctrl+D: Toggle "only differences" filter
            if (comparisonResult) {
              e.preventDefault();
              setShowOnlyDifferences(!filters.showOnlyDifferences);
            }
            break;
          case 'r':
          case 'R':
            // Cmd/Ctrl+R: Reset filters
            if (comparisonResult) {
              e.preventDefault();
              resetFilters();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    source,
    target,
    isComparing,
    comparisonResult,
    filters.showOnlyDifferences,
    setShowOnlyDifferences,
    resetFilters,
  ]);

  const handleCompare = useCallback(async () => {
    if (!source || !target) {
      setComparisonError(
        'Please select both source and target tables to compare'
      );
      return;
    }

    if (!source.connectionId || !source.tableName) {
      setComparisonError('Source connection and table are required');
      return;
    }

    if (!target.connectionId || !target.tableName) {
      setComparisonError('Target connection and table are required');
      return;
    }

    setIsComparing(true);
    setComparisonError(null);

    try {
      const response = await window.sqlPro.comparison.compareTables({
        sourceConnectionId: source.connectionId,
        sourceTable: source.tableName,
        sourceSchema: source.schemaName || 'main',
        targetConnectionId: target.connectionId,
        targetTable: target.tableName,
        targetSchema: target.schemaName || 'main',
        primaryKeys: [], // Auto-detect primary keys
        pagination: {
          offset: 0,
          limit: 1000,
        },
      });

      if (!response.success) {
        setComparisonError(
          response.error || t('dataDiff.failedToCompareTables')
        );
        return;
      }

      if (response.result || response.comparison) {
        useDataDiffStore
          .getState()
          .setComparisonResult(response.result || response.comparison || null);
      }
    } catch (error) {
      setComparisonError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsComparing(false);
    }
  }, [source, target, setIsComparing, setComparisonError]);

  // Store handleCompare in ref for keyboard shortcuts
  useEffect(() => {
    handleCompareRef.current = handleCompare;
  }, [handleCompare]);

  const canCompare =
    source &&
    target &&
    source.connectionId &&
    source.tableName &&
    target.connectionId &&
    target.tableName &&
    !isComparing;

  return (
    <div className={className}>
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="text-gold h-6 w-6" />
              <div>
                <h1 className="text-2xl font-semibold">
                  {t('compare.dataComparison')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('compare.dataDescription')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="gap-2"
              title={t('compare.showShortcuts')}
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t('compare.shortcuts')}</span>
              {showKeyboardShortcuts ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Keyboard Shortcuts Help */}
          {showKeyboardShortcuts && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Keyboard className="h-4 w-4" />
                  {t('compare.keyboardShortcuts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {t('compare.runComparison')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'Enter', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {t('compare.toggleOnlyDifferences')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'd', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground whitespace-nowrap">
                      {t('compare.resetFilters')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'r', modifiers: { cmd: true } }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Source Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  {t('compare.source')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Connection Selector */}
                <div className="space-y-2">
                  <label className="text-muted-foreground text-xs font-medium">
                    {t('compare.connection')}
                  </label>
                  <Select
                    value={source?.connectionId ?? ''}
                    onValueChange={(connectionId: string) => {
                      if (!connectionId) return;
                      const connection = connections.find(
                        (c) => c.id === connectionId
                      );
                      setSource({
                        connectionId,
                        tableName: '',
                        schemaName: source?.schemaName || 'main',
                        displayName: connection?.filename,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('compare.selectConnection')}>
                        {source?.connectionId
                          ? connections.find(
                              (c) => c.id === source.connectionId
                            )?.filename
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Selector */}
                <div className="space-y-2">
                  <label className="text-muted-foreground text-xs font-medium">
                    {t('compare.table')}
                  </label>
                  <Select
                    value={source?.tableName ?? ''}
                    onValueChange={(tableName: string) => {
                      if (!source || !tableName) return;
                      setSource({
                        ...source,
                        tableName,
                      });
                    }}
                    disabled={
                      !source?.connectionId || sourceTables.length === 0
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('compare.selectTable')}>
                        {source?.tableName ? (
                          <div className="flex items-center gap-2">
                            <Table2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{source.tableName}</span>
                          </div>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTables.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          <div className="flex items-center gap-2">
                            <Table2 className="h-3 w-3" />
                            {table.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Arrow Indicator */}
            <div className="hidden items-center justify-center md:absolute md:top-50 md:left-1/2 md:flex md:-translate-x-1/2">
              <ArrowLeftRight className="text-muted-foreground h-6 w-6" />
            </div>

            {/* Target Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4" />
                  {t('compare.target')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Connection Selector */}
                <div className="space-y-2">
                  <label className="text-muted-foreground text-xs font-medium">
                    {t('compare.connection')}
                  </label>
                  <Select
                    value={target?.connectionId ?? ''}
                    onValueChange={(connectionId: string) => {
                      if (!connectionId) return;
                      const connection = connections.find(
                        (c) => c.id === connectionId
                      );
                      setTarget({
                        connectionId,
                        tableName: '',
                        schemaName: target?.schemaName || 'main',
                        displayName: connection?.filename,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('compare.selectConnection')}>
                        {target?.connectionId
                          ? connections.find(
                              (c) => c.id === target.connectionId
                            )?.filename
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Selector */}
                <div className="space-y-2">
                  <label className="text-muted-foreground text-xs font-medium">
                    {t('compare.table')}
                  </label>
                  <Select
                    value={target?.tableName ?? ''}
                    onValueChange={(tableName: string) => {
                      if (!target || !tableName) return;
                      setTarget({
                        ...target,
                        tableName,
                      });
                    }}
                    disabled={
                      !target?.connectionId || targetTables.length === 0
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('compare.selectTable')}>
                        {target?.tableName ? (
                          <div className="flex items-center gap-2">
                            <Table2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{target.tableName}</span>
                          </div>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {targetTables.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          <div className="flex items-center gap-2">
                            <Table2 className="h-3 w-3" />
                            {table.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compare Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={handleCompare}
              disabled={!canCompare}
              className="border-gold bg-gold/15 text-gold hover:bg-gold/25 min-w-50"
              title={t('dataDiff.compareTablesShortcut')}
            >
              {isComparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('compare.comparing')}
                </>
              ) : (
                <>
                  <GitCompare className="mr-2 h-4 w-4" />
                  {t('compare.compareData')}
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {comparisonError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('compare.comparisonError')}</AlertTitle>
              <AlertDescription>{comparisonError}</AlertDescription>
            </Alert>
          )}

          {/* Comparison Results */}
          {comparisonResult && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('compare.comparisonResults')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('compare.sourceLabel')}
                      </span>
                      <span className="font-medium">
                        {comparisonResult.sourceName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t('compare.targetLabel')}
                      </span>
                      <span className="font-medium">
                        {comparisonResult.targetName}
                      </span>
                    </div>
                    <div className="mt-4 border-t pt-2">
                      <p className="text-muted-foreground text-sm">
                        {t('compare.rowsSummary', {
                          sourceRows: comparisonResult.summary.sourceRows,
                          targetRows: comparisonResult.summary.targetRows,
                        })}
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                        <div className="rounded bg-green-100 p-2 dark:bg-green-950">
                          <div className="text-green-700 dark:text-green-300">
                            {t('compare.rowsAdded')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.rowsAdded}
                          </div>
                        </div>
                        <div className="rounded bg-red-100 p-2 dark:bg-red-950">
                          <div className="text-red-700 dark:text-red-300">
                            {t('compare.rowsRemoved')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.rowsRemoved}
                          </div>
                        </div>
                        <div className="rounded bg-amber-100 p-2 dark:bg-amber-950">
                          <div className="text-amber-700 dark:text-amber-300">
                            {t('compare.rowsModified')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.rowsModified}
                          </div>
                        </div>
                        <div className="rounded bg-blue-100 p-2 dark:bg-blue-950">
                          <div className="text-blue-700 dark:text-blue-300">
                            {t('compare.rowsUnchanged')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.rowsUnchanged}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Diff View - Placeholder for future components */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('compare.rowDifferences')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {t('compare.detailedDiffPlaceholder')}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!comparisonResult && !comparisonError && !isComparing && (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center">
              <GitCompare className="h-12 w-12 opacity-30" />
              <p className="font-medium">{t('compare.readyToCompare')}</p>
              <p className="text-sm">
                {t('compare.selectSourceAndTargetData')}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

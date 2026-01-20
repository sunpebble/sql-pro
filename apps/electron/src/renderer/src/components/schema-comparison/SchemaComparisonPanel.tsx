import { Alert, AlertDescription, AlertTitle } from '@sqlpro/ui/alert';
import { Button } from '@sqlpro/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@sqlpro/ui/card';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  AlertCircle,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  FileDown,
  GitCompare,
  Keyboard,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSchemaComparisonStore } from '@/stores';
import { DiffFilterBar } from './DiffFilterBar';
import { DiffSummary } from './DiffSummary';
import { ExportReportDialog } from './ExportReportDialog';
import { MigrationPreview } from './MigrationPreview';
import { SchemaDiffView } from './SchemaDiffView';
import { SourceSelector } from './SourceSelector';

interface SchemaComparisonPanelProps {
  className?: string;
}

/**
 * Main container component for schema comparison feature.
 * Provides source/target selection and displays comparison results.
 */
export function SchemaComparisonPanel({
  className,
}: SchemaComparisonPanelProps) {
  const {
    source,
    target,
    comparisonResult,
    isComparing,
    comparisonError,
    isLoadingSnapshots,
    filters,
    setSource,
    setTarget,
    setIsComparing,
    setComparisonResult,
    setComparisonError,
    setAvailableSnapshots,
    setIsLoadingSnapshots,
    setShowOnlyDifferences,
    resetFilters,
  } = useSchemaComparisonStore();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { t } = useTranslation('common');

  // Ref to hold handleCompare function for keyboard shortcuts (defined before useEffect)
  const handleCompareRef = useRef<(() => void) | null>(null);

  // Load available snapshots on mount
  useEffect(() => {
    const loadSnapshots = async () => {
      setIsLoadingSnapshots(true);
      try {
        const response = await sqlPro.schemaSnapshot.getAll();
        if (response.success && response.snapshots) {
          setAvailableSnapshots(response.snapshots);
        }
      } catch {
        // Silently fail - snapshots are optional
      } finally {
        setIsLoadingSnapshots(false);
      }
    };

    loadSnapshots();
  }, [setAvailableSnapshots, setIsLoadingSnapshots]);

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
          case 'e':
          case 'E':
            // Cmd/Ctrl+E: Export report
            if (comparisonResult) {
              e.preventDefault();
              setIsExportDialogOpen(true);
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
          case 'f':
          case 'F':
            // Cmd/Ctrl+F: Focus search input
            if (comparisonResult) {
              e.preventDefault();
              // Find and focus the search input in DiffFilterBar
              const searchInput = document.querySelector(
                'input[data-testid="diff-filter-search"]'
              ) as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
                searchInput.select();
              }
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
      setComparisonError(t('compare.selectBothSourceAndTarget'));
      return;
    }

    setIsComparing(true);
    setComparisonError(null);

    try {
      let response;

      // Determine comparison type based on source and target types
      if (source.type === 'connection' && target.type === 'connection') {
        // Compare two connections
        if (!source.connectionId || !target.connectionId) {
          throw new Error(t('compare.connectionIdsRequired'));
        }

        response = await sqlPro.comparison.compareConnections({
          sourceConnectionId: source.connectionId,
          targetConnectionId: target.connectionId,
        });
      } else if (source.type === 'connection' && target.type === 'snapshot') {
        // Compare connection to snapshot
        if (!source.connectionId || !target.snapshotId) {
          throw new Error(t('compare.connectionAndSnapshotRequired'));
        }

        response = await sqlPro.comparison.compareConnectionToSnapshot({
          connectionId: source.connectionId,
          snapshotId: target.snapshotId,
          reverse: false,
        });
      } else if (source.type === 'snapshot' && target.type === 'connection') {
        // Compare snapshot to connection (reverse)
        if (!source.snapshotId || !target.connectionId) {
          throw new Error(t('compare.snapshotAndConnectionRequired'));
        }

        response = await sqlPro.comparison.compareConnectionToSnapshot({
          connectionId: target.connectionId,
          snapshotId: source.snapshotId,
          reverse: true,
        });
      } else if (source.type === 'snapshot' && target.type === 'snapshot') {
        // Compare two snapshots
        if (!source.snapshotId || !target.snapshotId) {
          throw new Error(t('compare.snapshotIdsRequired'));
        }

        response = await sqlPro.comparison.compareSnapshots({
          sourceSnapshotId: source.snapshotId,
          targetSnapshotId: target.snapshotId,
        });
      } else {
        throw new Error(t('compare.invalidComparisonConfig'));
      }

      if (response.success && (response.result || response.comparison)) {
        setComparisonResult(response.result || response.comparison || null);
      } else {
        setComparisonError(response.error || t('compare.comparisonFailed'));
      }
    } catch (error) {
      setComparisonError(
        error instanceof Error ? error.message : t('compare.unexpectedError')
      );
    } finally {
      setIsComparing(false);
    }
  }, [
    source,
    target,
    setIsComparing,
    setComparisonResult,
    setComparisonError,
    t,
  ]);

  // Store handleCompare in ref for keyboard shortcuts
  useEffect(() => {
    handleCompareRef.current = handleCompare;
  }, [handleCompare]);

  const canCompare = source && target && !isComparing;

  return (
    <div className={cn('h-full', className)}>
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="text-gold h-6 w-6" />
              <div>
                <h1 className="text-2xl font-semibold">
                  {t('compare.schemaComparison')}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {t('compare.schemaDescription')}
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
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {t('compare.runComparison')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'Enter', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {t('compare.toggleOnlyDifferences')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'd', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {t('compare.exportReport')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'e', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {t('compare.resetFilters')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'r', modifiers: { cmd: true } }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {t('compare.focusSearch')}
                    </span>
                    <ShortcutKbd
                      binding={{ key: 'f', modifiers: { cmd: true } }}
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
              <CardContent className="pt-6">
                <SourceSelector
                  type="source"
                  value={source}
                  onChange={setSource}
                />
              </CardContent>
            </Card>

            {/* Arrow Indicator */}
            <div className="hidden items-center justify-center md:absolute md:top-50 md:left-1/2 md:flex md:-translate-x-1/2">
              <ArrowLeftRight className="text-muted-foreground h-6 w-6" />
            </div>

            {/* Target Selector */}
            <Card>
              <CardContent className="pt-6">
                <SourceSelector
                  type="target"
                  value={target}
                  onChange={setTarget}
                />
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
              title={t('compare.compareSchemasShortcut')}
            >
              {isComparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('compare.comparing')}
                </>
              ) : (
                <>
                  <GitCompare className="mr-2 h-4 w-4" />
                  {t('compare.compareSchemas')}
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

          {/* Loading State */}
          {isLoadingSnapshots && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('compare.loadingSnapshots')}
            </div>
          )}

          {/* Comparison Results */}
          {comparisonResult && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>{t('compare.comparisonResults')}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExportDialogOpen(true)}
                    title={t('compare.exportReportShortcut')}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t('compare.exportReport')}
                  </Button>
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
                        {t('compare.tablesCompared', {
                          count:
                            comparisonResult.summary.sourceTables +
                            comparisonResult.summary.targetTables,
                        })}
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded bg-green-100 p-2 dark:bg-green-950">
                          <div className="text-green-700 dark:text-green-300">
                            {t('compare.added')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.tablesAdded}
                          </div>
                        </div>
                        <div className="rounded bg-red-100 p-2 dark:bg-red-950">
                          <div className="text-red-700 dark:text-red-300">
                            {t('compare.removed')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.tablesRemoved}
                          </div>
                        </div>
                        <div className="rounded bg-amber-100 p-2 dark:bg-amber-950">
                          <div className="text-amber-700 dark:text-amber-300">
                            {t('compare.modified')}
                          </div>
                          <div className="text-lg font-semibold">
                            {comparisonResult.summary.tablesModified}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diff Summary - Clickable counts */}
              <DiffSummary comparisonResult={comparisonResult} />

              {/* Detailed Diff View */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('compare.schemaDifferences')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filter Bar */}
                  <DiffFilterBar />

                  {/* Diff View */}
                  <SchemaDiffView comparisonResult={comparisonResult} />
                </CardContent>
              </Card>

              {/* Migration SQL Preview */}
              <MigrationPreview />
            </div>
          )}

          {/* Empty State */}
          {!comparisonResult && !comparisonError && !isComparing && (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center">
              <GitCompare className="h-12 w-12 opacity-30" />
              <p className="font-medium">{t('compare.readyToCompare')}</p>
              <p className="text-sm">{t('compare.selectSourceAndTarget')}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Export Report Dialog */}
      <ExportReportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        comparisonResult={comparisonResult}
      />
    </div>
  );
}

import type { GenerateSyncSQLResponse } from '@shared/types';
import { Alert, AlertDescription, AlertTitle } from '@sqlpro/ui/alert';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@sqlpro/ui/card';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Switch } from '@sqlpro/ui/switch';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileDown,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  useConnectionStore,
  useDataDiffStore,
  useQueryTabsStore,
} from '@/stores';

interface DataDiffSQLGeneratorProps {
  className?: string;
}

/**
 * Component to display and manage generated sync SQL for data differences.
 * Supports generating INSERT/UPDATE/DELETE statements for selected rows,
 * copy to clipboard, save to file, and insert into query editor.
 */
export function DataDiffSQLGenerator({ className }: DataDiffSQLGeneratorProps) {
  const { t } = useTranslation('common');
  const { comparisonResult, selectedRowKeys } = useDataDiffStore();
  const { activeConnectionId } = useConnectionStore();
  const { createTab } = useQueryTabsStore();

  const [syncSQL, setSyncSQL] = useState<GenerateSyncSQLResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeInserts, setIncludeInserts] = useState(true);
  const [includeUpdates, setIncludeUpdates] = useState(true);
  const [includeDeletes, setIncludeDeletes] = useState(false);
  const { copy, copied } = useCopyToClipboard();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);

  // Track previous selection state to detect when selection is cleared
  const hadSelectionRef = useRef(comparisonResult && selectedRowKeys.size > 0);
  const hasSelection = comparisonResult && selectedRowKeys.size > 0;

  // Clear syncSQL when selection is cleared (render-time pattern avoids useEffect setState)
  if (hadSelectionRef.current && !hasSelection && syncSQL !== null) {
    setSyncSQL(null);
  }
  hadSelectionRef.current = hasSelection;

  // Generate sync SQL when comparison result or options change
  useEffect(() => {
    if (!comparisonResult || selectedRowKeys.size === 0) {
      return;
    }

    let cancelled = false;

    const generateSQL = async () => {
      setIsGenerating(true);
      try {
        // Convert selected row keys back to primary key objects
        const selectedRows = Array.from(selectedRowKeys).map((key) =>
          JSON.parse(key)
        );

        const response = await sqlPro.dataDiff.generateSyncSQL({
          comparisonResult,
          selectedRows,
          includeInserts,
          includeUpdates,
          includeDeletes,
        });

        if (!cancelled) {
          setSyncSQL(response);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncSQL({
            success: false,
            error:
              err instanceof Error
                ? err.message
                : t('dataDiffSQL.failedToGenerate'),
          });
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    generateSQL();

    return () => {
      cancelled = true;
    };
  }, [
    comparisonResult,
    selectedRowKeys,
    includeInserts,
    includeUpdates,
    includeDeletes,
  ]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!syncSQL?.sql) return;
    await copy(syncSQL.sql, { showToast: false });
  }, [copy, syncSQL?.sql]);

  const handleSaveToFile = useCallback(async () => {
    if (!syncSQL?.sql) return;

    // Reset previous state
    setSaveError(null);

    try {
      const result = await sqlPro.dialog.saveFile({
        title: t('dataDiff.saveSyncSQL'),
        filters: [
          { name: t('dataDiff.sqlFiles'), extensions: ['sql'] },
          { name: t('dataDiff.allFiles'), extensions: ['*'] },
        ],
        defaultPath: `data_sync_${new Date().toISOString().split('T')[0]}.sql`,
      });

      if (result.success && result.filePath && !result.canceled) {
        // Write the file using the file write API
        const writeResult = await sqlPro.dialog.writeFile({
          filePath: result.filePath,
          content: syncSQL.sql,
          atomic: true,
        });

        if (writeResult.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          setSaveError(writeResult.error || t('dataDiff.failedToSave'));
          setTimeout(() => setSaveError(null), 5000);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('dataDiff.failedToSave');
      setSaveError(errorMessage);
      setTimeout(() => setSaveError(null), 5000);
    }
  }, [syncSQL?.sql]);

  const handleInsertIntoEditor = useCallback(() => {
    if (!syncSQL?.sql || !activeConnectionId) return;

    // Create a new query tab with the sync SQL
    createTab(activeConnectionId, syncSQL.sql);
  }, [syncSQL?.sql, activeConnectionId, createTab]);

  if (!comparisonResult) {
    return null;
  }

  // hasSelection is already defined above (line 56)
  // No need to redefine it here

  // Calculate statement counts from selected rows
  const getStatementCounts = () => {
    if (!comparisonResult) return { inserts: 0, updates: 0, deletes: 0 };

    // Match selected rows with their diff types
    const selectedDiffs = comparisonResult.rowDiffs.filter((diff) => {
      const rowKey = JSON.stringify(diff.primaryKey);
      return selectedRowKeys.has(rowKey);
    });

    return {
      inserts: selectedDiffs.filter((d) => d.diffType === 'added').length,
      updates: selectedDiffs.filter((d) => d.diffType === 'modified').length,
      deletes: selectedDiffs.filter((d) => d.diffType === 'removed').length,
    };
  };

  const counts = getStatementCounts();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('dataDiffSQL.title')}
          </CardTitle>
          {syncSQL?.statements && (
            <Badge variant="secondary">
              {t('dataDiffSQL.statementsCount', {
                count: syncSQL.statements.length,
              })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Info */}
        {!hasSelection && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('dataDiffSQL.noRowsSelected')}</AlertTitle>
            <AlertDescription>
              {t('dataDiffSQL.noRowsSelectedDescription')}
            </AlertDescription>
          </Alert>
        )}

        {hasSelection && (
          <>
            {/* Selection Summary */}
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground mb-2 text-xs font-medium">
                {t('dataDiffSQL.selectedRows', { count: selectedRowKeys.size })}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {counts.inserts > 0 && (
                  <div className="rounded bg-green-100 p-2 dark:bg-green-950">
                    <div className="text-green-700 dark:text-green-300">
                      {t('dataDiffSQL.inserts')}
                    </div>
                    <div className="text-lg font-semibold">
                      {counts.inserts}
                    </div>
                  </div>
                )}
                {counts.updates > 0 && (
                  <div className="rounded bg-amber-100 p-2 dark:bg-amber-950">
                    <div className="text-amber-700 dark:text-amber-300">
                      {t('dataDiffSQL.updates')}
                    </div>
                    <div className="text-lg font-semibold">
                      {counts.updates}
                    </div>
                  </div>
                )}
                {counts.deletes > 0 && (
                  <div className="rounded bg-red-100 p-2 dark:bg-red-950">
                    <div className="text-red-700 dark:text-red-300">
                      {t('dataDiffSQL.deletes')}
                    </div>
                    <div className="text-lg font-semibold">
                      {counts.deletes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="include-inserts"
                  checked={includeInserts}
                  onCheckedChange={setIncludeInserts}
                  disabled={isGenerating || counts.inserts === 0}
                />
                <Label
                  htmlFor="include-inserts"
                  className="cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 dark:text-green-400">
                      ■
                    </span>
                    {t('dataDiffSQL.includeInserts')}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                    {t('dataDiffSQL.includeInsertsDescription')}
                  </p>
                </Label>
              </div>

              <div className="bg-border h-8 w-px" />

              <div className="flex items-center gap-2">
                <Switch
                  id="include-updates"
                  checked={includeUpdates}
                  onCheckedChange={setIncludeUpdates}
                  disabled={isGenerating || counts.updates === 0}
                />
                <Label
                  htmlFor="include-updates"
                  className="cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 dark:text-amber-400">
                      ■
                    </span>
                    {t('dataDiffSQL.includeUpdates')}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                    {t('dataDiffSQL.includeUpdatesDescription')}
                  </p>
                </Label>
              </div>

              <div className="bg-border h-8 w-px" />

              <div className="flex items-center gap-2">
                <Switch
                  id="include-deletes"
                  checked={includeDeletes}
                  onCheckedChange={setIncludeDeletes}
                  disabled={isGenerating || counts.deletes === 0}
                />
                <Label
                  htmlFor="include-deletes"
                  className="cursor-pointer text-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="text-destructive h-3.5 w-3.5" />
                    {t('dataDiffSQL.includeDeletes')}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                    {t('dataDiffSQL.includeDeletesDescription')}
                  </p>
                </Label>
              </div>
            </div>

            {/* Loading State */}
            {isGenerating && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('dataDiffSQL.generating')}
              </div>
            )}

            {/* Error State */}
            {syncSQL && !syncSQL.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('dataDiffSQL.generationError')}</AlertTitle>
                <AlertDescription>{syncSQL.error}</AlertDescription>
              </Alert>
            )}

            {/* No Operations Selected */}
            {!isGenerating &&
              syncSQL?.success &&
              !includeInserts &&
              !includeUpdates &&
              !includeDeletes && (
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <AlertCircle className="h-12 w-12 opacity-30" />
                  <p className="font-medium">
                    {t('dataDiffSQL.noOperationsSelected')}
                  </p>
                  <p className="text-sm">
                    {t('dataDiffSQL.noOperationsSelectedDescription')}
                  </p>
                </div>
              )}

            {/* Success State with SQL */}
            {!isGenerating &&
              syncSQL?.success &&
              (includeInserts || includeUpdates || includeDeletes) && (
                <>
                  {/* Warnings */}
                  {syncSQL.warnings && syncSQL.warnings.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {t('dataDiffSQL.warnings', {
                            count: syncSQL.warnings.length,
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowWarnings(!showWarnings)}
                          className="h-auto p-0 text-xs"
                        >
                          {showWarnings ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertTitle>
                      {showWarnings && (
                        <AlertDescription className="mt-2">
                          <ul className="list-inside list-disc space-y-1 text-xs">
                            {syncSQL.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      )}
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      disabled={!syncSQL.sql}
                      className="border-gold bg-gold/15 text-gold hover:bg-gold/25"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t('dataDiffSQL.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          {t('dataDiffSQL.copyToClipboard')}
                        </>
                      )}
                    </Button>

                    <Button
                      variant={saveError ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={handleSaveToFile}
                      disabled={!syncSQL.sql}
                    >
                      {saved ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t('dataDiffSQL.saved')}
                        </>
                      ) : saveError ? (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          {t('dataDiffSQL.saveFailed')}
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          {t('dataDiffSQL.saveToFile')}
                        </>
                      )}
                    </Button>

                    {activeConnectionId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInsertIntoEditor}
                        disabled={!syncSQL.sql}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {t('dataDiffSQL.openInQueryEditor')}
                      </Button>
                    )}
                  </div>

                  {/* Save Error Display */}
                  {saveError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {saveError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* SQL Display */}
                  {syncSQL.sql && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        {t('dataDiffSQL.generatedSQL')}
                      </Label>
                      <ScrollArea className="h-100 rounded-lg border">
                        <div className="p-4">
                          <SqlHighlight
                            code={syncSQL.sql}
                            className={cn(
                              'text-sm',
                              syncSQL.sql.length > 5000 && 'text-xs'
                            )}
                          />
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Statement Count Info */}
                  {syncSQL.statements && syncSQL.statements.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      💡 {t('dataDiffSQL.tip')}
                    </p>
                  )}
                </>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

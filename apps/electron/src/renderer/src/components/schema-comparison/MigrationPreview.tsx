import type { GenerateMigrationSQLResponse } from '@shared/types';
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
  RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  useConnectionStore,
  useQueryTabsStore,
  useSchemaComparisonStore,
} from '@/stores';

interface MigrationPreviewProps {
  className?: string;
}

/**
 * Component to display and manage generated migration SQL.
 * Supports forward/reverse migrations, copy to clipboard, save to file,
 * and insert into query editor.
 */
export function MigrationPreview({ className }: MigrationPreviewProps) {
  const { comparisonResult } = useSchemaComparisonStore();
  const { activeConnectionId } = useConnectionStore();
  const { createTab } = useQueryTabsStore();
  const { t } = useTranslation('common');

  const [migrationSQL, setMigrationSQL] =
    useState<GenerateMigrationSQLResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [includeDropStatements, setIncludeDropStatements] = useState(false);
  const { copy, copied } = useCopyToClipboard();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(true);

  // Track previous comparison result to detect when it's cleared
  const hadComparisonRef = useRef(!!comparisonResult);

  // Clear migrationSQL when comparison result is cleared (render-time pattern avoids useEffect setState)
  if (hadComparisonRef.current && !comparisonResult && migrationSQL !== null) {
    setMigrationSQL(null);
  }
  hadComparisonRef.current = !!comparisonResult;

  // Generate migration SQL when comparison result or options change

  useEffect(() => {
    if (!comparisonResult) {
      return;
    }

    let cancelled = false;

    const generateSQL = async () => {
      setIsGenerating(true);
      try {
        const response = await sqlPro.migration.generateSQL({
          comparisonResult,
          reverse,
          includeDropStatements,
        });

        if (!cancelled) {
          setMigrationSQL(response);
        }
      } catch (err) {
        if (!cancelled) {
          setMigrationSQL({
            success: false,
            error:
              err instanceof Error
                ? err.message
                : 'Failed to generate migration SQL',
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
  }, [comparisonResult, reverse, includeDropStatements]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!migrationSQL?.sql) return;
    await copy(migrationSQL.sql, { showToast: false });
  }, [copy, migrationSQL?.sql]);

  const handleSaveToFile = useCallback(async () => {
    if (!migrationSQL?.sql) return;

    // Reset previous state
    setSaveError(null);

    try {
      const result = await sqlPro.dialog.saveFile({
        title: 'Save Migration SQL',
        filters: [
          { name: 'SQL Files', extensions: ['sql'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: `migration_${new Date().toISOString().split('T')[0]}.sql`,
      });

      if (result.success && result.filePath && !result.canceled) {
        // Write the file using the file write API
        const writeResult = await sqlPro.dialog.writeFile({
          filePath: result.filePath,
          content: migrationSQL.sql,
          atomic: true,
        });

        if (writeResult.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          setSaveError(writeResult.error || 'Failed to save file');
          setTimeout(() => setSaveError(null), 5000);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save file';
      setSaveError(errorMessage);
      setTimeout(() => setSaveError(null), 5000);
    }
  }, [migrationSQL?.sql]);

  const handleInsertIntoEditor = useCallback(() => {
    if (!migrationSQL?.sql || !activeConnectionId) return;

    // Create a new query tab with the migration SQL
    createTab(activeConnectionId, migrationSQL.sql);
  }, [migrationSQL?.sql, activeConnectionId, createTab]);

  if (!comparisonResult) {
    return null;
  }

  const hasChanges =
    comparisonResult.summary.tablesAdded > 0 ||
    comparisonResult.summary.tablesRemoved > 0 ||
    comparisonResult.summary.tablesModified > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('migration.title')}
          </CardTitle>
          {migrationSQL?.statements && (
            <Badge variant="secondary">
              {t('migration.statements', {
                count: migrationSQL.statements.length,
              })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Switch
              id="reverse-migration"
              checked={reverse}
              onCheckedChange={setReverse}
              disabled={isGenerating}
            />
            <Label
              htmlFor="reverse-migration"
              className="cursor-pointer text-sm"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                {t('migration.reverseMigration')}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                {t('migration.reverseDescription')}
              </p>
            </Label>
          </div>

          <div className="bg-border h-8 w-px" />

          <div className="flex items-center gap-2">
            <Switch
              id="include-drops"
              checked={includeDropStatements}
              onCheckedChange={setIncludeDropStatements}
              disabled={isGenerating}
            />
            <Label htmlFor="include-drops" className="cursor-pointer text-sm">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="text-destructive h-3.5 w-3.5" />
                {t('migration.includeDropStatements')}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                {t('migration.includeDropDescription')}
              </p>
            </Label>
          </div>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('migration.generating')}
          </div>
        )}

        {/* Error State */}
        {migrationSQL && !migrationSQL.success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('migration.generationError')}</AlertTitle>
            <AlertDescription>{migrationSQL.error}</AlertDescription>
          </Alert>
        )}

        {/* No Changes */}
        {!isGenerating && migrationSQL?.success && !hasChanges && (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Check className="h-12 w-12 opacity-30" />
            <p className="font-medium">{t('migration.noChanges')}</p>
            <p className="text-sm">{t('migration.noChangesDescription')}</p>
          </div>
        )}

        {/* Success State with SQL */}
        {!isGenerating && migrationSQL?.success && hasChanges && (
          <>
            {/* Warnings */}
            {migrationSQL.warnings && migrationSQL.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>
                    {t('migration.warnings')} ({migrationSQL.warnings.length})
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
                      {migrationSQL.warnings.map((warning) => (
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
                disabled={!migrationSQL.sql}
                className="border-gold bg-gold/15 text-gold hover:bg-gold/25"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t('migration.copied')}
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('migration.copyToClipboard')}
                  </>
                )}
              </Button>

              <Button
                variant={saveError ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleSaveToFile}
                disabled={!migrationSQL.sql}
              >
                {saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t('migration.saved')}
                  </>
                ) : saveError ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {t('migration.saveFailed')}
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t('migration.saveToFile')}
                  </>
                )}
              </Button>

              {activeConnectionId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInsertIntoEditor}
                  disabled={!migrationSQL.sql}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('migration.openInQueryEditor')}
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
            {migrationSQL.sql && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  {t('migration.generatedSql')}
                </Label>
                <ScrollArea className="h-100 rounded-lg border">
                  <div className="p-4">
                    <SqlHighlight
                      code={migrationSQL.sql}
                      className={cn(
                        'text-sm',
                        migrationSQL.sql.length > 5000 && 'text-xs'
                      )}
                    />
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Statement Count Info */}
            {migrationSQL.statements && migrationSQL.statements.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {t('migration.tip')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

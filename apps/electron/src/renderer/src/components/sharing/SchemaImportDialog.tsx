import type { ImportSchemaResponse, ShareableSchema } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileUp,
  Loader2,
  Upload,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sqlPro } from '@/lib/api';

export interface SchemaImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Connection ID to import schema into */
  connectionId?: string;
  /** Callback when import completes successfully with the imported schema */
  onImportComplete?: (schema: ShareableSchema) => void;
}

export function SchemaImportDialog({
  open,
  onOpenChange,
  connectionId,
  onImportComplete,
}: SchemaImportDialogProps) {
  const { t } = useTranslation();
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSchemaResponse | null>(
    null
  );

  // Handle import - file dialog is shown by IPC handler
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // File path is selected via dialog in IPC handler
      const result = await sqlPro.sharing.importSchema({
        filePath: '',
      });

      setImportResult(result);

      if (result.success && result.schema && onImportComplete) {
        onImportComplete(result.schema);
      }
    } catch (err) {
      setImportResult({
        success: false,
        error: err instanceof Error ? err.message : t('common.unknownError'),
      });
    } finally {
      setIsImporting(false);
    }
  }, [onImportComplete, t]);

  // Reset dialog state on close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setImportResult(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  const hasErrors =
    importResult?.validation?.errors &&
    importResult.validation.errors.length > 0;
  const hasWarnings =
    importResult?.validation?.warnings &&
    importResult.validation.warnings.length > 0;
  const isValid = importResult?.validation?.valid === true;
  const versionCompatible =
    importResult?.validation?.versionCompatible !== false;

  // Calculate statistics for the imported schema
  const getSchemaStats = (schema: ShareableSchema | undefined) => {
    if (!schema) return null;

    if (schema.format === 'json' && schema.schemas) {
      // Combine multiple iterations into single loop (js-combine-iterations)
      let totalTables = 0;
      let totalViews = 0;
      let totalIndexes = 0;
      for (const s of schema.schemas) {
        totalTables += s.tables.length;
        totalViews += s.views?.length || 0;
        for (const table of s.tables) {
          totalIndexes += table.indexes?.length || 0;
        }
      }

      return {
        schemas: schema.schemas.length,
        tables: totalTables,
        views: totalViews,
        indexes: totalIndexes,
      };
    } else if (schema.format === 'sql' && schema.sqlStatements) {
      // Combine multiple filter iterations into single loop (js-combine-iterations)
      let createTableCount = 0;
      let createIndexCount = 0;
      let createTriggerCount = 0;
      for (const stmt of schema.sqlStatements) {
        if (/^\s*CREATE\s+TABLE/i.test(stmt)) createTableCount++;
        else if (/^\s*CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(stmt))
          createIndexCount++;
        else if (/^\s*CREATE\s+TRIGGER/i.test(stmt)) createTriggerCount++;
      }

      return {
        statements: schema.sqlStatements.length,
        tables: createTableCount,
        indexes: createIndexCount,
        triggers: createTriggerCount,
      };
    }

    return null;
  };

  const stats = getSchemaStats(importResult?.schema);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <ScrollArea className="h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('sharing.importSchema')}
            </DialogTitle>
            <DialogDescription>
              {t('sharing.importSchemaDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!importResult ? (
              <div className="space-y-3">
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('sharing.selectSchemaFilePrompt')}
                </p>
                {connectionId && (
                  <div className="bg-muted rounded-base p-3">
                    <p
                      className=""
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      <span className="font-medium">{t('sharing.note')}:</span>{' '}
                      {t('sharing.schemaImportNote')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Validation Status */}
                <div className="space-y-3">
                  {/* Version Compatibility */}
                  {!versionCompatible && (
                    <div className="bg-destructive/10 rounded-base flex items-start gap-3 p-4">
                      <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-destructive font-medium">
                          {t('sharing.versionIncompatible')}
                        </p>
                        <p
                          className="text-destructive/80 mt-1"
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.schemaVersionIncompatibleDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Compression Info */}
                  {importResult.validation?.compressionInfo?.compressed && (
                    <div className="bg-muted rounded-base flex items-start gap-3 p-3">
                      <CheckCircle2 className="text-muted-foreground h-5 w-5 shrink-0" />
                      <div className="flex-1">
                        <p
                          className="font-medium"
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.compressedFileDetected')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.algorithm')}:{' '}
                          {importResult.validation.compressionInfo.algorithm}{' '}
                          {importResult.validation.compressionInfo
                            .originalSize &&
                            importResult.validation.compressionInfo
                              .compressedSize && (
                              <>
                                • {t('sharing.originalSize')}:{' '}
                                {Math.round(
                                  importResult.validation.compressionInfo
                                    .originalSize / 1024
                                )}
                                KB → {t('sharing.compressedSize')}:{' '}
                                {Math.round(
                                  importResult.validation.compressionInfo
                                    .compressedSize / 1024
                                )}
                                KB
                              </>
                            )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation Errors */}
                  {hasErrors && (
                    <div className="bg-destructive/10 rounded-base space-y-2 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-destructive font-medium">
                            {t('sharing.validationErrors')}
                          </p>
                          <p
                            className="text-destructive/80 mt-1"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {t('sharing.errorsFoundInSchemaImport')}
                          </p>
                        </div>
                      </div>
                      <ul
                        className="text-destructive/80 ml-8 list-inside list-disc space-y-1"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {importResult.validation!.errors!.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Warnings */}
                  {hasWarnings && (
                    <div className="rounded-base space-y-2 border border-yellow-500/30 bg-yellow-50 p-4 dark:bg-yellow-950/30">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">
                            {t('sharing.warnings')}
                          </p>
                          <p
                            className="mt-1 text-yellow-700 dark:text-yellow-300"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {t('sharing.schemaWarningsDesc')}
                          </p>
                        </div>
                      </div>
                      <ul
                        className="ml-8 list-inside list-disc space-y-1 text-yellow-700 dark:text-yellow-300"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {importResult.validation!.warnings!.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Success Status */}
                  {isValid && !hasErrors && !hasWarnings && (
                    <div className="rounded-base flex items-start gap-3 bg-green-50 p-4 dark:bg-green-950">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {t('sharing.validationSuccessful')}
                        </p>
                        <p
                          className="mt-1 text-green-700 dark:text-green-300"
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.schemaValidAndReady')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Import Error */}
                  {!importResult.success && (
                    <div className="bg-destructive/10 rounded-base p-4">
                      <p className="text-destructive font-medium">
                        {t('sharing.importFailed')}
                      </p>
                      <p
                        className="text-destructive/80 mt-1"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {importResult.error || t('sharing.unknownError')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Schema Preview */}
                {importResult.schema && (
                  <div className="rounded-base space-y-4 border p-4">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {t('sharing.schemaPreview')}
                      </h3>
                      {importResult.schema.metadata && (
                        <span
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.version')}:{' '}
                          {importResult.schema.metadata.version}
                        </span>
                      )}
                    </div>

                    {/* Schema Name */}
                    <div className="space-y-1.5">
                      <Label
                        className="font-medium"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {t('sharing.schemaName')}
                      </Label>
                      <p
                        className=""
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {importResult.schema.name}
                      </p>
                    </div>

                    {/* Description */}
                    {importResult.schema.description && (
                      <div className="space-y-1.5">
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.description')}
                        </Label>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {importResult.schema.description}
                        </p>
                      </div>
                    )}

                    {/* Database Info */}
                    <div className="grid grid-cols-2 gap-4">
                      {importResult.schema.databaseName && (
                        <div className="space-y-1.5">
                          <Label
                            className="font-medium"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('sharing.databaseName')}
                          </Label>
                          <p
                            className="text-muted-foreground"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {importResult.schema.databaseName}
                          </p>
                        </div>
                      )}
                      {importResult.schema.databaseType && (
                        <div className="space-y-1.5">
                          <Label
                            className="font-medium"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('sharing.databaseType')}
                          </Label>
                          <p
                            className="text-muted-foreground capitalize"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {importResult.schema.databaseType}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Format and Statistics */}
                    <div className="bg-muted rounded-base space-y-2 p-3">
                      <div className="flex items-center gap-2">
                        <Database className="text-muted-foreground h-4 w-4" />
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.exportFormat')}
                        </Label>
                      </div>
                      <p
                        className=""
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {importResult.schema.format === 'json'
                          ? t('sharing.jsonFormat')
                          : t('sharing.sqlFormat')}
                      </p>
                      {stats && (
                        <div
                          className="text-muted-foreground grid grid-cols-2 gap-2 pt-2"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {importResult.schema.format === 'json' ? (
                            <>
                              <div>
                                <span className="font-medium">
                                  {t('sharing.schemas')}:
                                </span>{' '}
                                {stats.schemas}
                              </div>
                              <div>
                                <span className="font-medium">
                                  {t('sharing.tables')}:
                                </span>{' '}
                                {stats.tables}
                              </div>
                              {(stats.views ?? 0) > 0 && (
                                <div>
                                  <span className="font-medium">
                                    {t('sharing.views')}:
                                  </span>{' '}
                                  {stats.views}
                                </div>
                              )}
                              {stats.indexes > 0 && (
                                <div>
                                  <span className="font-medium">
                                    {t('sharing.indexes')}:
                                  </span>{' '}
                                  {stats.indexes}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="font-medium">
                                  {t('sharing.totalStatements')}:
                                </span>{' '}
                                {stats.statements}
                              </div>
                              <div>
                                <span className="font-medium">
                                  {t('sharing.tables')}:
                                </span>{' '}
                                {stats.tables}
                              </div>
                              {stats.indexes > 0 && (
                                <div>
                                  <span className="font-medium">
                                    {t('sharing.indexes')}:
                                  </span>{' '}
                                  {stats.indexes}
                                </div>
                              )}
                              {(stats.triggers ?? 0) > 0 && (
                                <div>
                                  <span className="font-medium">
                                    {t('sharing.triggers')}:
                                  </span>{' '}
                                  {stats.triggers}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Export Options */}
                    <div className="space-y-2">
                      <Label
                        className="font-medium"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {t('sharing.exportOptionsLabel')}
                      </Label>
                      <div className="rounded-base space-y-1.5 border p-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              (importResult.schema.options?.includeIndexes as
                                | boolean
                                | undefined) ?? false
                            }
                            disabled
                          />
                          <span
                            className=""
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {t('sharing.includeIndexes')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              (importResult.schema.options?.includeTriggers as
                                | boolean
                                | undefined) ?? false
                            }
                            disabled
                          />
                          <span
                            className=""
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {t('sharing.includeTriggers')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              (importResult.schema.options
                                ?.includeForeignKeys as boolean | undefined) ??
                              false
                            }
                            disabled
                          />
                          <span
                            className=""
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {t('sharing.includeForeignKeys')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table List Preview (for JSON format) */}
                    {importResult.schema.format === 'json' &&
                      importResult.schema.schemas &&
                      importResult.schema.schemas.length > 0 && (
                        <div className="space-y-2">
                          <Label
                            className="font-medium"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('sharing.tablesIncluded')}
                          </Label>
                          <ScrollArea className="h-48">
                            <div className="rounded-base space-y-2 border p-3">
                              {importResult.schema.schemas.map((schema) => (
                                <div key={schema.name} className="space-y-1">
                                  <p
                                    className="font-medium"
                                    style={{
                                      fontSize: 'var(--font-ui-size, 13px)',
                                    }}
                                  >
                                    {schema.name}
                                  </p>
                                  <div className="ml-4 space-y-0.5">
                                    {schema.tables.map((table) => (
                                      <p
                                        key={table.name}
                                        className="text-muted-foreground"
                                        style={{
                                          fontSize:
                                            'calc(var(--font-ui-size, 13px) * 0.85)',
                                        }}
                                      >
                                        • {table.name} ({table.columns.length}{' '}
                                        {table.columns.length !== 1
                                          ? t('sharing.columns')
                                          : t('sharing.column')}
                                        )
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                    {/* SQL Preview (for SQL format) */}
                    {importResult.schema.format === 'sql' &&
                      importResult.schema.sqlStatements &&
                      importResult.schema.sqlStatements.length > 0 && (
                        <div className="space-y-2">
                          <Label
                            className="font-medium"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('sharing.sqlStatementsPreview')}
                          </Label>
                          <Textarea
                            value={importResult.schema.sqlStatements
                              .slice(0, 5)
                              .join('\n\n')}
                            readOnly
                            className="bg-muted font-mono"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                            rows={10}
                          />
                          {importResult.schema.sqlStatements.length > 5 && (
                            <p
                              className="text-muted-foreground"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 0.85)',
                              }}
                            >
                              {t('sharing.showingFirstStatements', {
                                shown: 5,
                                total: importResult.schema.sqlStatements.length,
                              })}
                            </p>
                          )}
                        </div>
                      )}

                    {/* Documentation */}
                    {importResult.schema.documentation && (
                      <div className="space-y-1.5">
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.documentation')}
                        </Label>
                        <Textarea
                          value={importResult.schema.documentation}
                          readOnly
                          className="bg-muted"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                          rows={4}
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="border-t pt-3">
                      <div
                        className="text-muted-foreground grid grid-cols-2 gap-2"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {importResult.schema.createdAt && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.created')}:
                            </span>{' '}
                            {new Date(
                              importResult.schema.createdAt
                            ).toLocaleString()}
                          </div>
                        )}
                        {importResult.schema.author && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.author')}:
                            </span>{' '}
                            {importResult.schema.author}
                          </div>
                        )}
                        {importResult.schema.metadata?.exportedAt && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.exported')}:
                            </span>{' '}
                            {new Date(
                              importResult.schema.metadata.exportedAt
                            ).toLocaleString()}
                          </div>
                        )}
                        {importResult.schema.metadata?.appVersion && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.appVersion')}:
                            </span>{' '}
                            {importResult.schema.metadata.appVersion}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conflict Warning */}
                    {isValid && stats && stats.tables > 0 && (
                      <div className="rounded-base space-y-2 border border-yellow-500/30 bg-yellow-50 p-3 dark:bg-yellow-950/30">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                          <div className="flex-1">
                            <p
                              className="font-medium text-yellow-900 dark:text-yellow-100"
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {t('sharing.schemaConflictWarning')}
                            </p>
                            <p
                              className="mt-1 text-yellow-700 dark:text-yellow-300"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 0.85)',
                              }}
                            >
                              {t('sharing.schemaConflictDesc', {
                                content:
                                  importResult.schema.format === 'json'
                                    ? stats.tables !== 1
                                      ? t('sharing.tablesCountPlural', {
                                          count: stats.tables,
                                        })
                                      : t('sharing.tableCount', {
                                          count: stats.tables,
                                        })
                                    : stats.statements !== 1
                                      ? t('sharing.statementsCountPlural', {
                                          count: stats.statements,
                                        })
                                      : t('sharing.statementCount', {
                                          count: stats.statements,
                                        }),
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isImporting}
            >
              {importResult ? t('sharing.close') : t('sharing.cancel')}
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('sharing.importing')}
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    {t('sharing.selectFile')}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

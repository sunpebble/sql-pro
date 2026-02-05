import type { ImportQueryResponse, ShareableQuery } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
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

export interface QueryImportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when import completes successfully with the imported query */
  onImportComplete?: (query: ShareableQuery) => void;
}

export function QueryImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: QueryImportDialogProps) {
  const { t } = useTranslation();
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportQueryResponse | null>(
    null
  );

  // Handle import - file dialog is shown by IPC handler
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // File path is selected via dialog in IPC handler
      const result = await sqlPro.sharing.importQuery({
        filePath: '',
      });

      setImportResult(result);

      if (result.success && result.query && onImportComplete) {
        onImportComplete(result.query);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <ScrollArea className="h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('sharing.importQuery')}
            </DialogTitle>
            <DialogDescription>
              {t('sharing.importQueryDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!importResult ? (
              <div className="space-y-3">
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                >
                  {t('sharing.selectFilePrompt')}
                </p>
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
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {t('sharing.versionIncompatibleDesc')}
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
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {t('sharing.compressedFileDetected')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
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
                            style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                          >
                            {t('sharing.errorsFoundInImport')}
                          </p>
                        </div>
                      </div>
                      <ul
                        className="text-destructive/80 ml-8 list-inside list-disc space-y-1"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
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
                            style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                          >
                            {t('sharing.warningsDesc')}
                          </p>
                        </div>
                      </div>
                      <ul
                        className="ml-8 list-inside list-disc space-y-1 text-yellow-700 dark:text-yellow-300"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
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
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {t('sharing.queryValidAndReady')}
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
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {importResult.error || t('sharing.unknownError')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Query Preview */}
                {importResult.query && (
                  <div className="rounded-base space-y-4 border p-4">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {t('sharing.queryPreview')}
                      </h3>
                      {importResult.query.metadata && (
                        <span
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                          }}
                        >
                          {t('sharing.version')}:{' '}
                          {importResult.query.metadata.version}
                        </span>
                      )}
                    </div>

                    {/* Query Name */}
                    <div className="space-y-1.5">
                      <Label
                        className="font-medium"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                        }}
                      >
                        {t('sharing.name')}
                      </Label>
                      <p
                        className=""
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {importResult.query.name}
                      </p>
                    </div>

                    {/* Description */}
                    {importResult.query.description && (
                      <div className="space-y-1.5">
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                          }}
                        >
                          {t('sharing.description')}
                        </Label>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {importResult.query.description}
                        </p>
                      </div>
                    )}

                    {/* SQL Query */}
                    <div className="space-y-1.5">
                      <Label
                        className="font-medium"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                        }}
                      >
                        {t('sharing.sqlQuery')}
                      </Label>
                      <Textarea
                        value={importResult.query.sql}
                        readOnly
                        className="bg-muted font-mono"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                        }}
                        rows={6}
                      />
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                        }}
                      >
                        {t('sharing.characters', {
                          count: importResult.query.sql.length,
                        })}
                      </p>
                    </div>

                    {/* Database Context */}
                    {importResult.query.databaseContext && (
                      <div className="space-y-1.5">
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                          }}
                        >
                          {t('sharing.databaseContext')}
                        </Label>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {importResult.query.databaseContext}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {importResult.query.tags &&
                      importResult.query.tags.length > 0 && (
                        <div className="space-y-1.5">
                          <Label
                            className="font-medium"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 14px) * 0.85)',
                            }}
                          >
                            {t('sharing.tags')}
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {importResult.query.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-muted text-muted-foreground rounded-md px-2 py-0.5"
                                style={{
                                  fontSize:
                                    'calc(var(--font-ui-size, 14px) * 0.85)',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Documentation */}
                    {importResult.query.documentation && (
                      <div className="space-y-1.5">
                        <Label
                          className="font-medium"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                          }}
                        >
                          {t('sharing.documentation')}
                        </Label>
                        <Textarea
                          value={importResult.query.documentation}
                          readOnly
                          className="bg-muted"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
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
                          fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                        }}
                      >
                        {importResult.query.createdAt && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.created')}:
                            </span>{' '}
                            {new Date(
                              importResult.query.createdAt
                            ).toLocaleString()}
                          </div>
                        )}
                        {importResult.query.modifiedAt && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.modified')}:
                            </span>{' '}
                            {new Date(
                              importResult.query.modifiedAt
                            ).toLocaleString()}
                          </div>
                        )}
                        {importResult.query.author && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.author')}:
                            </span>{' '}
                            {importResult.query.author}
                          </div>
                        )}
                        {importResult.query.metadata?.exportedAt && (
                          <div>
                            <span className="font-medium">
                              {t('sharing.exported')}:
                            </span>{' '}
                            {new Date(
                              importResult.query.metadata.exportedAt
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
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

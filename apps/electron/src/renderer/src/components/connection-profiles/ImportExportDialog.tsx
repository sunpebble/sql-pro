import type { ConnectionProfile, ProfileFolder } from '@shared/types.ts';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Download, Upload } from 'lucide-react';
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

export interface ImportExportDialogProps {
  /** Dialog mode: 'export' or 'import' */
  mode: 'export' | 'import';
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Available profiles for export */
  profiles?: ConnectionProfile[];
  /** Available folders for export */
  folders?: ProfileFolder[];
  /** Callback when import completes successfully */
  onImportComplete?: () => void;
}

export function ImportExportDialog({
  mode,
  open,
  onOpenChange,
  profiles = [],
  folders = [],
  onImportComplete,
}: ImportExportDialogProps) {
  const { t } = useTranslation('common');
  // Export state
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(
    () => new Set()
  );
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    filePath?: string;
    exportedCount?: number;
    error?: string;
  } | null>(null);

  // Import state
  const [importMerge, setImportMerge] = useState(true);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount?: number;
    skippedCount?: number;
    errors?: string[];
    error?: string;
  } | null>(null);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setExportResult(null);

    try {
      const result = await sqlPro.profile.export({
        profileIds:
          selectedProfileIds.size > 0
            ? Array.from(selectedProfileIds)
            : undefined,
        folderIds:
          selectedFolderIds.size > 0
            ? Array.from(selectedFolderIds)
            : undefined,
      });

      setExportResult(result);
    } catch (err) {
      setExportResult({
        success: false,
        error: err instanceof Error ? err.message : t('common.unknownError'),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedProfileIds, selectedFolderIds, t]);

  // Handle import
  const handleImport = useCallback(async () => {
    setIsProcessing(true);
    setImportResult(null);

    try {
      // The IPC handler will show the file dialog
      const result = await sqlPro.profile.import({
        filePath: '', // File path is selected via dialog in IPC handler
        merge: importMerge,
      });

      setImportResult(result);

      if (result.success && onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setImportResult({
        success: false,
        error: err instanceof Error ? err.message : t('common.unknownError'),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [importMerge, onImportComplete, t]);

  // Toggle profile selection
  const toggleProfile = useCallback((profileId: string) => {
    setSelectedProfileIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  }, []);

  // Toggle folder selection
  const toggleFolder = useCallback((folderId: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Select all profiles
  const selectAllProfiles = useCallback(() => {
    setSelectedProfileIds(new Set(profiles.map((p) => p.id)));
  }, [profiles]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedProfileIds(new Set());
    setSelectedFolderIds(new Set());
  }, []);

  // Reset dialog state on close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setSelectedProfileIds(new Set());
        setSelectedFolderIds(new Set());
        setExportResult(null);
        setImportResult(null);
        setImportMerge(true);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'export' ? (
              <>
                <Download className="mr-2 inline-block size-5" />
                {t('importExport.exportProfiles')}
              </>
            ) : (
              <>
                <Upload className="mr-2 inline-block size-5" />
                {t('importExport.importProfiles')}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? t('importExport.exportDescription')
              : t('importExport.importDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'export' ? (
            <>
              {/* Export mode UI */}
              {exportResult ? (
                <div className="space-y-3">
                  {exportResult.success ? (
                    <div className="rounded-base space-y-2 bg-green-50 p-4 dark:bg-green-950">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {t('importExport.exportSuccessful')}
                      </p>
                      <p
                        className="text-green-700 dark:text-green-300"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {t('importExport.exportedCount', {
                          count: exportResult.exportedCount,
                        })}
                      </p>
                      {exportResult.filePath && (
                        <p
                          className="break-all text-green-600 dark:text-green-400"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                          }}
                        >
                          {exportResult.filePath}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-destructive/10 rounded-base p-4">
                      <p className="text-destructive font-medium">
                        {t('importExport.exportFailed')}
                      </p>
                      <p
                        className="text-destructive/80 mt-1"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {exportResult.error || t('importExport.unknownError')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {/* Selection controls */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <span
                        className="font-medium"
                        style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                      >
                        {t('importExport.selected', {
                          count:
                            selectedProfileIds.size + selectedFolderIds.size,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={selectAllProfiles}
                        >
                          {t('importExport.selectAll')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                        >
                          {t('importExport.clear')}
                        </Button>
                      </div>
                    </div>

                    {/* Profiles list */}
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {folders.length > 0 && (
                          <div className="space-y-2">
                            <h4
                              className="text-muted-foreground font-semibold uppercase"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 14px) * 0.85)',
                              }}
                            >
                              {t('importExport.folders')}
                            </h4>
                            {folders.map((folder) => (
                              <label
                                key={folder.id}
                                className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5"
                              >
                                <Checkbox
                                  checked={selectedFolderIds.has(folder.id)}
                                  onCheckedChange={() =>
                                    toggleFolder(folder.id)
                                  }
                                />
                                <span
                                  className="flex-1"
                                  style={{
                                    fontSize: 'var(--font-ui-size, 14px)',
                                  }}
                                >
                                  {folder.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {profiles.length > 0 && (
                          <div className="space-y-2">
                            <h4
                              className="text-muted-foreground font-semibold uppercase"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 14px) * 0.85)',
                              }}
                            >
                              {t('importExport.profiles')}
                            </h4>
                            {profiles.map((profile) => (
                              <label
                                key={profile.id}
                                className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5"
                              >
                                <Checkbox
                                  checked={selectedProfileIds.has(profile.id)}
                                  onCheckedChange={() =>
                                    toggleProfile(profile.id)
                                  }
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="truncate"
                                    style={{
                                      fontSize: 'var(--font-ui-size, 14px)',
                                    }}
                                  >
                                    {profile.displayName || profile.filename}
                                  </p>
                                  <p
                                    className="text-muted-foreground truncate"
                                    style={{
                                      fontSize:
                                        'calc(var(--font-ui-size, 14px) * 0.85)',
                                    }}
                                  >
                                    {profile.path}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

                        {profiles.length === 0 && folders.length === 0 && (
                          <p
                            className="text-muted-foreground py-8 text-center"
                            style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                          >
                            {t('importExport.noProfilesOrFolders')}
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Import mode UI */}
              <div className="space-y-3">
                {/* Import options */}
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={importMerge}
                    onCheckedChange={(checked) =>
                      setImportMerge(checked === true)
                    }
                  />
                  <div className="flex-1">
                    <p
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                    >
                      {t('importExport.mergeWithExisting')}
                    </p>
                    <p
                      className="text-muted-foreground"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)',
                      }}
                    >
                      {t('importExport.mergeDescription')}
                    </p>
                  </div>
                </label>

                {/* Import result */}
                {importResult && (
                  <div className="mt-4 space-y-3">
                    {importResult.success ? (
                      <div className="rounded-base space-y-2 bg-green-50 p-4 dark:bg-green-950">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {t('importExport.importSuccessful')}
                        </p>
                        <div
                          className="space-y-1 text-green-700 dark:text-green-300"
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          <p>
                            {t('importExport.importedCount', {
                              count: importResult.importedCount || 0,
                            })}
                          </p>
                          {importResult.skippedCount !== undefined &&
                            importResult.skippedCount > 0 && (
                              <p>
                                {t('importExport.skippedCount', {
                                  count: importResult.skippedCount,
                                })}
                              </p>
                            )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-destructive/10 rounded-base space-y-2 p-4">
                        <p className="text-destructive font-medium">
                          {t('importExport.importFailed')}
                        </p>
                        <p
                          className="text-destructive/80"
                          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                        >
                          {importResult.error || t('importExport.unknownError')}
                        </p>
                        {importResult.errors &&
                          importResult.errors.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p
                                className="text-destructive font-medium"
                                style={{
                                  fontSize:
                                    'calc(var(--font-ui-size, 14px) * 0.85)',
                                }}
                              >
                                {t('importExport.validationErrors')}
                              </p>
                              <ul
                                className="text-destructive/80 list-inside list-disc space-y-0.5"
                                style={{
                                  fontSize:
                                    'calc(var(--font-ui-size, 14px) * 0.85)',
                                }}
                              >
                                {importResult.errors.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {exportResult || importResult
              ? t('common.close')
              : t('common.cancel')}
          </Button>
          {!exportResult && !importResult && (
            <Button
              onClick={mode === 'export' ? handleExport : handleImport}
              disabled={
                isProcessing ||
                (mode === 'export' &&
                  selectedProfileIds.size === 0 &&
                  selectedFolderIds.size === 0 &&
                  profiles.length > 0)
              }
            >
              {isProcessing ? (
                <>{t('importExport.processing')}</>
              ) : mode === 'export' ? (
                <>
                  <Download className="mr-2 size-4" />
                  {t('importExport.export')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  {t('importExport.import')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import type { BackupFormat, BackupMetadata } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Switch } from '@sqlpro/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  Archive,
  Calendar,
  Database,
  Download,
  FileCode,
  HardDrive,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sqlPro } from '@/lib/api';
import { useConnectionStore } from '@/stores/connection-store';

// Utility functions
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

interface BackupRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupRestoreDialog({
  open,
  onOpenChange,
}: BackupRestoreDialogProps) {
  const { t } = useTranslation();
  const { activeConnectionId, connection } = useConnectionStore();

  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'history'>(
    'backup'
  );
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Backup form state
  const [backupName, setBackupName] = useState('');
  const [backupFormat, setBackupFormat] = useState<BackupFormat>('sql');
  const [backupDescription, setBackupDescription] = useState('');
  const [schemaOnly, setSchemaOnly] = useState(false);

  // Restore form state
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(
    null
  );
  const [dropExisting, setDropExisting] = useState(false);

  const loadBackups = useCallback(async () => {
    try {
      const result = await sqlPro.backup.list({});
      if (result.success && result.backups) {
        setBackups(result.backups);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  }, []);

  // Track if we've initialized for this dialog session
  const dialogSessionRef = useRef<boolean>(false);

  // Load backups and set default name when dialog opens (combined effect)
  useEffect(() => {
    if (open && !dialogSessionRef.current) {
      dialogSessionRef.current = true;
      loadBackups();

      if (connection) {
        const filename =
          connection.path?.split('/').pop() ||
          connection.filename ||
          'database';
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on dialog open
        setBackupName(filename.replace(/\.[^/.]+$/, ''));
      }
    } else if (!open) {
      // Reset session tracking when dialog closes
      dialogSessionRef.current = false;
    }
  }, [open, connection, loadBackups]);

  const handleCreateBackup = useCallback(async () => {
    if (!activeConnectionId || !backupName) {
      toast.error(t('backup.nameRequired', 'Backup name is required'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await sqlPro.backup.create({
        connectionId: activeConnectionId,
        name: backupName,
        format: backupFormat,
        description: backupDescription || undefined,
        schemaOnly,
      });

      if (result.success && result.backup) {
        toast.success(
          t('backup.created', 'Backup created: {{name}}', {
            name: result.backup.name,
          })
        );
        loadBackups();
        setBackupName('');
        setBackupDescription('');
        setActiveTab('history');
      } else {
        toast.error(
          t('backup.createFailed', 'Failed to create backup: {{error}}', {
            error: result.error,
          })
        );
      }
    } catch (error) {
      toast.error(
        t('backup.createFailed', 'Failed to create backup: {{error}}', {
          error: String(error),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    activeConnectionId,
    backupName,
    backupFormat,
    backupDescription,
    schemaOnly,
    t,
    loadBackups,
  ]);

  const handleRestore = useCallback(async () => {
    if (!selectedBackup || !activeConnectionId) {
      toast.error(
        t('backup.selectBackup', 'Please select a backup to restore')
      );
      return;
    }

    setIsLoading(true);
    try {
      const result = await sqlPro.backup.restore({
        backupPath: selectedBackup.filePath,
        connectionId: activeConnectionId,
        dropExisting,
      });

      if (result.success) {
        toast.success(
          t(
            'backup.restored',
            'Restored {{tables}} tables with {{rows}} rows',
            {
              tables: result.tablesRestored || 0,
              rows: result.rowsRestored || 0,
            }
          )
        );
        onOpenChange(false);
      } else {
        toast.error(
          t('backup.restoreFailed', 'Failed to restore backup: {{error}}', {
            error: result.error,
          })
        );
      }
    } catch (error) {
      toast.error(
        t('backup.restoreFailed', 'Failed to restore backup: {{error}}', {
          error: String(error),
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedBackup, activeConnectionId, dropExisting, t, onOpenChange]);

  const handleDeleteBackup = useCallback(
    async (backup: BackupMetadata) => {
      try {
        const result = await sqlPro.backup.delete({ backupId: backup.id });
        if (result.success) {
          toast.success(t('backup.deleted', 'Backup deleted'));
          loadBackups();
        } else {
          toast.error(
            t('backup.deleteFailed', 'Failed to delete backup: {{error}}', {
              error: result.error,
            })
          );
        }
      } catch (error) {
        toast.error(
          t('backup.deleteFailed', 'Failed to delete backup: {{error}}', {
            error: String(error),
          })
        );
      }
    },
    [t, loadBackups]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            {t('backup.title', 'Backup & Restore')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'backup.description',
              'Create backups of your database and restore from previous backups'
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('backup.createBackup', 'Create Backup')}
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('backup.restore', 'Restore')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('backup.history', 'History')}
            </TabsTrigger>
          </TabsList>

          {/* Create Backup Tab */}
          <TabsContent
            value="backup"
            className="flex-1 space-y-4 overflow-auto"
          >
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t('backup.backupName', 'Backup Name')}</Label>
                <Input
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder={t(
                    'backup.namePlaceholder',
                    'my-database-backup'
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('backup.format', 'Format')}</Label>
                <Select
                  value={backupFormat}
                  onValueChange={(v: string) =>
                    v && setBackupFormat(v as BackupFormat)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sql">
                      <span className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        SQL Dump (.sql)
                      </span>
                    </SelectItem>
                    {connection?.databaseType === 'sqlite' && (
                      <SelectItem value="sqlite">
                        <span className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          SQLite File (.db)
                        </span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {t('backup.description', 'Description (optional)')}
                </Label>
                <Textarea
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  placeholder={t(
                    'backup.descriptionPlaceholder',
                    'Add notes about this backup...'
                  )}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="schemaOnly"
                  checked={schemaOnly}
                  onCheckedChange={setSchemaOnly}
                />
                <Label htmlFor="schemaOnly">
                  {t('backup.schemaOnly', 'Schema only (no data)')}
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* Restore Tab */}
          <TabsContent
            value="restore"
            className="flex flex-1 flex-col space-y-4 overflow-hidden"
          >
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>
                  {t('backup.selectBackupToRestore', 'Select Backup')}
                </Label>
                <Select
                  value={selectedBackup?.id || ''}
                  onValueChange={(v: string) => {
                    const backup = backups.find((b) => b.id === v);
                    setSelectedBackup(backup || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        'backup.chooseBackup',
                        'Choose a backup...'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {backups.map((backup) => (
                      <SelectItem key={backup.id} value={backup.id}>
                        <span className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {backup.name} - {formatDate(backup.createdAt)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBackup && (
                <div className="bg-muted/30 rounded-base space-y-2 border p-4">
                  <div className="flex justify-between">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('backup.database', 'Database')}:
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {selectedBackup.databaseName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('backup.tables', 'Tables')}:
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {selectedBackup.tableCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('backup.rows', 'Rows')}:
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {selectedBackup.totalRows.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('backup.size', 'Size')}:
                    </span>
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {formatBytes(selectedBackup.fileSize)}
                    </span>
                  </div>
                  {selectedBackup.description && (
                    <div className="border-t pt-2">
                      <span
                        className="text-muted-foreground"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {selectedBackup.description}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="dropExisting"
                  checked={dropExisting}
                  onCheckedChange={setDropExisting}
                />
                <Label htmlFor="dropExisting">
                  {t(
                    'backup.dropExisting',
                    'Drop existing tables before restore'
                  )}
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent
            value="history"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between py-2">
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('backup.backupCount', '{{count}} backups', {
                  count: backups.length,
                })}
              </span>
              <Button variant="ghost" size="sm" onClick={loadBackups}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="rounded-base flex-1 border">
              {backups.length === 0 ? (
                <div className="text-muted-foreground flex h-32 items-center justify-center">
                  {t('backup.noBackups', 'No backups yet')}
                </div>
              ) : (
                <div className="divide-y">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="hover:bg-muted/50 flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-base p-2">
                          {backup.format === 'sql' ? (
                            <FileCode className="text-primary h-4 w-4" />
                          ) : (
                            <HardDrive className="text-primary h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          <div
                            className="text-muted-foreground"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {formatDate(backup.createdAt)} •{' '}
                            {formatBytes(backup.fileSize)} • {backup.tableCount}{' '}
                            tables • {backup.totalRows} rows
                          </div>
                          {backup.description && (
                            <div
                              className="text-muted-foreground mt-1"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 0.85)',
                              }}
                            >
                              {backup.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBackup(backup)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.close', 'Close')}
          </Button>
          {activeTab === 'backup' && (
            <Button
              onClick={handleCreateBackup}
              disabled={isLoading || !backupName}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {t('backup.createBackup', 'Create Backup')}
            </Button>
          )}
          {activeTab === 'restore' && (
            <Button
              onClick={handleRestore}
              disabled={isLoading || !selectedBackup}
              variant="destructive"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {t('backup.restoreBackup', 'Restore Backup')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

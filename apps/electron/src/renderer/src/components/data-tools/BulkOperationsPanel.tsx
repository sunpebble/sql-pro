import { Badge } from '@sqlpro/ui/badge';
import { Button, buttonVariants } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Progress } from '@sqlpro/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ExportFormat = 'csv' | 'json' | 'sql';

interface BulkOperationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName?: string;
  columns?: string[];
  onExport?: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  onImport?: (file: File, options: ImportOptions) => Promise<ImportResult>;
}

interface ExportOptions {
  includeHeaders: boolean;
  delimiter: string;
  nullValue: string;
  dateFormat: string;
}

interface ImportOptions {
  hasHeaders: boolean;
  delimiter: string;
  skipRows: number;
  batchSize: number;
}

interface ImportResult {
  success: boolean;
  rowsImported: number;
  rowsFailed: number;
  errors: string[];
}

const FORMAT_INFO = {
  csv: {
    icon: FileSpreadsheet,
    label: 'CSV',
    descriptionKey: 'bulkOperations.csvDescription',
    extension: '.csv',
  },
  json: {
    icon: FileJson,
    label: 'JSON',
    descriptionKey: 'bulkOperations.jsonDescription',
    extension: '.json',
  },
  sql: {
    icon: FileText,
    label: 'SQL',
    descriptionKey: 'bulkOperations.sqlDescription',
    extension: '.sql',
  },
};

export const BulkOperationsPanel = memo(
  ({
    open,
    onOpenChange,
    tableName,
    columns = [],
    onExport,
    onImport,
  }: BulkOperationsPanelProps) => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

    // Export state
    const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
      includeHeaders: true,
      delimiter: ',',
      nullValue: 'NULL',
      dateFormat: 'ISO',
    });
    const [isExporting, setIsExporting] = useState(false);

    // Import state
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importOptions, setImportOptions] = useState<ImportOptions>({
      hasHeaders: true,
      delimiter: ',',
      skipRows: 0,
      batchSize: 1000,
    });
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleExport = useCallback(async () => {
      if (!onExport) return;
      setIsExporting(true);
      try {
        await onExport(exportFormat, exportOptions);
      } finally {
        setIsExporting(false);
      }
    }, [exportFormat, exportOptions, onExport]);

    const handleImport = useCallback(async () => {
      if (!onImport || !importFile) return;
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setImportProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const result = await onImport(importFile, importOptions);
        clearInterval(progressInterval);
        setImportProgress(100);
        setImportResult(result);
      } catch {
        setImportResult({
          success: false,
          rowsImported: 0,
          rowsFailed: 0,
          errors: [t('bulkOperations.importFailed')],
        });
      } finally {
        setIsImporting(false);
      }
    }, [importFile, importOptions, onImport, t]);

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          setImportFile(file);
          setImportResult(null);
        }
      },
      []
    );

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        setImportFile(file);
        setImportResult(null);
      }
    }, []);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeTab === 'export' ? (
                <ArrowDownToLine className="h-5 w-5" />
              ) : (
                <ArrowUpFromLine className="h-5 w-5" />
              )}
              {t('bulkOperations.title')}
              {tableName && (
                <Badge variant="secondary" className="ml-2">
                  {tableName}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('bulkOperations.description')}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'export' | 'import')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export" className="gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                {t('bulkOperations.export')}
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                {t('bulkOperations.import')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4 pt-4">
              {/* Format Selection */}
              <div className="grid gap-2">
                <Label>{t('bulkOperations.exportFormat')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FORMAT_INFO) as ExportFormat[]).map(
                    (format) => {
                      const info = FORMAT_INFO[format];
                      const Icon = info.icon;
                      return (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format)}
                          className={cn(
                            'rounded-base border-border flex flex-col items-center gap-2 border-2 p-4 transition-colors',
                            exportFormat === format
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          )}
                        >
                          <Icon className="h-8 w-8" />
                          <span className="font-medium">{info.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {info.extension}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* CSV-specific options */}
              {exportFormat === 'csv' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="delimiter">
                      {t('bulkOperations.delimiter')}
                    </Label>
                    <Select
                      value={exportOptions.delimiter}
                      onValueChange={(v) =>
                        v &&
                        setExportOptions({ ...exportOptions, delimiter: v })
                      }
                    >
                      <SelectTrigger id="delimiter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">
                          {t('bulkOperations.comma')}
                        </SelectItem>
                        <SelectItem value=";">
                          {t('bulkOperations.semicolon')}
                        </SelectItem>
                        <SelectItem value="\t">
                          {t('bulkOperations.tab')}
                        </SelectItem>
                        <SelectItem value="|">
                          {t('bulkOperations.pipe')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nullValue">
                      {t('bulkOperations.nullRepresentation')}
                    </Label>
                    <Input
                      id="nullValue"
                      value={exportOptions.nullValue}
                      onChange={(e) =>
                        setExportOptions({
                          ...exportOptions,
                          nullValue: e.target.value,
                        })
                      }
                      placeholder="NULL"
                    />
                  </div>
                </div>
              )}

              {/* Columns Preview */}
              {columns.length > 0 && (
                <div className="grid gap-2">
                  <Label>
                    {t('bulkOperations.columnsToExport', {
                      count: columns.length,
                    })}
                  </Label>
                  <div className="bg-muted/50 rounded-base flex flex-wrap gap-1 p-2">
                    {columns.map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4 pt-4">
              {/* File Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  'rounded-base flex flex-col items-center justify-center gap-3 border-2 border-dashed p-8 transition-colors',
                  importFile
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
              >
                {importFile ? (
                  <>
                    <div className="bg-primary/10 rounded-full p-3">
                      <FileSpreadsheet className="text-primary h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{importFile.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImportFile(null)}
                    >
                      <X className="mr-1 h-4 w-4" />
                      {t('bulkOperations.remove')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="text-muted-foreground h-10 w-10" />
                    <div className="text-center">
                      <p className="font-medium">
                        {t('bulkOperations.dropFileHere')}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {t('bulkOperations.orClickToBrowse')}
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".csv,.json,.sql"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label
                      htmlFor="file-upload"
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'cursor-pointer'
                      )}
                    >
                      {t('bulkOperations.browseFiles')}
                    </Label>
                  </>
                )}
              </div>

              {/* Import Options */}
              {importFile && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hasHeaders">
                      {t('bulkOperations.firstRowAsHeaders')}
                    </Label>
                    <Select
                      value={importOptions.hasHeaders ? 'yes' : 'no'}
                      onValueChange={(v) =>
                        setImportOptions({
                          ...importOptions,
                          hasHeaders: v === 'yes',
                        })
                      }
                    >
                      <SelectTrigger id="hasHeaders">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">
                          {t('bulkOperations.yes')}
                        </SelectItem>
                        <SelectItem value="no">
                          {t('bulkOperations.no')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="batchSize">
                      {t('bulkOperations.batchSize')}
                    </Label>
                    <Input
                      id="batchSize"
                      type="number"
                      value={importOptions.batchSize}
                      onChange={(e) =>
                        setImportOptions({
                          ...importOptions,
                          batchSize: Number.parseInt(e.target.value) || 1000,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('bulkOperations.importing')}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div
                  className={cn(
                    'rounded-base border-border flex items-start gap-3 border-2 p-4',
                    importResult.success
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  )}
                >
                  {importResult.success ? (
                    <Check className="h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 shrink-0 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      {importResult.success
                        ? t('bulkOperations.importComplete')
                        : t('bulkOperations.importFailed')}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('bulkOperations.rowsImported', {
                        count: importResult.rowsImported,
                      })}
                      {importResult.rowsFailed > 0 &&
                        t('bulkOperations.rowsFailed', {
                          count: importResult.rowsFailed,
                        })}
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-2 text-sm text-red-600">
                        {importResult.errors.slice(0, 3).map((err) => (
                          <li key={`error-${err.slice(0, 50)}`}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('bulkOperations.cancel')}
            </Button>
            {activeTab === 'export' ? (
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                )}
                {t('bulkOperations.export')}
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={isImporting || !importFile}
              >
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                )}
                {t('bulkOperations.import')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

import type { ColumnInfo, ExportFormat } from '@shared/types';
import { Button } from '@sqlpro/ui/button';

import { Checkbox } from '@sqlpro/ui/checkbox';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Progress } from '@sqlpro/ui/progress';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import {
  FileCode,
  FileDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DELIMITER_OPTIONS = [
  { value: ',', labelKey: 'sharing.delimiterComma' },
  { value: '\t', labelKey: 'sharing.delimiterTab' },
  { value: ';', labelKey: 'sharing.delimiterSemicolon' },
  { value: '|', labelKey: 'sharing.delimiterPipe' },
] as const;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  connectionId: string;
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  format: ExportFormat;
  columns: string[];
  tableName: string;
  rows: Record<string, unknown>[];
  connectionId: string;
  // Format-specific options
  delimiter?: string;
  includeHeaders?: boolean;
  prettyPrint?: boolean;
  sheetName?: string;
}

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  descriptionKey: string;
  icon: typeof FileText;
}[] = [
  {
    value: 'csv',
    label: 'CSV',
    descriptionKey: 'sharing.csvDesc',
    icon: FileText,
  },
  {
    value: 'json',
    label: 'JSON',
    descriptionKey: 'sharing.jsonDesc',
    icon: FileJson,
  },
  {
    value: 'sql',
    label: 'SQL',
    descriptionKey: 'sharing.sqlDesc',
    icon: FileCode,
  },
  {
    value: 'xlsx',
    label: 'Excel',
    descriptionKey: 'sharing.xlsxDesc',
    icon: FileSpreadsheet,
  },
];

export function ExportDialog({
  open,
  onOpenChange,
  tableName,
  columns,
  rows,
  connectionId,
  onExport,
}: ExportDialogProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  // Derive column names for dependency tracking
  const columnNames = useMemo(
    () => columns.map((col) => col.name).join(','),
    [columns]
  );

  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(columns.map((col) => col.name))
  );

  // Format-specific options
  const [delimiter, setDelimiter] = useState<string>(',');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [prettyPrint, setPrettyPrint] = useState<boolean>(false);
  const [sheetName, setSheetName] = useState<string>(tableName);

  // Export progress state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Reset selected columns when columns prop changes (e.g., different table)
  // Using a ref to track previous columns to avoid direct setState in useEffect
  const prevColumnNamesRef = useRef(columnNames);
  if (prevColumnNamesRef.current !== columnNames) {
    prevColumnNamesRef.current = columnNames;
    setSelectedColumns(new Set(columns.map((col) => col.name)));
  }

  // Reset sheet name when table name changes
  const prevTableNameRef = useRef(tableName);
  if (prevTableNameRef.current !== tableName) {
    prevTableNameRef.current = tableName;
    setSheetName(tableName);
  }

  // Reset export progress when dialog closes
  const prevOpenRef = useRef(open);
  if (prevOpenRef.current !== open && !open) {
    prevOpenRef.current = open;
    setIsExporting(false);
    setExportProgress(0);
  }
  if (prevOpenRef.current !== open) {
    prevOpenRef.current = open;
  }

  const handleColumnToggle = (columnName: string, checked: boolean) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(columnName);
      } else {
        next.delete(columnName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedColumns(new Set(columns.map((col) => col.name)));
  };

  const handleDeselectAll = () => {
    setSelectedColumns(new Set());
  };

  const allSelected = selectedColumns.size === columns.length;
  const noneSelected = selectedColumns.size === 0;

  // Threshold for showing progress indicator (per spec: >1000 rows)
  const LARGE_EXPORT_THRESHOLD = 1000;
  const isLargeExport = rows.length > LARGE_EXPORT_THRESHOLD;

  const handleExport = useCallback(async () => {
    const columnNames = Array.from(selectedColumns);

    // For large exports, show progress indicator
    if (isLargeExport) {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress for user feedback
      // The actual export happens asynchronously via IPC
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            return prev; // Cap at 90% until actually complete
          }
          // Slower progress for larger datasets
          const increment = Math.max(1, 10 - Math.floor(rows.length / 5000));
          return Math.min(90, prev + increment);
        });
      }, 100);

      try {
        onExport({
          format: selectedFormat,
          columns: columnNames,
          tableName,
          rows,
          connectionId,
          delimiter,
          includeHeaders,
          prettyPrint,
          sheetName: sheetName || tableName,
        });

        // Complete the progress
        clearInterval(progressInterval);
        setExportProgress(100);

        // Small delay to show 100% before closing
        await new Promise((resolve) => setTimeout(resolve, 300));
      } finally {
        clearInterval(progressInterval);
        setIsExporting(false);
        setExportProgress(0);
      }
    } else {
      onExport({
        format: selectedFormat,
        columns: columnNames,
        tableName,
        rows,
        connectionId,
        delimiter,
        includeHeaders,
        prettyPrint,
        sheetName: sheetName || tableName,
      });
    }

    onOpenChange(false);
  }, [
    selectedColumns,
    selectedFormat,
    tableName,
    rows,
    connectionId,
    delimiter,
    includeHeaders,
    prettyPrint,
    sheetName,
    isLargeExport,
    onExport,
    onOpenChange,
  ]);

  const selectedFormatInfo = FORMAT_OPTIONS.find(
    (opt) => opt.value === selectedFormat
  );
  const FormatIcon = selectedFormatInfo?.icon ?? FileText;

  const isExportDisabled = rows.length === 0 || noneSelected || isExporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            {t('sharing.exportData')}
          </DialogTitle>
          <DialogDescription>
            {t('sharing.exportDataDesc', {
              count: rows.length,
              table: tableName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="export-format"
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('sharing.exportFormat')}
            </Label>
            <Select
              value={selectedFormat}
              onValueChange={(value: string) =>
                setSelectedFormat(value as ExportFormat)
              }
            >
              <SelectTrigger id="export-format" className="w-full">
                <SelectValue placeholder={t('sharing.selectFormat')}>
                  <div className="flex items-center gap-2">
                    <FormatIcon className="h-4 w-4" />
                    <span>{selectedFormatInfo?.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span
                            className="text-muted-foreground"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t(option.descriptionKey)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('sharing.columnsSelected', {
                  selected: selectedColumns.size,
                  total: columns.length,
                })}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                  onClick={handleSelectAll}
                  disabled={allSelected}
                >
                  {t('sharing.selectAll')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                  onClick={handleDeselectAll}
                  disabled={noneSelected}
                >
                  {t('sharing.deselectAll')}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-40">
              <div className="rounded-base space-y-1 border p-2">
                {columns.map((column) => (
                  <label
                    key={column.name}
                    className="rounded-base hover:bg-accent flex cursor-pointer items-center gap-2 px-2 py-1"
                  >
                    <Checkbox
                      checked={selectedColumns.has(column.name)}
                      onCheckedChange={(checked) =>
                        handleColumnToggle(column.name, checked === true)
                      }
                    />
                    <span style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                      {column.name}
                    </span>
                    <span
                      className="text-muted-foreground"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      {column.type}
                    </span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Format-Specific Options */}
          {selectedFormat === 'csv' && (
            <div className="space-y-3">
              <Label
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('sharing.csvOptions')}
              </Label>
              <div className="rounded-base space-y-3 border p-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="delimiter"
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.delimiter')}
                  </Label>
                  <Select
                    value={delimiter}
                    onValueChange={(v: string) => v && setDelimiter(v)}
                  >
                    <SelectTrigger id="delimiter" className="w-full">
                      <SelectValue placeholder={t('sharing.selectDelimiter')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIMITER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={includeHeaders}
                    onCheckedChange={(checked) =>
                      setIncludeHeaders(checked === true)
                    }
                  />
                  <span style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                    {t('sharing.includeHeaders')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {selectedFormat === 'json' && (
            <div className="space-y-3">
              <Label
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('sharing.jsonOptions')}
              </Label>
              <div className="rounded-base space-y-3 border p-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={prettyPrint}
                    onCheckedChange={(checked) =>
                      setPrettyPrint(checked === true)
                    }
                  />
                  <span style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                    {t('sharing.prettyPrint')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {selectedFormat === 'xlsx' && (
            <div className="space-y-3">
              <Label
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('sharing.excelOptions')}
              </Label>
              <div className="rounded-base space-y-3 border p-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="sheet-name"
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.sheetName')}
                  </Label>
                  <Input
                    id="sheet-name"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder={tableName}
                    maxLength={31}
                  />
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.maxCharacters')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress indicator for large exports */}
          {isExporting && (
            <div className="space-y-2">
              <div
                className="flex items-center justify-between"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('sharing.exportingRows', { count: rows.length })}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('sharing.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExportDisabled}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sharing.exporting')}
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                {t('sharing.export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

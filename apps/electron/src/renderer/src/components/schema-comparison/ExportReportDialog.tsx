import type { SchemaComparisonResult } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { Label } from '@sqlpro/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { FileCode, FileDown, FileJson, FileText, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
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

type ReportFormat = 'html' | 'json' | 'markdown';

interface ReportFormatOption {
  value: ReportFormat;
  label: string;
  descriptionKey: string;
  icon: typeof FileText;
  extension: string;
}

const FORMAT_OPTIONS: ReportFormatOption[] = [
  {
    value: 'html',
    label: 'HTML',
    descriptionKey: 'exportReport.htmlDescription',
    icon: FileCode,
    extension: 'html',
  },
  {
    value: 'json',
    label: 'JSON',
    descriptionKey: 'exportReport.jsonDescription',
    icon: FileJson,
    extension: 'json',
  },
  {
    value: 'markdown',
    label: 'Markdown',
    descriptionKey: 'exportReport.markdownDescription',
    icon: FileText,
    extension: 'md',
  },
];

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparisonResult: SchemaComparisonResult | null;
}

/**
 * Dialog component to configure and export comparison reports.
 * Supports HTML, JSON, and Markdown formats with optional migration SQL inclusion.
 */
export function ExportReportDialog({
  open,
  onOpenChange,
  comparisonResult,
}: ExportReportDialogProps) {
  const { t } = useTranslation('common');
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('html');
  const [includeMigrationSQL, setIncludeMigrationSQL] =
    useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = useCallback(async () => {
    if (!comparisonResult) {
      return;
    }

    setIsExporting(true);

    try {
      // Get the selected format option
      const formatOption = FORMAT_OPTIONS.find(
        (opt) => opt.value === selectedFormat
      );
      if (!formatOption) {
        throw new Error(t('exportReport.invalidFormat'));
      }

      // Generate a default filename
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      const defaultFilename = `schema-comparison-${timestamp}.${formatOption.extension}`;

      // Show save dialog
      const result = await window.sqlPro.dialog.saveFile({
        title: t('exportReport.saveDialogTitle'),
        defaultPath: defaultFilename,
        filters: [
          {
            name: formatOption.label,
            extensions: [formatOption.extension],
          },
          { name: t('exportReport.allFiles'), extensions: ['*'] },
        ],
      });

      if (!result.success || !result.filePath || result.canceled) {
        // User cancelled or error
        return;
      }

      // Call IPC handler to export report
      const response = await window.sqlPro.schemaComparison.exportReport({
        comparisonResult,
        format: selectedFormat,
        filePath: result.filePath,
        includeMigrationSQL,
      });

      if (!response.success) {
        throw new Error(response.error || t('exportReport.exportFailed'));
      }

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('exportReport.failedToExport'), {
        description:
          error instanceof Error
            ? error.message
            : t('exportReport.unknownError'),
      });
    } finally {
      setIsExporting(false);
    }
  }, [comparisonResult, selectedFormat, includeMigrationSQL, onOpenChange, t]);

  const selectedFormatInfo = FORMAT_OPTIONS.find(
    (opt) => opt.value === selectedFormat
  );
  const FormatIcon = selectedFormatInfo?.icon ?? FileText;

  const isExportDisabled = !comparisonResult || isExporting;

  // Calculate statistics for display
  const totalChanges = comparisonResult
    ? comparisonResult.summary.tablesAdded +
      comparisonResult.summary.tablesRemoved +
      comparisonResult.summary.tablesModified
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            {t('exportReport.title')}
          </DialogTitle>
          <DialogDescription>
            {comparisonResult
              ? t('exportReport.description', { count: totalChanges })
              : t('exportReport.noResults')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-format" className="text-sm font-medium">
              {t('exportReport.reportFormat')}
            </Label>
            <Select
              value={selectedFormat}
              onValueChange={(value) =>
                setSelectedFormat(value as ReportFormat)
              }
            >
              <SelectTrigger id="report-format" className="w-full">
                <SelectValue placeholder={t('exportReport.selectFormat')}>
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
                          <span className="text-muted-foreground text-xs">
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

          {/* Include Migration SQL Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t('exportReport.options')}
            </Label>
            <div className="rounded-base space-y-3 border-2 p-3">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={includeMigrationSQL}
                  onCheckedChange={(checked) =>
                    setIncludeMigrationSQL(checked === true)
                  }
                />
                <div className="flex flex-col">
                  <span className="text-sm">
                    {t('exportReport.includeMigrationSQL')}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t('exportReport.includeMigrationSQLDesc')}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Report Preview Info */}
          {comparisonResult && (
            <div className="rounded-base space-y-2 border-2 p-3">
              <Label className="text-sm font-medium">
                {t('exportReport.reportSummary')}
              </Label>
              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{t('exportReport.source')}</span>
                  <span className="font-medium">
                    {comparisonResult.sourceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('exportReport.target')}</span>
                  <span className="font-medium">
                    {comparisonResult.targetName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('exportReport.tablesCompared')}</span>
                  <span className="font-medium">
                    {comparisonResult.summary.sourceTables} →{' '}
                    {comparisonResult.summary.targetTables}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('exportReport.totalChanges')}</span>
                  <span className="font-medium">{totalChanges}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleExport} disabled={isExportDisabled}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exportReport.exporting')}
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                {t('exportReport.exportButton')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

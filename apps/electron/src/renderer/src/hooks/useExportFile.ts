import { useCallback, useState } from 'react';
import { sqlPro } from '@/lib/api';

// ============ Types ============

/**
 * Supported export formats
 */
export type ExportFileFormat =
  | 'json'
  | 'csv'
  | 'sql'
  | 'xlsx'
  | 'markdown'
  | 'html'
  | 'txt';

/**
 * Export status states
 */
export type ExportStatus =
  | 'idle'
  | 'selecting'
  | 'exporting'
  | 'success'
  | 'error';

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: number) => void;

/**
 * File filter configuration for save dialog
 */
export interface FileFilter {
  name: string;
  extensions: string[];
}

/**
 * Export options configuration
 */
export interface ExportFileOptions {
  /** Export format */
  format: ExportFileFormat;
  /** Suggested filename (without path) */
  filename?: string;
  /** Custom file filters for save dialog */
  filters?: FileFilter[];
  /** Dialog title */
  dialogTitle?: string;
  /** Progress callback for tracking export progress */
  onProgress?: ProgressCallback;
  /** Called when export succeeds */
  onSuccess?: (filePath: string) => void;
  /** Called when export fails */
  onError?: (error: Error) => void;
}

/**
 * Result of an export operation
 */
export interface ExportFileResult {
  /** Whether the export was successful */
  success: boolean;
  /** Path where the file was saved (if successful) */
  filePath?: string;
  /** Error message (if failed) */
  error?: string;
  /** Whether the user cancelled the operation */
  cancelled?: boolean;
}

/**
 * Return type of the useExportFile hook
 */
export interface UseExportFileResult {
  /** Current export status */
  status: ExportStatus;
  /** Current progress (0-100) */
  progress: number;
  /** Last error that occurred */
  error: Error | null;
  /** Last successful export file path */
  lastExportPath: string | null;
  /** Export data to a file with save dialog */
  exportToFile: <T>(
    data: T,
    options: ExportFileOptions,
    serializer?: (data: T, format: ExportFileFormat) => string | Promise<string>
  ) => Promise<ExportFileResult>;
  /** Reset the hook state */
  reset: () => void;
  /** Whether an export is currently in progress */
  isExporting: boolean;
}

// ============ Constants ============

/** Default file extensions for each format */
const FORMAT_EXTENSIONS: Record<ExportFileFormat, string> = {
  json: 'json',
  csv: 'csv',
  sql: 'sql',
  xlsx: 'xlsx',
  markdown: 'md',
  html: 'html',
  txt: 'txt',
};

/** Default file filters for each format */
const FORMAT_FILTERS: Record<ExportFileFormat, FileFilter[]> = {
  json: [{ name: 'JSON Files', extensions: ['json'] }],
  csv: [{ name: 'CSV Files', extensions: ['csv'] }],
  sql: [{ name: 'SQL Files', extensions: ['sql'] }],
  xlsx: [{ name: 'Excel Files', extensions: ['xlsx'] }],
  markdown: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
  html: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
  txt: [{ name: 'Text Files', extensions: ['txt'] }],
};

/** Default dialog titles for each format */
const FORMAT_TITLES: Record<ExportFileFormat, string> = {
  json: 'Export to JSON',
  csv: 'Export to CSV',
  sql: 'Export to SQL',
  xlsx: 'Export to Excel',
  markdown: 'Export to Markdown',
  html: 'Export to HTML',
  txt: 'Export to Text',
};

// ============ Default Serializers ============

/**
 * Default serializer for JSON format
 */
function serializeToJson<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Default serializer for CSV format (for array of objects)
 */
function serializeToCsv<T>(data: T): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const rows = data as Record<string, unknown>[];
  const headers = Object.keys(rows[0]);

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCell(row[header])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Default serializer for Markdown format (for array of objects)
 */
function serializeToMarkdown<T>(data: T): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const rows = data as Record<string, unknown>[];
  const headers = Object.keys(rows[0]);

  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/\|/g, '\\|');
  };

  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataLines = rows.map(
    (row) =>
      `| ${headers.map((header) => escapeCell(row[header])).join(' | ')} |`
  );

  return [headerLine, separatorLine, ...dataLines].join('\n');
}

/**
 * Default serializer - returns string representation
 */
function defaultSerializer<T>(data: T, format: ExportFileFormat): string {
  switch (format) {
    case 'json':
      return serializeToJson(data);
    case 'csv':
      return serializeToCsv(data);
    case 'markdown':
      return serializeToMarkdown(data);
    case 'txt':
      return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    default:
      // For other formats, return JSON by default
      return serializeToJson(data);
  }
}

// ============ Hook Implementation ============

/**
 * Hook for exporting data to files with save dialog integration.
 *
 * Features:
 * - Manages export status (idle, selecting, exporting, success, error)
 * - Provides exportToFile function with customizable serialization
 * - Supports multiple formats (JSON, CSV, SQL, Markdown, etc.)
 * - Integrates with native file save dialog
 * - Provides progress callback support
 *
 * @example
 * ```typescript
 * const { exportToFile, status, progress } = useExportFile();
 *
 * await exportToFile(data, {
 *   format: 'json',
 *   filename: 'export.json',
 *   onProgress: (p) => setProgress(p),
 *   onSuccess: (path) => toast.success(`Exported to ${path}`),
 *   onError: (err) => toast.error(err.message),
 * });
 * ```
 */
export function useExportFile(): UseExportFileResult {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [lastExportPath, setLastExportPath] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setLastExportPath(null);
  }, []);

  const exportToFile = useCallback(
    async <T>(
      data: T,
      options: ExportFileOptions,
      serializer?: (
        data: T,
        format: ExportFileFormat
      ) => string | Promise<string>
    ): Promise<ExportFileResult> => {
      const {
        format,
        filename,
        filters,
        dialogTitle,
        onProgress,
        onSuccess,
        onError,
      } = options;

      // Reset state
      setError(null);
      setProgress(0);
      setStatus('selecting');

      try {
        // Determine file extension and filters
        const extension = FORMAT_EXTENSIONS[format];
        const fileFilters = filters || FORMAT_FILTERS[format];
        const title = dialogTitle || FORMAT_TITLES[format];
        const defaultFilename = filename || `export.${extension}`;

        // Show save file dialog
        const dialogResult = await sqlPro.dialog.saveFile({
          title,
          filters: fileFilters,
          defaultPath: defaultFilename,
        });

        // User cancelled the dialog
        if (
          !dialogResult.success ||
          dialogResult.canceled ||
          !dialogResult.filePath
        ) {
          setStatus('idle');
          return { success: false, cancelled: true };
        }

        const filePath = dialogResult.filePath;

        // Update status to exporting
        setStatus('exporting');
        onProgress?.(0);

        // Serialize the data
        const serializeFn = serializer || defaultSerializer;
        const content = await Promise.resolve(serializeFn(data, format));

        // Update progress
        setProgress(50);
        onProgress?.(50);

        // Write the file
        const writeResult = await sqlPro.file.write({
          filePath,
          content,
          encoding: 'utf8',
          atomic: true,
        });

        if (!writeResult.success) {
          throw new Error(writeResult.error || 'Failed to write file');
        }

        // Success
        setProgress(100);
        onProgress?.(100);
        setStatus('success');
        setLastExportPath(filePath);
        onSuccess?.(filePath);

        return { success: true, filePath };
      } catch (err) {
        const exportError = err instanceof Error ? err : new Error(String(err));
        setError(exportError);
        setStatus('error');
        onError?.(exportError);

        return { success: false, error: exportError.message };
      }
    },
    []
  );

  return {
    status,
    progress,
    error,
    lastExportPath,
    exportToFile,
    reset,
    isExporting: status === 'selecting' || status === 'exporting',
  };
}

// ============ Utility Functions ============

/**
 * Get the default file extension for a format
 */
export function getFormatExtension(format: ExportFileFormat): string {
  return FORMAT_EXTENSIONS[format];
}

/**
 * Get the default file filters for a format
 */
export function getFormatFilters(format: ExportFileFormat): FileFilter[] {
  return FORMAT_FILTERS[format];
}

/**
 * Generate a timestamped filename
 */
export function generateTimestampedFilename(
  baseName: string,
  format: ExportFileFormat
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = FORMAT_EXTENSIONS[format];
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Create a custom serializer for SQL INSERT statements
 */
export function createSqlInsertSerializer(
  tableName: string,
  columns?: string[]
): (data: Record<string, unknown>[]) => string {
  return (data: Record<string, unknown>[]): string => {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const cols = columns || Object.keys(data[0]);

    const escapeValue = (value: unknown): string => {
      if (value === null || value === undefined) {
        return 'NULL';
      }
      if (typeof value === 'number') {
        return String(value);
      }
      if (typeof value === 'boolean') {
        return value ? '1' : '0';
      }
      // Escape single quotes for SQL
      const str = String(value).replace(/'/g, "''");
      return `'${str}'`;
    };

    const statements = data.map((row) => {
      const values = cols.map((col) => escapeValue(row[col]));
      return `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${values.join(', ')});`;
    });

    return statements.join('\n');
  };
}

import type { ExportSchemaRequest, SchemaInfo } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
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
import { Textarea } from '@sqlpro/ui/textarea';
import { Database, FileDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { sqlPro } from '@/lib/api';

export interface SchemaExportDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Connection ID to export schema from */
  connectionId: string;
  /** Database name/filename */
  databaseName?: string;
  /** Initial schema name */
  initialName?: string;
  /** Initial description */
  initialDescription?: string;
  /** Initial documentation */
  initialDocumentation?: string;
  /** Callback when export completes successfully */
  onExportComplete?: (filePath: string) => void;
}

export function SchemaExportDialog({
  open,
  onOpenChange,
  connectionId,
  databaseName = '',
  initialName = '',
  initialDescription = '',
  initialDocumentation = '',
  onExportComplete,
}: SchemaExportDialogProps) {
  const { t } = useTranslation();
  // Form state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [documentation, setDocumentation] = useState(initialDocumentation);
  const [format, setFormat] = useState<'json' | 'sql'>('json');
  const [compress, setCompress] = useState(false);

  // Export options
  const [includeIndexes, setIncludeIndexes] = useState(true);
  const [includeTriggers, setIncludeTriggers] = useState(true);
  const [includeForeignKeys, setIncludeForeignKeys] = useState(true);

  // Schema data state
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(
    () => new Set()
  );

  // Export result state
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    filePath?: string;
    error?: string;
  } | null>(null);

  // Use useAsyncOperation for loading schema
  const {
    loading: isLoadingSchema,
    execute: executeLoadSchema,
    reset: resetSchemaLoader,
  } = useAsyncOperation(
    async (connId: string) => {
      const result = await sqlPro.db.getSchema({ connectionId: connId });
      if (result.success && result.schemas) {
        setSchemas(result.schemas);
        // Initially select all tables
        const allTables = new Set<string>();
        result.schemas.forEach((schema: SchemaInfo) => {
          schema.tables.forEach((table: { name: string }) => {
            allTables.add(`${schema.name}.${table.name}`);
          });
        });
        setSelectedTables(allTables);
        return result.schemas;
      }
      throw new Error(t('sharing.failedToLoadSchema'));
    },
    { retries: 2, retryDelay: 500 }
  );

  // Use useAsyncOperation for export
  const {
    loading: isExporting,
    execute: executeExport,
    reset: resetExport,
  } = useAsyncOperation(
    async (request: ExportSchemaRequest) => {
      const result = await sqlPro.sharing.exportSchema(request);
      setExportResult(result);
      if (result.success && result.filePath && onExportComplete) {
        onExportComplete(result.filePath);
      }
      return result;
    },
    {
      onError: (err) => {
        setExportResult({
          success: false,
          error: err.message || t('common.unknownError'),
        });
      },
    }
  );

  // Load schema when dialog opens
  useEffect(() => {
    if (open && connectionId) {
      executeLoadSchema(connectionId);
    }
  }, [open, connectionId, executeLoadSchema]);

  // Toggle table selection
  const toggleTable = useCallback((tableKey: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableKey)) {
        next.delete(tableKey);
      } else {
        next.add(tableKey);
      }
      return next;
    });
  }, []);

  // Toggle all tables in a schema
  const toggleSchema = useCallback(
    (schemaName: string) => {
      const schema = schemas.find((s) => s.name === schemaName);
      if (!schema) return;

      const schemaTables = schema.tables.map((t) => `${schemaName}.${t.name}`);
      const allSelected = schemaTables.every((t) => selectedTables.has(t));

      setSelectedTables((prev) => {
        const next = new Set(prev);
        if (allSelected) {
          // Deselect all tables in this schema
          schemaTables.forEach((t) => next.delete(t));
        } else {
          // Select all tables in this schema
          schemaTables.forEach((t) => next.add(t));
        }
        return next;
      });
    },
    [schemas, selectedTables]
  );

  // Validation
  const isValid =
    name.trim().length > 0 && selectedTables.size > 0 && !isLoadingSchema;

  // Handle export
  const handleExport = useCallback(async () => {
    if (!isValid) return;

    setExportResult(null);

    // Filter schemas to only include selected tables
    const filteredSchemas = schemas
      .map((schema) => ({
        ...schema,
        tables: schema.tables.filter((table) =>
          selectedTables.has(`${schema.name}.${table.name}`)
        ),
        views: [], // Don't include views for now
      }))
      .filter((schema) => schema.tables.length > 0);

    const request: ExportSchemaRequest = {
      connectionId,
      schema: {
        name: name.trim(),
        description: description.trim() || undefined,
        databaseName: databaseName || undefined,
        databaseType: 'sqlite',
        format,
        schemas: filteredSchemas,
        options: {
          format,
          includeIndexes,
          includeTriggers,
          includeForeignKeys,
        },
        documentation: documentation.trim() || undefined,
      },
      compress,
    };

    await executeExport(request);
  }, [
    name,
    description,
    databaseName,
    format,
    schemas,
    selectedTables,
    includeIndexes,
    includeTriggers,
    includeForeignKeys,
    documentation,
    compress,
    connectionId,
    isValid,
    executeExport,
  ]);

  // Reset dialog state on close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setName(initialName);
        setDescription(initialDescription);
        setDocumentation(initialDocumentation);
        setFormat('json');
        setCompress(false);
        setIncludeIndexes(true);
        setIncludeTriggers(true);
        setIncludeForeignKeys(true);
        setExportResult(null);
        resetSchemaLoader();
        resetExport();
      }
      onOpenChange(newOpen);
    },
    [
      onOpenChange,
      initialName,
      initialDescription,
      initialDocumentation,
      resetSchemaLoader,
      resetExport,
    ]
  );

  // Calculate total selected tables
  const totalTables = schemas.reduce(
    (sum, schema) => sum + schema.tables.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <ScrollArea className="h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('sharing.exportSchema')}
            </DialogTitle>
            <DialogDescription>
              {t('sharing.exportSchemaDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {exportResult ? (
              <div className="space-y-3">
                {exportResult.success ? (
                  <div className="rounded-base space-y-2 bg-green-50 p-4 dark:bg-green-950">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {t('sharing.exportSuccessful')}
                    </p>
                    <p
                      className="text-green-700 dark:text-green-300"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('sharing.schemaExportedSuccessfully')}
                    </p>
                    {exportResult.filePath && (
                      <p
                        className="break-all text-green-600 dark:text-green-400"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {exportResult.filePath}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-destructive/10 rounded-base p-4">
                    <p className="text-destructive font-medium">
                      {t('sharing.exportFailed')}
                    </p>
                    <p
                      className="text-destructive/80 mt-1"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {exportResult.error || t('sharing.unknownError')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Schema Name (Required) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="schema-name"
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.schemaName')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="schema-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('sharing.schemaNamePlaceholder')}
                    maxLength={200}
                    disabled={isExporting || isLoadingSchema}
                  />
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.schemaNameHelp')}
                  </p>
                </div>

                {/* Description (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="schema-description"
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.description')}
                  </Label>
                  <Textarea
                    id="schema-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('sharing.schemaDescription')}
                    maxLength={1000}
                    rows={2}
                    disabled={isExporting || isLoadingSchema}
                  />
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.descriptionHelp')}
                  </p>
                </div>

                {/* Export Format */}
                <div className="space-y-2">
                  <Label
                    htmlFor="format"
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.exportFormat')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={format}
                    onValueChange={(value) => {
                      if (value === 'json' || value === 'sql') {
                        setFormat(value);
                      }
                    }}
                    disabled={isExporting || isLoadingSchema}
                  >
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        {t('sharing.jsonFormat')}
                      </SelectItem>
                      <SelectItem value="sql">
                        {t('sharing.sqlFormat')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {format === 'json'
                      ? t('sharing.jsonFormatHelp')
                      : t('sharing.sqlFormatHelp')}
                  </p>
                </div>

                {/* Table Selection */}
                <div className="space-y-2">
                  <Label
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.tablesToExport')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  {isLoadingSchema ? (
                    <div className="flex items-center justify-center rounded-md border p-8">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span
                          className=""
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.loadingSchema')}
                        </span>
                      </div>
                    </div>
                  ) : schemas.length === 0 ? (
                    <div
                      className="text-muted-foreground rounded-md border p-4 text-center"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('sharing.noTablesFound')}
                    </div>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2 rounded-md border p-3">
                        {schemas.map((schema) => (
                          <div key={schema.name} className="space-y-2">
                            {/* Schema header with select all */}
                            <div className="flex items-center gap-2 border-b pb-2">
                              <Checkbox
                                checked={schema.tables.every((table) =>
                                  selectedTables.has(
                                    `${schema.name}.${table.name}`
                                  )
                                )}
                                onCheckedChange={() =>
                                  toggleSchema(schema.name)
                                }
                                disabled={isExporting}
                              />
                              <span
                                className="font-medium"
                                style={{
                                  fontSize: 'var(--font-ui-size, 13px)',
                                }}
                              >
                                {schema.name}
                              </span>
                              <span
                                className="text-muted-foreground"
                                style={{
                                  fontSize:
                                    'calc(var(--font-ui-size, 13px) * 0.85)',
                                }}
                              >
                                {schema.tables.length === 1
                                  ? t('sharing.tableCount', {
                                      count: schema.tables.length,
                                    })
                                  : t('sharing.tableCountPlural', {
                                      count: schema.tables.length,
                                    })}
                              </span>
                            </div>
                            {/* Tables */}
                            <div className="ml-6 space-y-1">
                              {schema.tables.map((table) => {
                                const tableKey = `${schema.name}.${table.name}`;
                                return (
                                  <label
                                    key={tableKey}
                                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded p-1"
                                  >
                                    <Checkbox
                                      checked={selectedTables.has(tableKey)}
                                      onCheckedChange={() =>
                                        toggleTable(tableKey)
                                      }
                                      disabled={isExporting}
                                    />
                                    <span
                                      className=""
                                      style={{
                                        fontSize: 'var(--font-ui-size, 13px)',
                                      }}
                                    >
                                      {table.name}
                                    </span>
                                    <span
                                      className="text-muted-foreground"
                                      style={{
                                        fontSize:
                                          'calc(var(--font-ui-size, 13px) * 0.85)',
                                      }}
                                    >
                                      {table.columns.length === 1
                                        ? t('sharing.columnCount', {
                                            count: table.columns.length,
                                          })
                                        : t('sharing.columnCountPlural', {
                                            count: table.columns.length,
                                          })}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {totalTables === 1
                      ? t('sharing.selectedTables', {
                          selected: selectedTables.size,
                          total: totalTables,
                        })
                      : t('sharing.selectedTablesPlural', {
                          selected: selectedTables.size,
                          total: totalTables,
                        })}
                  </p>
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <Label
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.includeInExport')}
                  </Label>
                  <div className="space-y-3 rounded-md border p-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={includeIndexes}
                        onCheckedChange={(checked) =>
                          setIncludeIndexes(checked === true)
                        }
                        disabled={isExporting || isLoadingSchema}
                      />
                      <div className="flex-1">
                        <p
                          className=""
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.indexes')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.indexesHelp')}
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={includeTriggers}
                        onCheckedChange={(checked) =>
                          setIncludeTriggers(checked === true)
                        }
                        disabled={isExporting || isLoadingSchema}
                      />
                      <div className="flex-1">
                        <p
                          className=""
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.triggers')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.triggersHelp')}
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={includeForeignKeys}
                        onCheckedChange={(checked) =>
                          setIncludeForeignKeys(checked === true)
                        }
                        disabled={isExporting || isLoadingSchema}
                      />
                      <div className="flex-1">
                        <p
                          className=""
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.foreignKeys')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.foreignKeysHelp')}
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={compress}
                        onCheckedChange={(checked) =>
                          setCompress(checked === true)
                        }
                        disabled={isExporting || isLoadingSchema}
                      />
                      <div className="flex-1">
                        <p
                          className=""
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t('sharing.compressExport')}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('sharing.compressHelp')}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Documentation (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="schema-documentation"
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('sharing.documentation')}
                  </Label>
                  <Textarea
                    id="schema-documentation"
                    value={documentation}
                    onChange={(e) => setDocumentation(e.target.value)}
                    placeholder={t('sharing.documentationSchemaPlaceholder')}
                    maxLength={10000}
                    rows={3}
                    disabled={isExporting || isLoadingSchema}
                  />
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('sharing.documentationHelp', {
                      count: documentation.length,
                    })}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isExporting}
            >
              {exportResult ? t('sharing.close') : t('sharing.cancel')}
            </Button>
            {!exportResult && (
              <Button onClick={handleExport} disabled={!isValid || isExporting}>
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
            )}
          </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

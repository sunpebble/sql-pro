import type { TableSchema } from '@/types/database';
import type { ColumnMockConfig, MockDataType } from '@/types/mock-data';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@sqlpro/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  Copy,
  Database,
  Dices,
  Play,
  RefreshCw,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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
import {
  getMockDataTypes,
  MockDataGenerator,
  suggestMockType,
} from '@/utils/mock-data-generator';

interface MockDataGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTable?: TableSchema;
}

export function MockDataGeneratorDialog({
  open,
  onOpenChange,
  initialTable,
}: MockDataGeneratorDialogProps) {
  const { t } = useTranslation();
  const { schema, activeConnectionId } = useConnectionStore();

  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(
    initialTable || null
  );
  const [rowCount, setRowCount] = useState(100);
  const [columnConfigs, setColumnConfigs] = useState<ColumnMockConfig[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [truncateFirst, setTruncateFirst] = useState(false);

  const mockDataTypes = useMemo(() => getMockDataTypes(), []);
  const groupedMockTypes = useMemo(() => {
    const grouped: Record<string, typeof mockDataTypes> = {};
    for (const type of mockDataTypes) {
      if (!grouped[type.category]) {
        grouped[type.category] = [];
      }
      grouped[type.category].push(type);
    }
    return grouped;
  }, [mockDataTypes]);

  // Initialize column configs when table changes
  const handleTableSelect = useCallback(
    (tableName: string | null) => {
      if (!tableName) return;
      const table = schema?.tables.find((t) => t.name === tableName);
      if (!table) return;

      setSelectedTable(table);

      // Auto-suggest mock types for each column
      const configs: ColumnMockConfig[] = table.columns.map((col) => {
        const suggestion = suggestMockType(col);
        return {
          columnName: col.name,
          columnType: col.type,
          mockType: suggestion.mockType,
          nullable: col.nullable,
          nullPercentage: col.nullable ? 10 : 0,
          options: {},
        };
      });

      setColumnConfigs(configs);
      setPreviewData([]);
      setGeneratedSQL('');
    },
    [schema]
  );

  // Update a column's mock configuration
  const updateColumnConfig = useCallback(
    (columnName: string, updates: Partial<ColumnMockConfig>) => {
      setColumnConfigs((prev) =>
        prev.map((config) =>
          config.columnName === columnName ? { ...config, ...updates } : config
        )
      );
    },
    []
  );

  // Generate preview data
  const handleGeneratePreview = useCallback(() => {
    if (!selectedTable || columnConfigs.length === 0) return;

    const generator = new MockDataGenerator();
    const preview = generator.generateRows(
      columnConfigs,
      Math.min(rowCount, 10)
    );
    setPreviewData(preview);
    setShowPreview(true);
  }, [selectedTable, columnConfigs, rowCount]);

  // Generate full SQL
  const handleGenerateSQL = useCallback(() => {
    if (!selectedTable || columnConfigs.length === 0) return;

    setIsGenerating(true);
    try {
      const generator = new MockDataGenerator();
      const rows = generator.generateRows(columnConfigs, rowCount);

      let sql = '';
      if (truncateFirst) {
        sql += `DELETE FROM ${selectedTable.name};\n\n`;
      }
      sql += generator.generateInsertSQL(
        selectedTable.name,
        columnConfigs,
        rows,
        50
      );

      setGeneratedSQL(sql);
      setPreviewData(rows.slice(0, 10));
      setShowPreview(false);
      toast.success(t('mockData.generated', { count: rowCount }));
    } catch (error) {
      toast.error(t('mockData.generateError', { error: String(error) }));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTable, columnConfigs, rowCount, truncateFirst, t]);

  // Copy SQL to clipboard
  const handleCopySQL = useCallback(async () => {
    if (!generatedSQL) return;
    await navigator.clipboard.writeText(generatedSQL);
    toast.success(t('common.copied'));
  }, [generatedSQL, t]);

  // Execute SQL directly
  const handleExecuteSQL = useCallback(async () => {
    if (!generatedSQL || !activeConnectionId) return;

    setIsGenerating(true);
    try {
      const result = await sqlPro.db.executeQuery({
        connectionId: activeConnectionId,
        query: generatedSQL,
      });
      if (result.success) {
        toast.success(t('mockData.inserted', { count: rowCount }));
        onOpenChange(false);
      } else {
        toast.error(
          t('mockData.insertError', { error: result.error || 'Unknown error' })
        );
      }
    } catch (error) {
      toast.error(t('mockData.insertError', { error: String(error) }));
    } finally {
      setIsGenerating(false);
    }
  }, [generatedSQL, activeConnectionId, rowCount, onOpenChange, t]);

  // Auto-detect all column types
  const handleAutoDetect = useCallback(() => {
    if (!selectedTable) return;

    const configs: ColumnMockConfig[] = selectedTable.columns.map((col) => {
      const suggestion = suggestMockType(col);
      return {
        columnName: col.name,
        columnType: col.type,
        mockType: suggestion.mockType,
        nullable: col.nullable,
        nullPercentage: col.nullable ? 10 : 0,
        options: {},
      };
    });

    setColumnConfigs(configs);
    toast.success(t('mockData.autoDetected'));
  }, [selectedTable, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5" />
            {t('mockData.title', 'Mock Data Generator')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mockData.description',
              'Generate realistic test data for your tables'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Table Selection and Options */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>{t('mockData.selectTable', 'Select Table')}</Label>
              <Select
                value={selectedTable?.name || ''}
                onValueChange={handleTableSelect}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'mockData.selectTablePlaceholder',
                      'Choose a table...'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {schema?.tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      <span className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {table.name}
                        <span
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          ({table.columns.length}{' '}
                          {t('mockData.columns', 'columns')})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('mockData.rowCount', 'Row Count')}</Label>
              <Input
                type="number"
                min={1}
                max={10000}
                value={rowCount}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  setRowCount(Number.isNaN(n) ? 100 : n);
                }}
                className="w-32"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="truncate"
                checked={truncateFirst}
                onCheckedChange={setTruncateFirst}
              />
              <Label
                htmlFor="truncate"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('mockData.truncateFirst', 'Clear table first')}
              </Label>
            </div>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAutoDetect}
                  disabled={!selectedTable}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('mockData.autoDetect', 'Auto-detect data types')}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Column Configuration */}
          {selectedTable && (
            <div className="rounded-base border-border flex-1 overflow-hidden border">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader className="bg-background sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[180px]">
                        {t('mockData.column', 'Column')}
                      </TableHead>
                      <TableHead className="w-[100px]">
                        {t('mockData.sqlType', 'SQL Type')}
                      </TableHead>
                      <TableHead className="w-[200px]">
                        {t('mockData.mockType', 'Mock Type')}
                      </TableHead>
                      <TableHead className="w-[100px]">
                        {t('mockData.nullable', 'Nullable')}
                      </TableHead>
                      <TableHead>{t('mockData.options', 'Options')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columnConfigs.map((config) => (
                      <ColumnConfigRow
                        key={config.columnName}
                        config={config}
                        groupedMockTypes={groupedMockTypes}
                        onUpdate={(updates) =>
                          updateColumnConfig(config.columnName, updates)
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="rounded-base border-border overflow-hidden border">
              <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-2">
                <span
                  className="font-medium"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {showPreview
                    ? t('mockData.preview', 'Preview')
                    : t('mockData.generatedData', 'Generated Data')}{' '}
                  <span className="text-muted-foreground">
                    ({previewData.length} / {rowCount}{' '}
                    {t('mockData.rows', 'rows')})
                  </span>
                </span>
                {generatedSQL && (
                  <Button variant="ghost" size="sm" onClick={handleCopySQL}>
                    <Copy className="mr-1 h-4 w-4" />
                    {t('mockData.copySQL', 'Copy SQL')}
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[150px]">
                <Table>
                  <TableHeader className="bg-background sticky top-0">
                    <TableRow>
                      {columnConfigs.map((col) => (
                        <TableHead
                          key={col.columnName}
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {col.columnName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      // eslint-disable-next-line react/no-array-index-key -- Preview data has no stable ID
                      <TableRow key={i}>
                        {columnConfigs.map((col) => (
                          <TableCell
                            key={col.columnName}
                            className="max-w-[200px] truncate font-mono"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {row[col.columnName] === null ? (
                              <span className="text-muted-foreground italic">
                                NULL
                              </span>
                            ) : (
                              String(row[col.columnName])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePreview}
            disabled={!selectedTable || isGenerating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('mockData.previewButton', 'Preview')}
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerateSQL}
            disabled={!selectedTable || isGenerating}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            {t('mockData.generateSQL', 'Generate SQL')}
          </Button>

          <Button
            variant="accent"
            onClick={handleExecuteSQL}
            disabled={!generatedSQL || isGenerating}
          >
            <Play className="mr-2 h-4 w-4" />
            {t('mockData.insertData', 'Insert Data')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Column configuration row component
interface ColumnConfigRowProps {
  config: ColumnMockConfig;
  groupedMockTypes: Record<
    string,
    { value: MockDataType; label: string; category: string }[]
  >;
  onUpdate: (updates: Partial<ColumnMockConfig>) => void;
}

function ColumnConfigRow({
  config,
  groupedMockTypes,
  onUpdate,
}: ColumnConfigRowProps) {
  const { t } = useTranslation();

  // Options UI based on mock type
  const renderOptions = () => {
    switch (config.mockType) {
      case 'integer':
      case 'float':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t('mockData.min', 'Min')}
              value={config.options?.min ?? ''}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onUpdate({
                  options: {
                    ...config.options,
                    min: Number.isNaN(n) ? 0 : n,
                  },
                });
              }}
              className="h-7 w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder={t('mockData.max', 'Max')}
              value={config.options?.max ?? ''}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onUpdate({
                  options: {
                    ...config.options,
                    max: Number.isNaN(n) ? 1000 : n,
                  },
                });
              }}
              className="h-7 w-20"
            />
          </div>
        );

      case 'enum':
        return (
          <Input
            placeholder={t('mockData.enumValues', 'value1, value2, ...')}
            value={config.options?.enumValues?.join(', ') ?? ''}
            onChange={(e) =>
              onUpdate({
                options: {
                  ...config.options,
                  enumValues: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
              })
            }
            className="h-7"
          />
        );

      case 'sequence':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t('mockData.startValue', 'Start')}
              value={config.options?.startValue ?? 1}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onUpdate({
                  options: {
                    ...config.options,
                    startValue: Number.isNaN(n) ? 1 : n,
                  },
                });
              }}
              className="h-7 w-20"
            />
            <Input
              placeholder={t('mockData.prefix', 'Prefix')}
              value={config.options?.prefix ?? ''}
              onChange={(e) =>
                onUpdate({
                  options: { ...config.options, prefix: e.target.value },
                })
              }
              className="h-7 w-20"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <span
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              TRUE %:
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              value={config.options?.truePercentage ?? 50}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onUpdate({
                  options: {
                    ...config.options,
                    truePercentage: Number.isNaN(n) ? 50 : n,
                  },
                });
              }}
              className="h-7 w-16"
            />
          </div>
        );

      default:
        return (
          <span
            className="text-muted-foreground"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            -
          </span>
        );
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{config.columnName}</TableCell>
      <TableCell
        className="text-muted-foreground"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        {config.columnType}
      </TableCell>
      <TableCell>
        <Select
          value={config.mockType}
          onValueChange={(v) => v && onUpdate({ mockType: v as MockDataType })}
        >
          <SelectTrigger className="h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedMockTypes).map(([category, types]) => (
              <div key={category}>
                <div
                  className="text-muted-foreground px-2 py-1.5 font-semibold"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {category}
                </div>
                {types.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {config.nullable && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={config.nullPercentage}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                onUpdate({
                  nullPercentage: Number.isNaN(n) ? 0 : n,
                });
              }}
              className="h-7 w-14"
            />
            <span
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              %
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>{renderOptions()}</TableCell>
    </TableRow>
  );
}

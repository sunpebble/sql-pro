import type { ColumnSchema } from '@/types/database';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@sqlpro/ui/empty';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Edit3, MousePointerClick, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface BulkEditField {
  column: string;
  value: unknown;
}

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnSchema[];
  selectedRowCount: number;
  onApply: (fields: BulkEditField[]) => void;
}

export function BulkEditDialog({
  open,
  onOpenChange,
  columns,
  selectedRowCount,
  onApply,
}: BulkEditDialogProps) {
  const { t } = useTranslation('common');
  const [editFields, setEditFields] = useState<BulkEditField[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  // Get columns that haven't been added yet
  const availableColumns = columns.filter(
    (col) => !col.isPrimaryKey && !editFields.some((f) => f.column === col.name)
  );

  const handleAddField = useCallback(() => {
    if (!selectedColumn) return;

    setEditFields((prev) => [...prev, { column: selectedColumn, value: '' }]);
    setSelectedColumn('');
  }, [selectedColumn]);

  const handleRemoveField = useCallback((column: string) => {
    setEditFields((prev) => prev.filter((f) => f.column !== column));
  }, []);

  const handleFieldValueChange = useCallback(
    (column: string, value: unknown) => {
      setEditFields((prev) =>
        prev.map((f) => (f.column === column ? { ...f, value } : f))
      );
    },
    []
  );

  const handleApply = useCallback(() => {
    if (editFields.length === 0) return;
    onApply(editFields);
    setEditFields([]);
    onOpenChange(false);
  }, [editFields, onApply, onOpenChange]);

  const handleClose = useCallback(() => {
    setEditFields([]);
    setSelectedColumn('');
    onOpenChange(false);
  }, [onOpenChange]);

  // Get column info for a field
  const getColumnInfo = (columnName: string) => {
    return columns.find((c) => c.name === columnName);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            {t('table.bulkEdit.title')}
          </DialogTitle>
          <DialogDescription>
            {t('table.bulkEdit.description', { count: selectedRowCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add field selector */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label
                htmlFor="column-select"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('table.bulkEdit.addFieldToEdit')}
              </Label>
              <Select
                value={selectedColumn}
                onValueChange={(value: string) =>
                  setSelectedColumn(value || '')
                }
                disabled={availableColumns.length === 0}
              >
                <SelectTrigger id="column-select">
                  <SelectValue placeholder={t('table.bulkEdit.selectColumn')} />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col) => (
                    <SelectItem key={col.name} value={col.name}>
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <span
                          className="text-muted-foreground"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          ({col.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddField}
              disabled={!selectedColumn}
            >
              {t('table.bulkEdit.add')}
            </Button>
          </div>

          {/* Edit fields list */}
          {editFields.length > 0 ? (
            <div className="space-y-3">
              {editFields.map((field) => {
                const colInfo = getColumnInfo(field.column);
                return (
                  <div
                    key={field.column}
                    className="bg-muted/30 rounded-base flex items-start gap-3 border p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.column}</span>
                        {colInfo && (
                          <Badge
                            variant="secondary"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {colInfo.type}
                          </Badge>
                        )}
                        {colInfo?.nullable && (
                          <Badge
                            variant="outline"
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('table.bulkEdit.nullable')}
                          </Badge>
                        )}
                      </div>
                      <Input
                        value={field.value === null ? '' : String(field.value)}
                        onChange={(e) =>
                          handleFieldValueChange(field.column, e.target.value)
                        }
                        placeholder={
                          colInfo?.nullable
                            ? t('table.bulkEdit.enterValueOrNull')
                            : t('table.bulkEdit.enterNewValue')
                        }
                        className="h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveField(field.column)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty className="border py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClick />
                </EmptyMedia>
                <EmptyTitle
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
                >
                  {t('table.bulkEdit.noFieldsAdded')}
                </EmptyTitle>
                <EmptyDescription>
                  {t('table.bulkEdit.selectColumnToStart')}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {/* Summary */}
          {editFields.length > 0 && (
            <div
              className="bg-primary/5 border-primary/20 rounded-base border p-3"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              <p>
                {t('table.bulkEdit.fieldsWillBeUpdated', {
                  count: editFields.length,
                  rows: selectedRowCount,
                })}
              </p>
              <p
                className="text-muted-foreground mt-1"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('table.bulkEdit.willCreatePendingUpdates', {
                  count: selectedRowCount,
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t('actions.cancel')}
          </DialogClose>
          <Button
            onClick={handleApply}
            disabled={editFields.length === 0}
            className={cn(
              'min-w-[140px]',
              editFields.length > 0 &&
                'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
            )}
          >
            <Edit3 className="mr-1.5 h-4 w-4" />
            {t('table.bulkEdit.applyToRows', { count: selectedRowCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

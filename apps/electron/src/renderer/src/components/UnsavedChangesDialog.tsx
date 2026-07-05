import type { PendingChange } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@quarry/ui/alert-dialog';
import { Button } from '@quarry/ui/button';
import { AlertTriangle, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: PendingChange[];
  connectionId: string;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}

interface ChangeSummary {
  table: string;
  inserts: number;
  updates: number;
  deletes: number;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  changes,
  connectionId: _connectionId,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edge case: If changes are cleared between check and display, skip dialog
  useEffect(() => {
    if (open && changes.length === 0) {
      // No changes exist, proceed with action by calling onDiscard
      // This is safe because discarding empty changes is a no-op and just proceeds
      onDiscard();
      onOpenChange(false);
    }
  }, [open, changes.length, onDiscard, onOpenChange]);

  // Group changes by table and count by type
  const summaries = useMemo(() => {
    const grouped = new Map<string, ChangeSummary>();

    changes.forEach((change) => {
      if (!grouped.has(change.table)) {
        grouped.set(change.table, {
          table: change.table,
          inserts: 0,
          updates: 0,
          deletes: 0,
        });
      }

      const summary = grouped.get(change.table)!;
      if (change.type === 'insert') {
        summary.inserts++;
      } else if (change.type === 'update') {
        summary.updates++;
      } else if (change.type === 'delete') {
        summary.deletes++;
      }
    });

    return Array.from(grouped.values());
  }, [changes]);

  const totalChanges = changes.length;

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave();
      // Only close if save succeeded (no error thrown)
      onOpenChange(false);
    } catch (err) {
      // Keep dialog open and show error
      setError(
        err instanceof Error
          ? err.message
          : t('unsavedChangesDialog.failedToSave')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setError(null);
    onDiscard();
    onOpenChange(false);
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="text-amber-600" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('unsavedChangesDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('unsavedChangesDialog.description', { count: totalChanges })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Change Summary */}
        <div className="space-y-2">
          {summaries.map((summary) => (
            <div
              key={summary.table}
              className="bg-muted/50 rounded-md px-3 py-2"
            >
              <div
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {summary.table}
              </div>
              <div
                className="mt-1 flex flex-wrap gap-3"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {summary.inserts > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Plus className="h-3 w-3" />
                    <span>
                      {t('unsavedChangesDialog.inserts', {
                        count: summary.inserts,
                      })}
                    </span>
                  </div>
                )}
                {summary.updates > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Edit3 className="h-3 w-3" />
                    <span>
                      {t('unsavedChangesDialog.updates', {
                        count: summary.updates,
                      })}
                    </span>
                  </div>
                )}
                {summary.deletes > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Trash2 className="h-3 w-3" />
                    <span>
                      {t('unsavedChangesDialog.deletes', {
                        count: summary.deletes,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDiscard}
            disabled={isLoading}
          >
            {t('unsavedChangesDialog.discardChanges')}
          </Button>
          <AlertDialogAction onClick={handleSave} disabled={isLoading}>
            {isLoading
              ? t('unsavedChangesDialog.saving')
              : t('unsavedChangesDialog.saveChanges')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

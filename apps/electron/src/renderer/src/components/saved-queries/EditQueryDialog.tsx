import type { QueryParameter, SavedQuery } from '@shared/types/saved-query';

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Textarea } from '@sqlpro/ui/textarea';
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
import {
  parseParameters,
  useSavedQueriesStore,
} from '@/stores/saved-queries-store';

interface EditQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: SavedQuery | null;
}

export function EditQueryDialog({
  open,
  onOpenChange,
  query,
}: EditQueryDialogProps) {
  if (!query) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {open && <EditQueryForm query={query} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function EditQueryForm({
  query,
  onOpenChange,
}: {
  query: SavedQuery;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('common');
  const { updateQuery, deleteQuery, folders } = useSavedQueriesStore();

  const [formState, setFormState] = useState({
    name: query.name,
    description: query.description || '',
    queryText: query.query,
    folderId: query.folderId,
    error: null as string | null,
    showDeleteConfirm: false,
  });

  // Detect parameters in query
  const parameters = useMemo<QueryParameter[]>(
    () => parseParameters(formState.queryText),
    [formState.queryText]
  );

  const handleUpdate = useCallback(() => {
    if (!query) return;

    const trimmedName = formState.name.trim();

    if (!trimmedName) {
      setFormState((prev) => ({
        ...prev,
        error: t('savedQueries.errorNameRequired', {
          defaultValue: 'Query name is required',
        }),
      }));
      return;
    }

    if (!formState.queryText.trim()) {
      setFormState((prev) => ({
        ...prev,
        error: t('savedQueries.errorQueryEmpty', {
          defaultValue: 'Query cannot be empty',
        }),
      }));
      return;
    }

    updateQuery(query.id, {
      name: trimmedName,
      description: formState.description.trim() || undefined,
      query: formState.queryText,
      folderId: formState.folderId,
    });

    toast.success(
      t('savedQueries.updated', {
        defaultValue: 'Query updated successfully',
      })
    );

    onOpenChange(false);
  }, [query, formState, updateQuery, onOpenChange, t]);

  const handleDelete = useCallback(() => {
    if (!query) return;

    deleteQuery(query.id);

    toast.success(
      t('savedQueries.deleted', {
        defaultValue: 'Query deleted',
      })
    );

    onOpenChange(false);
  }, [query, deleteQuery, onOpenChange, t]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('savedQueries.editTitle', { defaultValue: 'Edit Query' })}
        </DialogTitle>
        <DialogDescription>
          {t('savedQueries.editDescription', {
            defaultValue: 'Modify the saved query details and SQL.',
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="edit-query-name">
            {t('savedQueries.name', { defaultValue: 'Name' })}
          </Label>
          <Input
            id="edit-query-name"
            value={formState.name}
            onChange={(e) => {
              setFormState((prev) => ({
                ...prev,
                name: e.target.value,
                error: null,
              }));
            }}
            placeholder={t('savedQueries.namePlaceholder', {
              defaultValue: 'e.g., Get active users',
            })}
            autoFocus
          />
          {formState.error && (
            <p
              className="text-destructive"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {formState.error}
            </p>
          )}
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <Label htmlFor="edit-query-description">
            {t('savedQueries.description', { defaultValue: 'Description' })}
            <span
              className="text-muted-foreground ml-1"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('common.optional', { defaultValue: '(optional)' })}
            </span>
          </Label>
          <Input
            id="edit-query-description"
            value={formState.description}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder={t('savedQueries.descriptionPlaceholder', {
              defaultValue: 'Describe what this query does',
            })}
          />
        </div>

        {/* Folder selector */}
        <div className="space-y-2">
          <Label>{t('savedQueries.folder', { defaultValue: 'Folder' })}</Label>
          <Select
            value={formState.folderId || 'root'}
            onValueChange={(v) =>
              setFormState((prev) => ({
                ...prev,
                folderId: v === 'root' ? null : v,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">
                {t('savedQueries.noFolder', { defaultValue: 'No folder' })}
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Query text editor */}
        <div className="space-y-2">
          <Label htmlFor="edit-query-sql">
            {t('savedQueries.sqlQuery', { defaultValue: 'SQL Query' })}
          </Label>
          <Textarea
            id="edit-query-sql"
            value={formState.queryText}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, queryText: e.target.value }))
            }
            placeholder={t('savedQueries.sqlQueryPlaceholder', {
              defaultValue: 'SELECT * FROM ...',
            })}
            className="min-h-32 font-mono"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          />
        </div>

        {/* Parameters detected */}
        {parameters.length > 0 && (
          <div className="bg-muted/50 rounded-base border-border border p-3">
            <p
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('savedQueries.parametersDetected', {
                defaultValue: 'Parameters detected',
              })}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {parameters.map((p) => (
                <Badge key={p.name} variant="secondary">
                  {`{{${p.name}}}`}
                  {p.type && p.type !== 'string' && (
                    <span
                      className="text-muted-foreground ml-1"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      :{p.type}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-row">
        {formState.showDeleteConfirm ? (
          <div className="flex items-center gap-2 sm:mr-auto">
            <span
              className="text-destructive"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('savedQueries.deleteConfirm', {
                defaultValue: 'Delete this query?',
              })}
            </span>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              {t('common.yes', { defaultValue: 'Yes' })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFormState((prev) => ({ ...prev, showDeleteConfirm: false }))
              }
            >
              {t('common.no', { defaultValue: 'No' })}
            </Button>
          </div>
        ) : (
          <Button
            variant="destructive"
            onClick={() =>
              setFormState((prev) => ({ ...prev, showDeleteConfirm: true }))
            }
            className="sm:mr-auto"
          >
            {t('savedQueries.delete', { defaultValue: 'Delete' })}
          </Button>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button onClick={handleUpdate} disabled={!formState.name.trim()}>
          {t('savedQueries.saveChanges', { defaultValue: 'Save Changes' })}
        </Button>
      </DialogFooter>
    </>
  );
}

import type { QueryParameter } from '@shared/types/saved-query';

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlpro/ui/dialog';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  parseParameters,
  useSavedQueriesStore,
} from '@/stores/saved-queries-store';

interface SaveQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery: string;
}

interface SaveQueryFormProps {
  initialQuery: string;
  onOpenChange: (open: boolean) => void;
}

function SaveQueryForm({ initialQuery, onOpenChange }: SaveQueryFormProps) {
  const { t } = useTranslation('common');
  const { saveQuery, folders } = useSavedQueriesStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect parameters in query
  const parameters = useMemo<QueryParameter[]>(
    () => parseParameters(initialQuery),
    [initialQuery]
  );

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        t('savedQueries.errorNameRequired', {
          defaultValue: 'Query name is required',
        })
      );
      return;
    }

    if (!initialQuery.trim()) {
      setError(
        t('savedQueries.errorQueryEmpty', {
          defaultValue: 'Query cannot be empty',
        })
      );
      return;
    }

    saveQuery({
      name: trimmedName,
      description: description.trim() || undefined,
      query: initialQuery,
      folderId,
    });

    toast.success(
      t('savedQueries.saved', {
        defaultValue: 'Query saved successfully',
        name: trimmedName,
      })
    );

    onOpenChange(false);
  }, [name, description, initialQuery, folderId, saveQuery, onOpenChange, t]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('savedQueries.saveTitle', { defaultValue: 'Save Query' })}
        </DialogTitle>
        <DialogDescription>
          {t('savedQueries.saveDescription', {
            defaultValue:
              'Save this query for quick access later. You can organize it in a folder.',
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="query-name">
            {t('savedQueries.name', { defaultValue: 'Name' })}
          </Label>
          <Input
            id="query-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder={t('savedQueries.namePlaceholder', {
              defaultValue: 'e.g., Get active users',
            })}
            autoFocus
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <Label htmlFor="query-description">
            {t('savedQueries.description', { defaultValue: 'Description' })}
            <span className="text-muted-foreground ml-1 text-xs">
              {t('common.optional', { defaultValue: '(optional)' })}
            </span>
          </Label>
          <Input
            id="query-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('savedQueries.descriptionPlaceholder', {
              defaultValue: 'Describe what this query does',
            })}
          />
        </div>

        {/* Folder selector */}
        <div className="space-y-2">
          <Label>{t('savedQueries.folder', { defaultValue: 'Folder' })}</Label>
          <Select
            value={folderId || 'root'}
            onValueChange={(v) => setFolderId(v === 'root' ? null : v)}
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

        {/* Parameters detected */}
        {parameters.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">
              {t('savedQueries.parametersDetected', {
                defaultValue: 'Parameters detected',
              })}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {parameters.map((p) => (
                <Badge key={p.name} variant="secondary">
                  {`{{${p.name}}}`}
                  {p.type && p.type !== 'string' && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      :{p.type}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          {t('savedQueries.save', { defaultValue: 'Save' })}
        </Button>
      </DialogFooter>
    </>
  );
}

export function SaveQueryDialog({
  open,
  onOpenChange,
  initialQuery,
}: SaveQueryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {open && (
          <SaveQueryForm
            initialQuery={initialQuery}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

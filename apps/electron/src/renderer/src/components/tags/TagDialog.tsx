import type { TagDefinition } from '@shared/types/tag';

import { DEFAULT_TAG_COLOR } from '@shared/types/tag';
import { Button } from '@sqlpro/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlpro/ui/dialog';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ColorPicker } from '@/components/ui/color-picker';

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTag: (name: string, color: string) => void;
  existingTagNames?: string[];
}

interface CreateTagFormProps {
  onOpenChange: (open: boolean) => void;
  onCreateTag: (name: string, color: string) => void;
  existingTagNames: string[];
}

function CreateTagForm({
  onOpenChange,
  onCreateTag,
  existingTagNames,
}: CreateTagFormProps) {
  const { t } = useTranslation('sidebar');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_TAG_COLOR);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        t('tags.errorNameRequired', { defaultValue: 'Tag name is required' })
      );
      return;
    }

    if (existingTagNames.includes(trimmedName.toLowerCase())) {
      setError(
        t('tags.errorDuplicate', {
          defaultValue: 'A tag with this name already exists',
        })
      );
      return;
    }

    onCreateTag(trimmedName, color);
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('tags.createTag', { defaultValue: 'Create Tag' })}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="tag-name">
            {t('tags.name', { defaultValue: 'Name' })}
          </Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder={t('tags.namePlaceholder', {
              defaultValue: 'e.g., Important, Archive, WIP',
            })}
            autoFocus
          />
          {error && (
            <p
              className="text-destructive"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {error}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t('tags.color', { defaultValue: 'Color' })}</Label>
          <div className="flex items-center gap-3">
            <ColorPicker color={color} onChange={setColor} />
            <span
              className="text-muted-foreground"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('tags.colorHint', {
                defaultValue: 'Choose a color for this tag',
              })}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('dialog.cancel')}
        </Button>
        <Button onClick={handleCreate} disabled={!name.trim()}>
          {t('tags.create', { defaultValue: 'Create' })}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CreateTagDialog({
  open,
  onOpenChange,
  onCreateTag,
  existingTagNames = [],
}: CreateTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        {open && (
          <CreateTagForm
            onOpenChange={onOpenChange}
            onCreateTag={onCreateTag}
            existingTagNames={existingTagNames}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: TagDefinition | null;
  onUpdateTag: (id: string, updates: { name?: string; color?: string }) => void;
  onDeleteTag: (id: string) => void;
  existingTagNames?: string[];
}

interface EditTagFormProps {
  tag: TagDefinition;
  onOpenChange: (open: boolean) => void;
  onUpdateTag: (id: string, updates: { name?: string; color?: string }) => void;
  onDeleteTag: (id: string) => void;
  existingTagNames: string[];
}

function EditTagForm({
  tag,
  onOpenChange,
  onUpdateTag,
  onDeleteTag,
  existingTagNames,
}: EditTagFormProps) {
  const { t } = useTranslation('sidebar');
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        t('tags.errorNameRequired', { defaultValue: 'Tag name is required' })
      );
      return;
    }

    const otherTagNames = existingTagNames.filter(
      (n) => n !== tag.name.toLowerCase()
    );
    if (otherTagNames.includes(trimmedName.toLowerCase())) {
      setError(
        t('tags.errorDuplicate', {
          defaultValue: 'A tag with this name already exists',
        })
      );
      return;
    }

    const updates: { name?: string; color?: string } = {};
    if (trimmedName !== tag.name) updates.name = trimmedName;
    if (color !== tag.color) updates.color = color;

    if (Object.keys(updates).length > 0) {
      onUpdateTag(tag.id, updates);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDeleteTag(tag.id);
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('tags.editTag', { defaultValue: 'Edit Tag' })}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="edit-tag-name">
            {t('tags.name', { defaultValue: 'Name' })}
          </Label>
          <Input
            id="edit-tag-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUpdate();
              }
            }}
            autoFocus
          />
          {error && (
            <p
              className="text-destructive"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {error}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t('tags.color', { defaultValue: 'Color' })}</Label>
          <ColorPicker color={color} onChange={setColor} />
        </div>
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button
          variant="destructive"
          onClick={handleDelete}
          className="sm:mr-auto"
        >
          {t('tags.delete', { defaultValue: 'Delete' })}
        </Button>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('dialog.cancel')}
        </Button>
        <Button onClick={handleUpdate}>
          {t('tags.save', { defaultValue: 'Save' })}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EditTagDialog({
  open,
  onOpenChange,
  tag,
  onUpdateTag,
  onDeleteTag,
  existingTagNames = [],
}: EditTagDialogProps) {
  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        {open && tag && (
          <EditTagForm
            tag={tag}
            onOpenChange={onOpenChange}
            onUpdateTag={onUpdateTag}
            onDeleteTag={onDeleteTag}
            existingTagNames={existingTagNames}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

import { DEFAULT_TAG_COLOR } from '@shared/types/tag';

import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ColorPicker } from '@/components/ui/color-picker';

interface FolderManagementProps {
  onCreateFolder: (name: string, color?: string) => void;
}

export function FolderManagement({ onCreateFolder }: FolderManagementProps) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_TAG_COLOR);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreate = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onCreateFolder(trimmedName, color);
    setName('');
    setColor(DEFAULT_TAG_COLOR);
    setIsExpanded(false);
  }, [name, color, onCreateFolder]);

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs"
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        {t('savedQueries.newFolder', { defaultValue: 'New Folder' })}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleCreate();
          }
          if (e.key === 'Escape') {
            setIsExpanded(false);
            setName('');
          }
        }}
        placeholder={t('savedQueries.folderName', {
          defaultValue: 'Folder name',
        })}
        className="h-8 text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ColorPicker color={color} onChange={setColor} className="h-5 w-5" />
          <span className="text-muted-foreground text-xs">
            {t('savedQueries.color', { defaultValue: 'Color' })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              setIsExpanded(false);
              setName('');
            }}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            {t('common.add', { defaultValue: 'Add' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

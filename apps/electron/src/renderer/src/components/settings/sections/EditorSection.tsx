import { ChevronRight, Keyboard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardShortcutsSettings } from '@/components/KeyboardShortcutsSettings';
import { cn } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import {
  PRESET_INFO,
  useKeyboardShortcutsStore,
} from '@/stores/keyboard-shortcuts-store';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingGroup } from '../items/SettingGroup';

export function EditorSection() {
  const { t } = useTranslation('settings');
  const { editorVimMode, setEditorVimMode, appVimMode, setAppVimMode } =
    useSettingsStore();
  const { activePreset } = useKeyboardShortcutsStore();

  // Keyboard shortcuts dialog state
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        {/* Vim Mode Section */}
        <SettingGroup title={t('vim.title')} description={t('vim.description')}>
          <div className="grid grid-cols-2 gap-2">
            <VimModeToggle
              label={t('vim.editor')}
              description={t('vim.editorDesc')}
              enabled={editorVimMode}
              onToggle={setEditorVimMode}
            />
            <VimModeToggle
              label={t('vim.app')}
              description={t('vim.appDesc')}
              enabled={appVimMode}
              onToggle={setAppVimMode}
            />
          </div>
        </SettingGroup>

        {/* Keyboard Shortcuts Section */}
        <SettingGroup title={t('shortcuts.title')}>
          <button
            onClick={() => setShortcutsDialogOpen(true)}
            className="card-interactive flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <Keyboard className="text-muted-foreground h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium">
                  {PRESET_INFO[activePreset].label} {t('shortcuts.preset')}
                </span>
                <p className="text-muted-foreground text-xs">
                  {t('shortcuts.customize')}
                </p>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          </button>
        </SettingGroup>
      </div>

      {/* Keyboard Shortcuts Settings Dialog - rendered at root level for proper portal handling */}
      <KeyboardShortcutsSettings
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />
    </>
  );
}

interface VimModeToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function VimModeToggle({
  label,
  description,
  enabled,
  onToggle,
}: VimModeToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={cn(
        'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
        enabled
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-mono text-xs font-bold uppercase',
            enabled ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {enabled ? 'VIM' : 'OFF'}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-muted-foreground mt-1 text-xs">{description}</span>
    </button>
  );
}

import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConnectionStore, useDialogStore, useThemeStore } from '@/stores';
import { ConnectionTabBar } from './ConnectionTabBar';
import { Toolbar } from './Toolbar';

/**
 * Unified custom titlebar component (VSCode-style).
 * Combines connection tabs, toolbar controls, theme switching, and settings.
 * This is draggable on macOS for window management.
 */
export function Titlebar() {
  const { theme, setTheme } = useThemeStore();
  const openSettings = useDialogStore((s) => s.openSettings);
  const { connection } = useConnectionStore();
  const { t } = useTranslation('common');

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('theme.light', { defaultValue: 'Light' });
      case 'dark':
        return t('theme.dark', { defaultValue: 'Dark' });
      default:
        return t('theme.system', { defaultValue: 'System' });
    }
  };

  return (
    <div
      className="titlebar border-border/30 flex h-10 shrink-0 items-center border-b"
      data-tauri-drag-region
    >
      {/* macOS traffic light padding - approximately 84px on macOS */}
      <div className="w-[84px] shrink-0" data-tauri-drag-region />

      {/* Connection Tabs - flexible width, also draggable in empty space */}
      {connection ? (
        <ConnectionTabBar className="h-full min-w-0 flex-1 border-b-0" />
      ) : (
        // Empty draggable space with centered app name when no connection
        <div
          className="text-muted-foreground/60 flex min-w-0 flex-1 items-center justify-center text-sm font-medium"
          data-tauri-drag-region
        >
          SQL Pro
        </div>
      )}

      {/* Right side controls - non-draggable */}
      <div className="titlebar-no-drag flex shrink-0 items-center gap-1 px-2">
        {/* Toolbar controls (changes indicator, layout, commands, help) */}
        {connection && <Toolbar />}

        {/* Theme Switcher */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {getThemeIcon()}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {t('theme.tooltip', {
                theme: getThemeLabel(),
                defaultValue: 'Theme: {{theme}}',
              })}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              {t('theme.light', { defaultValue: 'Light' })}
              {theme === 'light' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              {t('theme.dark', { defaultValue: 'Dark' })}
              {theme === 'dark' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              {t('theme.system', { defaultValue: 'System' })}
              {theme === 'system' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings Button */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={openSettings}
              data-action="open-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('theme.settings', { defaultValue: 'Settings' })}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

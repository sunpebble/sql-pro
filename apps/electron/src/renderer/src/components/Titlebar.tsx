import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Database, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useThemeStore } from '@/stores/theme-store';
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
      className="command-bar titlebar bg-background/[0.78] border-border/70 flex h-10 shrink-0 items-center border-b backdrop-blur-md"
      data-tauri-drag-region
    >
      {/* macOS traffic light padding - approximately 84px on macOS */}
      <div className="w-[80px] shrink-0" data-tauri-drag-region />

      {/* Connection Tabs or App Logo - flexible width, also draggable in empty space */}
      {connection ? (
        <ConnectionTabBar className="h-full min-w-0 flex-1 border-b-0" />
      ) : (
        // Centered app branding when no connection
        <div
          className="flex min-w-0 flex-1 items-center justify-center"
          data-tauri-drag-region
        >
          <Database className="text-main mr-2 h-4 w-4 shrink-0" />
          <span
            className="text-foreground font-medium tracking-wide"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            SQL Pro
          </span>
        </div>
      )}

      {/* Right side controls - non-draggable */}
      <div className="titlebar-no-drag flex shrink-0 items-center gap-1 px-2.5">
        {/* Toolbar controls (changes indicator, layout, commands, help) */}
        {connection && <Toolbar />}

        {/* Separator */}
        <div className="bg-border mx-1 h-4 w-px" />

        {/* Theme Switcher */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('theme.tooltip', {
                    theme: getThemeLabel(),
                    defaultValue: 'Theme: {{theme}}',
                  })}
                  className="rounded-base text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground h-7 w-7"
                >
                  {getThemeIcon()}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
              {t('theme.tooltip', {
                theme: getThemeLabel(),
                defaultValue: 'Theme: {{theme}}',
              })}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-auto min-w-0">
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className="whitespace-nowrap"
            >
              <Sun className="mr-2 h-4 w-4" />
              {t('theme.light', { defaultValue: 'Light' })}
              {theme === 'light' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className="whitespace-nowrap"
            >
              <Moon className="mr-2 h-4 w-4" />
              {t('theme.dark', { defaultValue: 'Dark' })}
              {theme === 'dark' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className="whitespace-nowrap"
            >
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
              aria-label={t('theme.settings', { defaultValue: 'Settings' })}
              className="rounded-base text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground h-7 w-7"
              onClick={openSettings}
              data-action="open-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
            <span className="tooltip-kbd flex items-center gap-2">
              {t('theme.settings', { defaultValue: 'Settings' })}
              <ShortcutKbd action="settings.open" />
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

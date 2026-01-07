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
import { useDialogStore, useThemeStore } from '@/stores';

/**
 * Custom titlebar component with global app controls.
 * Includes theme switching and settings access.
 * This is draggable on macOS for window management.
 */
export function Titlebar() {
  const { theme, setTheme } = useThemeStore();
  const openSettings = useDialogStore((s) => s.openSettings);

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
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <div
      className="titlebar border-border/50 flex h-10 shrink-0 items-center justify-end border-b px-2"
      data-tauri-drag-region
    >
      {/* Right side controls - non-draggable */}
      <div className="titlebar-no-drag flex items-center gap-1">
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
            <TooltipContent>Theme: {getThemeLabel()}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              Light
              {theme === 'light' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
              {theme === 'dark' && (
                <span className="text-primary ml-auto">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" />
              System
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
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Bot, Compass, FileText, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LayoutButtons } from '@/components/LayoutButtons';
import { ShortcutKbd } from '@/components/ui/kbd';
import { TOOLBAR_BUTTON_INTERACTIVE } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useChangesStore } from '@/stores/changes-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

/**
 * Simplified toolbar with only essential right-side controls.
 * Database-specific actions have been moved to ConnectionTabBar context menu.
 */
export function Toolbar() {
  const { connection } = useConnectionStore();
  const { hasChanges, changes } = useChangesStore();
  const { startTour } = useOnboardingStore();
  const openChangesPanel = useDialogStore((s) => s.openChangesPanel);
  const { agentSidebarOpen, toggleAgentSidebar } = useDialogStore();
  const { t } = useTranslation('common');

  if (!connection) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      data-tour-target="toolbar"
    >
      {/* Pending Changes Indicator - Clickable */}
      {hasChanges() && (
        <button
          onClick={openChangesPanel}
          className={`flex shrink-0 items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-sm text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400 ${TOOLBAR_BUTTON_INTERACTIVE}`}
        >
          <FileText className="h-4 w-4" />
          <span>
            {t('toolbar.unsavedChanges', {
              count: changes.length,
              defaultValue: '{{count}} unsaved change',
              defaultValue_plural: '{{count}} unsaved changes',
            })}
          </span>
        </button>
      )}

      {/* AI Agent Button */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleAgentSidebar(connection.id)}
            className={`h-7 w-7 ${agentSidebarOpen ? 'bg-accent' : ''} ${TOOLBAR_BUTTON_INTERACTIVE}`}
          >
            <Bot className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('toolbar.aiAgent', { defaultValue: 'AI Agent' })}
        </TooltipContent>
      </Tooltip>

      {/* Layout Buttons - VSCode style panel toggles */}
      <LayoutButtons />

      {/* Command Palette Hint */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Trigger command palette via keyboard event
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                })
              );
            }}
            className={`text-muted-foreground h-7 gap-1.5 text-xs ${TOOLBAR_BUTTON_INTERACTIVE}`}
          >
            <span>{t('toolbar.commands', { defaultValue: 'Commands' })}</span>
            <ShortcutKbd action="action.command-palette" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('toolbar.openCommandPalette', {
            defaultValue: 'Open command palette',
          })}
        </TooltipContent>
      </Tooltip>

      {/* Help Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${TOOLBAR_BUTTON_INTERACTIVE}`}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {t('toolbar.help', { defaultValue: 'Help' })}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={startTour}>
            <Compass className="h-4 w-4" />
            {t('toolbar.takeATour', { defaultValue: 'Take a Tour' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

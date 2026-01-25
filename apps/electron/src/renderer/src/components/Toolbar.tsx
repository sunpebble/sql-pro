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
import { ShortcutKbd } from '@/components/ui/kbd';
import {
  cn,
  TOOLBAR_BUTTON_INTERACTIVE,
  TOOLTIP_CONTENT_STYLE,
} from '@/lib/utils';
import { useChangesStore } from '@/stores/changes-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

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
      className={cn(
        'flex shrink-0 items-center gap-1.5',
        'animate-fade-in-up opacity-0 [animation-delay:0.15s]'
      )}
      data-tour-target="toolbar"
    >
      {hasChanges() && (
        <button
          type="button"
          onClick={openChangesPanel}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5',
            'text-sm font-medium',
            'bg-gradient-to-br from-amber-500/18 via-amber-500/12 to-amber-500/8',
            'text-amber-600 dark:text-amber-400',
            'border border-amber-500/25',
            'shadow-[0_1px_3px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]',
            'dark:shadow-[0_1px_4px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]',
            'transition-all duration-200',
            'hover:from-amber-500/22 hover:to-amber-500/12',
            'hover:shadow-[0_2px_8px_rgba(245,158,11,0.25)]',
            'dark:hover:shadow-[0_2px_10px_rgba(245,158,11,0.3)]',
            'active:scale-[0.98]',
            TOOLBAR_BUTTON_INTERACTIVE
          )}
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

      <div className="from-primary/20 via-border/50 mx-1 h-5 w-px bg-gradient-to-b to-transparent" />

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleAgentSidebar(connection.id)}
            className={cn(
              'h-8 w-8',
              'transition-all duration-200',
              agentSidebarOpen
                ? [
                    'text-primary',
                    'from-primary/18 to-primary/10 bg-gradient-to-br',
                    'ring-primary/30 ring-1',
                    'shadow-[0_1px_6px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
                    'dark:shadow-[0_1px_8px_rgba(52,211,153,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]',
                  ]
                : [
                    'text-muted-foreground',
                    'hover:text-foreground',
                    'hover:from-muted/80 hover:to-muted/50 hover:bg-gradient-to-br',
                    'hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
                    'dark:hover:shadow-[0_1px_4px_rgba(0,0,0,0.25)]',
                  ],
              'active:scale-[0.96]',
              TOOLBAR_BUTTON_INTERACTIVE
            )}
          >
            <Bot className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
          {t('toolbar.aiAgent', { defaultValue: 'AI Agent' })}
        </TooltipContent>
      </Tooltip>

      <div className="from-primary/20 via-border/50 mx-1 h-5 w-px bg-gradient-to-b to-transparent" />

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                })
              );
            }}
            className={cn(
              'h-8 gap-2 px-3',
              'text-xs font-medium',
              'text-muted-foreground hover:text-foreground',
              'hover:from-muted/80 hover:to-muted/50 hover:bg-gradient-to-br',
              'hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
              'dark:hover:shadow-[0_1px_4px_rgba(0,0,0,0.25)]',
              'hover:border-border/40 border border-transparent',
              'transition-all duration-200',
              'active:scale-[0.98]',
              TOOLBAR_BUTTON_INTERACTIVE
            )}
          >
            <span>{t('toolbar.commands', { defaultValue: 'Commands' })}</span>
            <ShortcutKbd action="action.command-palette" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
          {t('toolbar.openCommandPalette', {
            defaultValue: 'Open command palette',
          })}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  'text-muted-foreground hover:text-foreground',
                  'hover:from-muted/80 hover:to-muted/50 hover:bg-gradient-to-br',
                  'hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
                  'dark:hover:shadow-[0_1px_4px_rgba(0,0,0,0.25)]',
                  'transition-all duration-200',
                  'active:scale-[0.96]',
                  TOOLBAR_BUTTON_INTERACTIVE
                )}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
            {t('toolbar.help', { defaultValue: 'Help' })}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem
            onClick={startTour}
            className="gap-2 text-sm font-medium"
          >
            <Compass className="h-4 w-4" />
            {t('toolbar.takeATour', { defaultValue: 'Take a Tour' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

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
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

export function Toolbar() {
  const { connection } = useConnectionStore();
  const { hasChanges, changes } = useChangesStore();
  const { startTour } = useOnboardingStore();
  const openChangesPanel = useDialogStore((s) => s.openChangesPanel);
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle);
  const { agentSidebarOpen, toggleAgentSidebar } = useDialogStore();
  const { t } = useTranslation('common');

  if (!connection) return null;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1',
        'animate-fade-in-up opacity-0 [animation-delay:0.15s]'
      )}
      data-tour-target="toolbar"
    >
      {hasChanges() && (
        <button
          type="button"
          onClick={openChangesPanel}
          className={cn(
            'rounded-base flex shrink-0 items-center gap-2 px-3 py-1.5',
            'font-medium',
            'bg-warning/20 text-warning-foreground',
            'border-border border',
            'shadow-sm',
            'transition-all duration-150',
            'hover:bg-warning/25 active:scale-95'
          )}
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
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

      <div className="bg-border mx-1 h-4 w-px" />

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('toolbar.aiAgent', { defaultValue: 'AI Agent' })}
            onClick={() => toggleAgentSidebar(connection.id)}
            className={cn(
              'rounded-base h-7 w-7',
              'transition-all duration-150',
              agentSidebarOpen
                ? ['text-main bg-main/10', 'border-main/25 border']
                : [
                    'text-muted-foreground',
                    'border border-transparent',
                    'hover:text-foreground',
                    'hover:border-border/70',
                    'hover:bg-muted/60',
                  ],
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

      <div className="bg-border mx-1 h-4 w-px" />

      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCommandPalette}
            className={cn(
              'rounded-base h-7 gap-2 px-2.5',
              'font-medium',
              'text-muted-foreground hover:text-foreground',
              'hover:border-border/70 border border-transparent',
              'hover:bg-muted/60',
              'transition-all duration-150',
              TOOLBAR_BUTTON_INTERACTIVE
            )}
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
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
                aria-label={t('toolbar.help', { defaultValue: 'Help' })}
                className={cn(
                  'rounded-base h-7 w-7',
                  'text-muted-foreground hover:text-foreground',
                  'hover:border-border/70 border border-transparent',
                  'hover:bg-muted/60',
                  'transition-all duration-150',
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
            className="gap-2 font-medium"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            <Compass className="h-4 w-4" />
            {t('toolbar.takeATour', { defaultValue: 'Take a Tour' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Compass, FileText, HelpCircle } from 'lucide-react';
import { LayoutButtons } from '@/components/LayoutButtons';
import { ShortcutKbd } from '@/components/ui/kbd';
import {
  useChangesStore,
  useConnectionStore,
  useDialogStore,
  useOnboardingStore,
} from '@/stores';

/**
 * Simplified toolbar with only essential right-side controls.
 * Database-specific actions have been moved to ConnectionTabBar context menu.
 */
export function Toolbar() {
  const { connection } = useConnectionStore();
  const { hasChanges, changes } = useChangesStore();
  const { startTour } = useOnboardingStore();
  const openChangesPanel = useDialogStore((s) => s.openChangesPanel);

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
          className="flex shrink-0 items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-sm text-amber-600 transition-all duration-150 hover:scale-[1.02] hover:bg-amber-500/20 active:scale-[0.98] dark:text-amber-400"
        >
          <FileText className="h-4 w-4" />
          <span>
            {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
          </span>
        </button>
      )}

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
            className="text-muted-foreground h-7 gap-1.5 text-xs duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Commands</span>
            <ShortcutKbd action="action.command-palette" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open command palette</TooltipContent>
      </Tooltip>

      {/* Help Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Help</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={startTour}>
            <Compass className="h-4 w-4" />
            Take a Tour
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

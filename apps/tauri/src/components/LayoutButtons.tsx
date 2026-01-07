import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { LayoutGrid } from 'lucide-react';
import { ShortcutKbd } from '@/components/ui/kbd';
import { TOOLBAR_BUTTON_INTERACTIVE } from '@/lib/utils';
import { useSettingsStore } from '@/stores';
import { useSqlLogStore } from '@/stores/sql-log-store';

/**
 * VSCode-style layout toggle button with dropdown menu.
 * Provides quick access to toggle visibility of various UI panels.
 */
export function LayoutButtons() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    showSchemaDetails,
    toggleSchemaDetails,
  } = useSettingsStore();

  const { isVisible: sqlLogVisible, toggleVisible: toggleSqlLog } =
    useSqlLogStore();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className={TOOLBAR_BUTTON_INTERACTIVE}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Layout Options</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Panels</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={!sidebarCollapsed}
          onCheckedChange={() => toggleSidebar()}
        >
          <div className="flex items-center justify-between gap-4">
            <span>Sidebar</span>
            <ShortcutKbd action="nav.toggle-sidebar" className="ml-auto" />
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showSchemaDetails}
          onCheckedChange={() => toggleSchemaDetails()}
        >
          <div className="flex items-center justify-between gap-4">
            <span>Schema Details</span>
            <ShortcutKbd
              action="view.toggle-schema-details"
              className="ml-auto"
            />
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={sqlLogVisible}
          onCheckedChange={() => toggleSqlLog()}
        >
          <span>SQL Log</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

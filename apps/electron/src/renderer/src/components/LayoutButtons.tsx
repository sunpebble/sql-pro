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
import { LayoutGrid, PanelLeft, PanelRight, ScrollText } from 'lucide-react';
import { ShortcutKbd } from '@/components/ui/kbd';
import { useSettingsStore } from '@/stores';
import { useSqlLogStore } from '@/stores/sql-log-store';

/**
 * VSCode-style layout toggle buttons for sidebar, panels, etc.
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
    <div className="flex items-center">
      {/* Toggle Sidebar Button */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={sidebarCollapsed ? 'text-muted-foreground' : ''}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            <span>{sidebarCollapsed ? 'Show' : 'Hide'} Sidebar</span>
            <ShortcutKbd action="nav.toggle-sidebar" />
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Toggle Schema Details Panel Button */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSchemaDetails}
            className={!showSchemaDetails ? 'text-muted-foreground' : ''}
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex items-center gap-2">
            <span>{showSchemaDetails ? 'Hide' : 'Show'} Schema Details</span>
            <ShortcutKbd action="view.toggle-schema-details" />
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Toggle SQL Log Button */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSqlLog}
            className={!sqlLogVisible ? 'text-muted-foreground' : ''}
          >
            <ScrollText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{sqlLogVisible ? 'Hide' : 'Show'} SQL Log</span>
        </TooltipContent>
      </Tooltip>

      {/* Layout Presets Dropdown */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
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
    </div>
  );
}

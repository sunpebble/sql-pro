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
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { TOOLBAR_BUTTON_INTERACTIVE } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useSettingsStore } from '@/stores/settings-store';
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

  const { agentSidebarOpen, toggleAgentSidebar } = useDialogStore();
  const { activeConnectionId } = useConnectionStore();

  const { t } = useTranslation('common');

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
        <TooltipContent side="bottom">
          {t('toolbar.layoutOptions', { defaultValue: 'Layout Options' })}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          {t('toolbar.panels', { defaultValue: 'Panels' })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={!sidebarCollapsed}
          onCheckedChange={() => toggleSidebar()}
        >
          <div className="flex items-center justify-between gap-4">
            <span>{t('toolbar.sidebar', { defaultValue: 'Sidebar' })}</span>
            <ShortcutKbd action="nav.toggle-sidebar" className="ml-auto" />
          </div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showSchemaDetails}
          onCheckedChange={() => toggleSchemaDetails()}
        >
          <div className="flex items-center justify-between gap-4">
            <span>
              {t('toolbar.schemaDetails', { defaultValue: 'Schema Details' })}
            </span>
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
          <span>{t('toolbar.sqlLog', { defaultValue: 'SQL Log' })}</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={agentSidebarOpen}
          onCheckedChange={() =>
            toggleAgentSidebar(activeConnectionId || undefined)
          }
          disabled={!activeConnectionId}
        >
          <span>{t('toolbar.aiAgent', { defaultValue: 'AI Agent' })}</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

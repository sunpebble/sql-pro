import type { DataTab } from '@/stores/data-tabs-store';
import { Button } from '@sqlpro/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@sqlpro/ui/context-menu';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import { Eye, PanelRightClose, PanelRightOpen, Table, X } from 'lucide-react';
import { memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, TOOLTIP_CONTENT_FLEX, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';

/**
 * Hook for keyboard shortcuts to navigate between tabs
 * - Ctrl + Tab: Switch to next tab
 * - Ctrl + Shift + Tab: Switch to previous tab
 * - Cmd/Ctrl + 1-9: Switch to tab by index
 * - Cmd + Alt + T: Close other tabs
 * Note: Cmd + W is handled globally in useCommands.ts
 */
function useTabKeyboardNavigation(
  tabs: DataTab[],
  activeTabId: string | null,
  connectionId: string | null,
  setActiveTab: (connectionId: string, tabId: string) => void,
  closeOtherTabs: (connectionId: string, tabId: string) => void
) {
  useEffect(() => {
    if (!connectionId || tabs.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Tab / Ctrl + Shift + Tab: Navigate between tabs
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex === -1) return;

        let newIndex: number;
        if (e.shiftKey) {
          // Ctrl + Shift + Tab: Previous tab
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          // Ctrl + Tab: Next tab
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }

        setActiveTab(connectionId, tabs[newIndex].id);
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + Alt + T: Close other tabs
      // Use e.code because Alt+T produces special character on macOS
      if (
        isMod &&
        e.altKey &&
        e.code === 'KeyT' &&
        activeTabId &&
        tabs.length > 1
      ) {
        e.preventDefault();
        closeOtherTabs(connectionId, activeTabId);
        return;
      }

      // Cmd/Ctrl + 1-9: Switch to tab by index (but not when Ctrl is also pressed on Mac)
      // On Mac, Cmd+Ctrl+1-5 is used for view switching, so we need to exclude that
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isViewSwitchShortcut = isMac && e.metaKey && e.ctrlKey;
      if (
        isMod &&
        !e.altKey &&
        !e.shiftKey &&
        !isViewSwitchShortcut &&
        e.key >= '1' &&
        e.key <= '9'
      ) {
        const index = Number.parseInt(e.key, 10) - 1;
        if (index < tabs.length) {
          e.preventDefault();
          setActiveTab(connectionId, tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, connectionId, setActiveTab, closeOtherTabs]);
}

interface DataTabBarProps {
  className?: string;
  schemaDetailsOpen?: boolean;
  onToggleSchemaDetails?: () => void;
}

interface TabItemProps {
  tab: DataTab;
  index: number;
  isActive: boolean;
  connectionId: string;
  onSelect: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  tabsCount: number;
}

const TabItem = memo(
  ({
    tab,
    index,
    isActive,
    connectionId: _connectionId,
    onSelect,
    onClose,
    onCloseOthers,
    tabsCount,
  }: TabItemProps) => {
    const { t } = useTranslation('common');
    const handleCloseClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose();
      },
      [onClose]
    );

    const isView = tab.table.type === 'view';
    // Show shortcut hint for first 9 tabs
    const shortcutKey = index < 9 ? index + 1 : null;

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'group relative flex h-8 max-w-45 min-w-25 cursor-pointer items-center gap-1.5 px-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-foreground rounded-md'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md bg-transparent'
                  )}
                  onClick={onSelect}
                >
                  {isView ? (
                    <Eye className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  ) : (
                    <Table className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  )}
                  <span className="flex-1 truncate" title={tab.table.name}>
                    {tab.title}
                  </span>
                  {tab.table.schema && tab.table.schema !== 'main' && (
                    <span className="text-muted-foreground text-2xs shrink-0">
                      {tab.table.schema}
                    </span>
                  )}
                  <button
                    onClick={handleCloseClick}
                    className={cn(
                      'hover:bg-accent shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                      isActive && 'opacity-60'
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={TOOLTIP_CONTENT_FLEX}>
                {tab.table.name}
                {shortcutKey && (
                  <span className="text-muted-foreground ml-2">
                    ⌘{shortcutKey}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClose}>{t('tabs.close')}</ContextMenuItem>
          <ContextMenuItem onClick={onCloseOthers} disabled={tabsCount <= 1}>
            {t('tabs.closeOthers')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              // Copy table name to clipboard
              navigator.clipboard.writeText(tab.table.name);
            }}
          >
            {t('tabs.copyTableName')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

TabItem.displayName = 'DataTabItem';

export const DataTabBar = memo(
  ({
    className,
    schemaDetailsOpen,
    onToggleSchemaDetails,
  }: DataTabBarProps) => {
    const { t } = useTranslation('common');
    const { activeConnectionId } = useConnectionStore();
    const { tabsByConnection, closeTab, closeOtherTabs, setActiveTab } =
      useDataTabsStore();

    // Get tabs for current connection
    const connectionTabState = activeConnectionId
      ? tabsByConnection[activeConnectionId]
      : null;
    const tabs = connectionTabState?.tabs || [];
    const activeTabId = connectionTabState?.activeTabId || null;

    // Enable keyboard navigation between tabs
    useTabKeyboardNavigation(
      tabs,
      activeTabId,
      activeConnectionId,
      setActiveTab,
      closeOtherTabs
    );

    if (!activeConnectionId || tabs.length === 0) {
      return null;
    }

    return (
      <div
        className={cn(
          'bg-muted/20 border-border/50 flex h-8 shrink-0 items-center border-b',
          className
        )}
        role="tablist"
      >
        <ScrollArea orientation="horizontal" className="h-8 flex-1">
          <div className="flex h-8 items-center">
            {tabs.map((tab, index) => (
              <TabItem
                key={tab.id}
                tab={tab}
                index={index}
                isActive={tab.id === activeTabId}
                connectionId={activeConnectionId}
                onSelect={() => setActiveTab(activeConnectionId, tab.id)}
                onClose={() => closeTab(activeConnectionId, tab.id)}
                onCloseOthers={() => closeOtherTabs(activeConnectionId, tab.id)}
                tabsCount={tabs.length}
              />
            ))}
          </div>
        </ScrollArea>

        {onToggleSchemaDetails && (
          <div className="border-border/30 flex shrink-0 items-center gap-1 border-l px-2">
            <TooltipProvider delay={300}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6',
                      'transition-all duration-200',
                      schemaDetailsOpen
                        ? [
                            'text-primary',
                            'bg-primary/15',
                            'ring-primary/25 ring-1',
                          ]
                        : [
                            'text-muted-foreground hover:text-foreground',
                            'hover:bg-muted/50',
                          ]
                    )}
                    onClick={onToggleSchemaDetails}
                  >
                    {schemaDetailsOpen ? (
                      <PanelRightClose className="h-3.5 w-3.5" />
                    ) : (
                      <PanelRightOpen className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={TOOLTIP_CONTENT_STYLE}>
                  {schemaDetailsOpen
                    ? t('schemaDetails.hide', {
                        defaultValue: 'Hide Schema Details',
                      })
                    : t('schemaDetails.show', {
                        defaultValue: 'Show Schema Details',
                      })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    );
  }
);

DataTabBar.displayName = 'DataTabBar';

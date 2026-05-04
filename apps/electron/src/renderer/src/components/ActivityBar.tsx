import type { ShortcutAction } from '@/stores/keyboard-shortcuts-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  BarChart3,
  Code,
  GitCompare,
  GitFork,
  PanelLeft,
  PanelLeftClose,
  ScrollText,
  Search,
  Table,
} from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { cn, TOOLTIP_CONTENT_FLEX } from '@/lib/utils';
import { useSqlLogStore } from '@/stores/sql-log-store';

export type ViewType =
  | 'data'
  | 'query'
  | 'diagram'
  | 'compare'
  | 'vectorSearch'
  | 'dashboard';

interface ActivityBarItem {
  id: ViewType;
  icon: React.ElementType;
  labelKey: string;
  shortcutAction?: ShortcutAction;
  tourTarget: string;
  /** If true, this item requires special conditions to be visible */
  conditional?: boolean;
}

const ACTIVITY_BAR_ITEMS: ActivityBarItem[] = [
  {
    id: 'data',
    icon: Table,
    labelKey: 'navigation.dataBrowser',
    shortcutAction: 'nav.data-browser',
    tourTarget: 'data-browser-tab',
  },
  {
    id: 'query',
    icon: Code,
    labelKey: 'navigation.query',
    shortcutAction: 'nav.query-editor',
    tourTarget: 'query-editor-tab',
  },
  {
    id: 'diagram',
    icon: GitFork,
    labelKey: 'navigation.erDiagram',
    shortcutAction: 'nav.er-diagram',
    tourTarget: 'diagram-tab',
  },
  {
    id: 'compare',
    icon: GitCompare,
    labelKey: 'navigation.compare',
    shortcutAction: 'nav.schema-compare',
    tourTarget: 'compare-tab',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    labelKey: 'navigation.dashboard',
    shortcutAction: 'nav.dashboard',
    tourTarget: 'dashboard-tab',
  },
  {
    id: 'vectorSearch',
    icon: Search,
    labelKey: 'navigation.vectorSearch',
    tourTarget: 'vector-search-tab',
    conditional: true,
  },
];

interface ActivityBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  /** Optional badge counts for each view */
  badges?: Partial<Record<ViewType, number>>;
  /** Set of view IDs that should be visible (conditional items only shown if included) */
  visibleViews?: Set<ViewType>;
  /** Whether the sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Callback to toggle sidebar visibility */
  onToggleSidebar?: () => void;
}

export const ActivityBar = memo(
  ({
    activeView,
    onViewChange,
    badges,
    visibleViews,
    sidebarCollapsed,
    onToggleSidebar,
  }: ActivityBarProps) => {
    const { t } = useTranslation('common');
    const { isVisible: sqlLogVisible, toggleVisible: toggleSqlLog } =
      useSqlLogStore();

    const visibleItems = ACTIVITY_BAR_ITEMS.filter((item) => {
      if (!item.conditional) return true;
      return visibleViews?.has(item.id);
    });

    return (
      <div
        className={cn(
          'relative flex h-full w-11 shrink-0 flex-col py-2',
          'bg-sidebar/95 text-sidebar-foreground',
          'border-sidebar-border/70 border-r'
        )}
      >
        <div className="flex flex-1 flex-col items-center gap-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const badgeCount = badges?.[item.id];

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger>
                  <button
                    type="button"
                    data-tab={item.id}
                    data-active={isActive ? '' : undefined}
                    data-tour-target={item.tourTarget}
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'group rounded-base relative flex h-8 w-8 items-center justify-center',
                      'transition-all duration-150',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]'
                        : 'text-sidebar-foreground/[0.55] hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-all duration-150',
                        isActive ? 'opacity-95' : 'opacity-80'
                      )}
                    />

                    {isActive && (
                      <span className="bg-main absolute top-1/2 left-0.5 h-4 w-px -translate-y-1/2 rounded-full" />
                    )}

                    {badgeCount !== undefined && badgeCount > 0 && (
                      <span
                        className={cn(
                          'absolute -top-0.5 -right-0.5',
                          'flex h-3.5 min-w-3.5 items-center justify-center',
                          'rounded-base px-1',
                          'text-2xs font-semibold',
                          'bg-main text-main-foreground',
                          'border-sidebar-border border'
                        )}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className={TOOLTIP_CONTENT_FLEX}
                >
                  <span className="font-medium tracking-tight">
                    {t(item.labelKey)}
                  </span>
                  {item.shortcutAction && (
                    <ShortcutKbd action={item.shortcutAction} />
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-0.5 pb-1">
          <div className="bg-sidebar-border h-5 w-px" />

          {/* SQL Log Toggle */}
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={toggleSqlLog}
                className={cn(
                  'group rounded-base flex h-8 w-8 items-center justify-center',
                  'transition-all duration-150',
                  sqlLogVisible
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]'
                    : 'text-sidebar-foreground/[0.55] hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                )}
              >
                <ScrollText className="h-4 w-4 transition-transform duration-150" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={12}
              className={TOOLTIP_CONTENT_FLEX}
            >
              <span className="font-medium tracking-tight">
                {sqlLogVisible
                  ? t('toolbar.hideSqlLog', { defaultValue: 'Hide SQL Log' })
                  : t('toolbar.showSqlLog', { defaultValue: 'Show SQL Log' })}
              </span>
              <ShortcutKbd action="action.toggle-sql-log" />
            </TooltipContent>
          </Tooltip>

          {/* Sidebar Toggle */}
          {onToggleSidebar && (
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="group text-sidebar-foreground/[0.55] hover:bg-sidebar-accent/70 hover:text-sidebar-foreground rounded-base flex h-8 w-8 items-center justify-center transition-all duration-150"
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-4 w-4 transition-transform duration-150" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4 transition-transform duration-150" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className={TOOLTIP_CONTENT_FLEX}
              >
                <span className="font-medium tracking-tight">
                  {sidebarCollapsed
                    ? t('sidebar.show', { defaultValue: 'Show Sidebar' })
                    : t('sidebar.hide', { defaultValue: 'Hide Sidebar' })}
                </span>
                <ShortcutKbd action="nav.toggle-sidebar" />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }
);

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
          'relative flex h-full w-12 shrink-0 flex-col py-3',
          'bg-background',
          'border-border/30 border-r',
          'animate-slide-in-left opacity-0'
        )}
      >
        <div className="flex flex-1 flex-col items-center gap-1">
          {visibleItems.map((item, index) => {
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
                      'group relative flex h-9 w-9 items-center justify-center rounded-lg',
                      'transition-all duration-200 ease-out',
                      'animate-fade-in-up opacity-0',
                      index === 0 && 'stagger-1',
                      index === 1 && 'stagger-2',
                      index === 2 && 'stagger-3',
                      index === 3 && 'stagger-4',
                      index === 4 && 'stagger-5',
                      isActive
                        ? [
                            'text-primary',
                            'from-primary/20 via-primary/12 to-primary/5 bg-gradient-to-br',
                            'shadow-[0_2px_8px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
                            'dark:shadow-[0_2px_10px_rgba(52,211,153,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]',
                            'ring-primary/20 dark:ring-primary/25 ring-1',
                          ]
                        : [
                            'text-muted-foreground',
                            'hover:text-foreground',
                            'hover:from-muted/80 hover:to-muted/40 hover:bg-gradient-to-br',
                            'hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
                            'dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
                          ]
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] transition-all duration-200',
                        'group-hover:scale-110 group-active:scale-95',
                        isActive && [
                          'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]',
                          'dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]',
                        ]
                      )}
                    />

                    {isActive && (
                      <span
                        className={cn(
                          'absolute top-1/2 -left-px -translate-y-1/2',
                          'h-6 w-[3px] rounded-full',
                          'from-primary via-primary bg-gradient-to-b to-[var(--accent-cyan)]',
                          'shadow-[0_0_10px_rgba(16,185,129,0.6),0_0_20px_rgba(16,185,129,0.3)]',
                          'dark:shadow-[0_0_12px_rgba(52,211,153,0.7),0_0_24px_rgba(52,211,153,0.35)]',
                          'animate-scale-in'
                        )}
                      />
                    )}

                    {badgeCount !== undefined && badgeCount > 0 && (
                      <span
                        className={cn(
                          'absolute -top-1 -right-1',
                          'flex h-4 min-w-4 items-center justify-center',
                          'rounded-full px-1',
                          'text-[10px] font-semibold',
                          'bg-primary text-primary-foreground',
                          'shadow-[0_0_6px_rgba(16,185,129,0.4)]',
                          'border-background/50 border',
                          'animate-scale-in'
                        )}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}

                    <span
                      className={cn(
                        'absolute inset-0 rounded-lg',
                        'opacity-0 transition-all duration-200',
                        'ring-border/50 dark:ring-border/30 ring-1',
                        'group-hover:ring-primary/25 group-hover:opacity-100',
                        isActive && 'opacity-0'
                      )}
                    />
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

        <div className="flex flex-col items-center gap-1 pb-1">
          <div className="from-primary/30 via-border/40 h-10 w-px bg-gradient-to-b to-transparent" />

          {/* SQL Log Toggle */}
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={toggleSqlLog}
                className={cn(
                  'group flex h-9 w-9 items-center justify-center rounded-lg',
                  'transition-all duration-200 ease-out',
                  sqlLogVisible
                    ? [
                        'text-primary',
                        'from-primary/20 via-primary/12 to-primary/5 bg-gradient-to-br',
                        'shadow-[0_2px_8px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
                        'dark:shadow-[0_2px_10px_rgba(52,211,153,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]',
                        'ring-primary/20 dark:ring-primary/25 ring-1',
                      ]
                    : [
                        'text-muted-foreground hover:text-foreground',
                        'hover:from-muted/80 hover:to-muted/40 hover:bg-gradient-to-br',
                        'hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
                        'dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
                      ]
                )}
              >
                <ScrollText className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
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
                  className={cn(
                    'group flex h-9 w-9 items-center justify-center rounded-lg',
                    'transition-all duration-200 ease-out',
                    'text-muted-foreground hover:text-foreground',
                    'hover:from-muted/80 hover:to-muted/40 hover:bg-gradient-to-br',
                    'hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]',
                    'dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]'
                  )}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
                  ) : (
                    <PanelLeftClose className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
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

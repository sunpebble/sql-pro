import type { ShortcutAction } from '@/stores/keyboard-shortcuts-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Code, GitCompare, GitFork, Search, Table } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

export type ViewType =
  | 'data'
  | 'query'
  | 'diagram'
  | 'compare'
  | 'vectorSearch';

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
}

/**
 * Activity Bar for view navigation.
 * Provides a vertical icon bar on the left side for switching between views.
 * Enhanced with glass-gold effects and refined animations.
 */
export function ActivityBar({
  activeView,
  onViewChange,
  badges,
  visibleViews,
}: ActivityBarProps) {
  const { t } = useTranslation('common');

  // Filter items based on visibility settings
  const visibleItems = ACTIVITY_BAR_ITEMS.filter((item) => {
    // Non-conditional items are always visible
    if (!item.conditional) return true;
    // Conditional items only shown if explicitly included in visibleViews
    return visibleViews?.has(item.id);
  });

  return (
    <div className="glass-gold flex h-full w-14 shrink-0 flex-col py-2">
      {/* Navigation Items */}
      <div className="flex flex-1 flex-col items-center gap-1">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const badgeCount = badges?.[item.id];

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger>
                <button
                  data-tab={item.id}
                  data-active={isActive ? '' : undefined}
                  data-tour-target={item.tourTarget}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                    isActive
                      ? 'text-gold bg-gradient-to-br from-[rgba(212,175,55,0.25)] to-[rgba(201,169,98,0.15)] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'text-muted-foreground hover:text-gold hover:scale-110 hover:bg-[rgba(212,175,55,0.1)]'
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] transition-transform duration-200',
                      isActive && 'scale-110'
                    )}
                  />
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="bg-gold absolute top-1/2 -left-1 h-5 w-1 -translate-y-1/2 rounded-full" />
                  )}
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="bg-gold text-2xs absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-bold text-[#020202] shadow-lg">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="glass-gold border-gold/30 flex items-center gap-2"
              >
                <span className="font-medium">{t(item.labelKey)}</span>
                {item.shortcutAction && (
                  <ShortcutKbd action={item.shortcutAction} />
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

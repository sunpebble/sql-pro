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
 * VSCode-style Activity Bar for view navigation.
 * Provides a vertical icon bar on the left side for switching between views.
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
    <div className="bg-muted/30 flex h-full w-12 shrink-0 flex-col border-r">
      {visibleItems.map((item) => {
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
                  'relative flex h-11 w-full items-center justify-center transition-colors',
                  isActive
                    ? 'text-primary bg-background shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-2xs absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-medium">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{t(item.labelKey)}</span>
              {item.shortcutAction && (
                <ShortcutKbd action={item.shortcutAction} />
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

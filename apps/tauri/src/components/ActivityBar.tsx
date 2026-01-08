import type { ShortcutAction } from '@/stores/keyboard-shortcuts-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { ArrowLeftRight, Code, GitCompare, GitFork, Table } from 'lucide-react';
import { ShortcutKbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

export type ViewType = 'data' | 'query' | 'diagram' | 'compare' | 'dataDiff';

interface ActivityBarItem {
  id: ViewType;
  icon: React.ElementType;
  label: string;
  shortcutAction: ShortcutAction;
  tourTarget: string;
}

const ACTIVITY_BAR_ITEMS: ActivityBarItem[] = [
  {
    id: 'data',
    icon: Table,
    label: 'Data Browser',
    shortcutAction: 'nav.data-browser',
    tourTarget: 'data-browser-tab',
  },
  {
    id: 'query',
    icon: Code,
    label: 'SQL Query',
    shortcutAction: 'nav.query-editor',
    tourTarget: 'query-editor-tab',
  },
  {
    id: 'diagram',
    icon: GitFork,
    label: 'ER Diagram',
    shortcutAction: 'nav.er-diagram',
    tourTarget: 'diagram-tab',
  },
  {
    id: 'compare',
    icon: GitCompare,
    label: 'Schema Compare',
    shortcutAction: 'nav.schema-compare',
    tourTarget: 'schema-compare-tab',
  },
  {
    id: 'dataDiff',
    icon: ArrowLeftRight,
    label: 'Data Diff',
    shortcutAction: 'nav.data-diff',
    tourTarget: 'data-diff-tab',
  },
];

interface ActivityBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  /** Optional badge counts for each view */
  badges?: Partial<Record<ViewType, number>>;
}

/**
 * VSCode-style Activity Bar for view navigation.
 * Provides a vertical icon bar on the left side for switching between views.
 */
export function ActivityBar({
  activeView,
  onViewChange,
  badges,
}: ActivityBarProps) {
  return (
    <div className="bg-muted/30 flex h-full w-12 shrink-0 flex-col border-r">
      {ACTIVITY_BAR_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const badgeCount = badges?.[item.id];

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger>
              <button
                data-tab={item.id}
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
                  <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{item.label}</span>
              <ShortcutKbd action={item.shortcutAction} />
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

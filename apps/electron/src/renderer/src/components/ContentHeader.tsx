import type { ViewType } from './ActivityBar';
import { Button } from '@sqlpro/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  Code,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ContentHeaderProps {
  /** Current active view type */
  activeView: ViewType;
  /** Title to display */
  title: string;
  /** Subtitle (optional) */
  subtitle?: string;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Callback to toggle sidebar */
  onToggleSidebar?: () => void;
  /** Whether schema details panel is open */
  schemaDetailsOpen?: boolean;
  /** Callback to toggle schema details */
  onToggleSchemaDetails?: () => void;
  /** Whether to show schema details toggle (only for data view) */
  showSchemaDetailsToggle?: boolean;
  /** Sub-mode for query view: 'editor' or 'builder' */
  queryMode?: 'editor' | 'builder';
  /** Callback to change query mode */
  onQueryModeChange?: (mode: 'editor' | 'builder') => void;
  /** Additional actions to render on the right side */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Unified content header component for all views.
 * Provides consistent navigation, mode switching, and panel controls.
 */
export const ContentHeader = memo(
  ({
    activeView,
    title,
    subtitle,
    sidebarCollapsed,
    onToggleSidebar,
    schemaDetailsOpen,
    onToggleSchemaDetails,
    showSchemaDetailsToggle = false,
    queryMode,
    onQueryModeChange,
    actions,
    className,
  }: ContentHeaderProps) => {
    const { t } = useTranslation('common');

    return (
      <div
        className={cn(
          'border-border/50 bg-muted/20 flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3',
          className
        )}
      >
        {/* Left Section: Sidebar Toggle + Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Sidebar Toggle */}
          {onToggleSidebar && (
            <TooltipProvider delay={300}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                    onClick={onToggleSidebar}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {sidebarCollapsed
                    ? t('sidebar.show', { defaultValue: 'Show Sidebar' })
                    : t('sidebar.hide', { defaultValue: 'Hide Sidebar' })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground truncate text-sm font-medium">
                {title}
              </h2>
              {subtitle && (
                <span className="text-muted-foreground truncate text-xs">
                  / {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Mode Switcher (for Query View) */}
        {activeView === 'query' && queryMode && onQueryModeChange && (
          <div className="border-border/60 bg-muted/40 flex items-center gap-0.5 rounded-md border p-0.5">
            <button
              onClick={() => onQueryModeChange('editor')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
                queryMode === 'editor'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code className="h-3.5 w-3.5" />
              {t('queryView.sqlEditor', { defaultValue: 'SQL Editor' })}
            </button>
            <button
              onClick={() => onQueryModeChange('builder')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
                queryMode === 'builder'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Blocks className="h-3.5 w-3.5" />
              {t('queryView.queryBuilder', { defaultValue: 'Query Builder' })}
            </button>
          </div>
        )}

        {/* Right Section: Actions + Panel Toggles */}
        <div className="flex items-center gap-1">
          {/* Custom Actions */}
          {actions}

          {/* Schema Details Toggle (Data View only) */}
          {showSchemaDetailsToggle && onToggleSchemaDetails && (
            <TooltipProvider delay={300}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7',
                      schemaDetailsOpen
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={onToggleSchemaDetails}
                  >
                    {schemaDetailsOpen ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
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
          )}
        </div>
      </div>
    );
  }
);

import type { VectorSearchHistoryEntry } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, FileText, Hash, Target, Trash2, Type, X } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface VectorSearchHistoryProps {
  /** History entries to display */
  entries: VectorSearchHistoryEntry[];
  /** Callback when a history entry is clicked */
  onSelectEntry: (entry: VectorSearchHistoryEntry) => void;
  /** Callback when a history entry is deleted */
  onDeleteEntry: (id: string) => void;
  /** Callback to clear all history */
  onClearHistory: () => void;
  /** Optional class name for styling */
  className?: string;
}

const ModeIcon = memo(({ mode }: { mode: 'text' | 'vector' | 'similar' }) => {
  switch (mode) {
    case 'text':
      return <Type className="h-3.5 w-3.5" />;
    case 'vector':
      return <FileText className="h-3.5 w-3.5" />;
    case 'similar':
      return <Target className="h-3.5 w-3.5" />;
    default:
      return null;
  }
});

ModeIcon.displayName = 'ModeIcon';

/**
 * VectorSearchHistory component displays a list of recent search queries.
 */
export const VectorSearchHistory = memo(
  ({
    entries,
    onSelectEntry,
    onDeleteEntry,
    onClearHistory,
    className,
  }: VectorSearchHistoryProps) => {
    const { t, i18n } = useTranslation('common');

    const formatTime = useCallback(
      (timestamp: number) => {
        const locale = i18n.language.startsWith('zh') ? zhCN : undefined;
        return formatDistanceToNow(new Date(timestamp), {
          addSuffix: true,
          locale,
        });
      },
      [i18n.language]
    );

    if (entries.length === 0) {
      return (
        <div
          className={cn('text-muted-foreground py-8 text-center', className)}
        >
          <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
          <p style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
            {t('vectorSearch.history.empty', 'No search history yet')}
          </p>
        </div>
      );
    }

    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div
            className="text-muted-foreground flex items-center gap-2"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            <Clock className="h-4 w-4" />
            <span>{t('vectorSearch.history.title', 'Recent Searches')}</span>
            <span
              className="bg-muted rounded px-1.5 py-0.5"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {entries.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-muted-foreground hover:text-destructive h-7 px-2"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {t('vectorSearch.history.clear', 'Clear')}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group hover:bg-muted/50 flex cursor-pointer items-start gap-2 rounded-md p-2 transition-colors"
                onClick={() => onSelectEntry(entry)}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                        <ModeIcon mode={entry.mode} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      {entry.mode === 'text' &&
                        t('vectorSearch.modes.text', 'Text Search')}
                      {entry.mode === 'vector' &&
                        t('vectorSearch.modes.vector', 'Vector Search')}
                      {entry.mode === 'similar' &&
                        t('vectorSearch.modes.similar', 'Similar Search')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {entry.query}
                  </p>
                  <div
                    className="text-muted-foreground mt-0.5 flex items-center gap-2"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {entry.resultsCount}{' '}
                      {t('vectorSearch.history.results', 'results')}
                    </span>
                    {entry.topScore !== undefined && (
                      <span>
                        {t('vectorSearch.history.topScore', 'Top')}:{' '}
                        {entry.topScore.toFixed(3)}
                      </span>
                    )}
                    <span className="ml-auto">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry.id);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

VectorSearchHistory.displayName = 'VectorSearchHistory';

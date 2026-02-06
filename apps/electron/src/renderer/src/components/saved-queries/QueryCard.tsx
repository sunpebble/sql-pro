import type { SavedQuery } from '@shared/types/saved-query';

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import { Pencil, Play, Trash2, Variable } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { SqlHighlight } from '@/components/ui/sql-highlight';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import { parseParameters } from '@/stores/saved-queries-store';

interface QueryCardProps {
  query: SavedQuery;
  onSelect: () => void;
  onRun: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const QueryCard = memo(
  ({ query, onSelect, onRun, onEdit, onDelete }: QueryCardProps) => {
    const { t } = useTranslation('common');
    const hasParameters = parseParameters(query.query).length > 0;

    return (
      <div
        className={cn(
          'group hover:border-primary/50 hover:bg-accent/30 rounded-base border-border relative flex cursor-pointer flex-col gap-2.5 border-2 p-4 transition-all duration-200'
        )}
        onClick={onSelect}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate font-medium">{query.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {hasParameters && (
              <Badge
                variant="secondary"
                className="text-2xs shrink-0 font-medium"
              >
                <Variable className="mr-0.5 h-3 w-3" />
                {t('savedQueries.hasParams', { defaultValue: 'Params' })}
              </Badge>
            )}
            {query.executionCount > 0 && (
              <Badge
                variant="outline"
                className="text-2xs shrink-0 font-medium"
              >
                {query.executionCount}x
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {query.description && (
          <p
            className="text-muted-foreground line-clamp-2 leading-relaxed"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {query.description}
          </p>
        )}

        {/* Code Preview */}
        <SqlHighlight
          code={query.query}
          maxLines={3}
          className="bg-muted/50 rounded-base p-2.5"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        />

        {/* Actions - appear on hover */}
        <div className="bg-background rounded-base absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRun();
                  }}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('savedQueries.runQuery', { defaultValue: 'Run Query' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('savedQueries.editQuery', { defaultValue: 'Edit Query' })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('savedQueries.deleteQuery', {
                  defaultValue: 'Delete Query',
                })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }
);

QueryCard.displayName = 'QueryCard';

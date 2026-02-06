// SQLExplanationPopover Component
// Shows SQL explanation in a popover when user selects SQL

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { Loader2, Table2, X, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useQuickQuery } from '@/hooks/useQuickQuery';
import { cn } from '@/lib/utils';
import { useAIQueryStore } from '@/stores/ai-query-store';

interface SQLExplanationPopoverProps {
  className?: string;
}

const componentTypeColors: Record<string, string> = {
  select: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  from: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  join: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  where:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  group: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  order: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  limit: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function SQLExplanationPopover({
  className,
}: SQLExplanationPopoverProps) {
  const {
    isExplanationOpen,
    explanationAnchorRect,
    selectedSQL,
    explanation,
    closeExplanation,
  } = useAIQueryStore();

  const { isExplaining, explainSQL } = useQuickQuery();

  useEffect(() => {
    if (isExplanationOpen && selectedSQL && !explanation) {
      explainSQL(selectedSQL);
    }
  }, [isExplanationOpen, selectedSQL, explanation, explainSQL]);

  if (!isExplanationOpen) return null;

  const style = explanationAnchorRect
    ? {
        position: 'fixed' as const,
        top: explanationAnchorRect.bottom + 8,
        left: Math.max(
          16,
          Math.min(explanationAnchorRect.left, window.innerWidth - 400 - 16)
        ),
        zIndex: 50,
      }
    : { position: 'fixed' as const, top: 100, left: 100, zIndex: 50 };

  return (
    <div style={style} className={cn('z-50', className)}>
      <div className="bg-popover text-popover-foreground rounded-base border-border shadow-shadow w-[400px] border-2 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="flex items-center gap-2 font-semibold"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            <Zap className="text-primary h-4 w-4" />
            SQL Explanation
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={closeExplanation}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isExplaining ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <span
              className="text-muted-foreground ml-2"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              Analyzing SQL...
            </span>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            <p style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
              {explanation.summary}
            </p>

            {explanation.components.length > 0 && (
              <div className="space-y-2">
                <h5
                  className="text-muted-foreground font-medium uppercase"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  Query Components
                </h5>
                <div className="space-y-1.5">
                  {explanation.components.map((component) => (
                    <div
                      key={`${component.type}-${component.description}`}
                      className="flex items-start gap-2"
                    >
                      <Badge
                        className={cn(
                          'shrink-0 font-mono uppercase',
                          componentTypeColors[component.type] ||
                            componentTypeColors.other
                        )}
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {component.type}
                      </Badge>
                      <span style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                        {component.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {explanation.tables.length > 0 && (
              <div className="space-y-2">
                <h5
                  className="text-muted-foreground flex items-center gap-1 font-medium uppercase"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  <Table2 className="h-3 w-3" />
                  Tables Used
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {explanation.tables.map((table) => (
                    <Badge
                      key={`${table.name}-${table.role}`}
                      variant="secondary"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      <span className="font-mono">{table.name}</span>
                      <span className="text-muted-foreground ml-1">
                        ({table.role})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {explanation.performanceNotes && (
              <div className="space-y-1 border-t pt-2">
                <h5
                  className="text-muted-foreground font-medium uppercase"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  Performance Notes
                </h5>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {explanation.performanceNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p
            className="text-muted-foreground py-4 text-center"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            Select SQL to see explanation
          </p>
        )}
      </div>
    </div>
  );
}

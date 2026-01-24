import { Blocks, Code } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { QueryBuilder } from './query-builder';
import { QueryEditor } from './QueryEditor';

export function QueryView() {
  const { t } = useTranslation('common');
  const [mode, setMode] = useState<'editor' | 'builder'>('editor');

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'flex h-9 shrink-0 items-center justify-between gap-3 px-3',
          'border-border/30 border-b',
          'from-muted/30 via-background to-muted/30 bg-gradient-to-r'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-lg p-0.5',
            'border-border/40 border',
            'from-muted/50 via-muted/30 to-muted/50 bg-gradient-to-r',
            'shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]',
            'dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]',
            'backdrop-blur-sm'
          )}
        >
          <button
            type="button"
            onClick={() => setMode('editor')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5',
              'text-xs font-medium',
              'transition-all duration-200',
              mode === 'editor'
                ? [
                    'from-background via-background to-background/90 bg-gradient-to-br',
                    'text-foreground',
                    'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset]',
                    'dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.03)_inset]',
                    'ring-primary/20 ring-1',
                  ]
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Code className="h-3.5 w-3.5" />
            {t('queryView.sqlEditor', { defaultValue: 'SQL Editor' })}
          </button>
          <button
            type="button"
            onClick={() => setMode('builder')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5',
              'text-xs font-medium',
              'transition-all duration-200',
              mode === 'builder'
                ? [
                    'from-background via-background to-background/90 bg-gradient-to-br',
                    'text-foreground',
                    'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)_inset]',
                    'dark:shadow-[0_1px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.03)_inset]',
                    'ring-primary/20 ring-1',
                  ]
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <Blocks className="h-3.5 w-3.5" />
            {t('queryView.queryBuilder', { defaultValue: 'Query Builder' })}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {mode === 'editor' ? <QueryEditor /> : <QueryBuilder />}
      </div>
    </div>
  );
}

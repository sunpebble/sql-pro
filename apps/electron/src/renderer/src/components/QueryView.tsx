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
          'border-border border-b-2',
          'bg-muted'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-[5px] p-0.5',
            'border-border border-2',
            'bg-muted'
          )}
        >
          <button
            type="button"
            onClick={() => setMode('editor')}
            className={cn(
              'flex items-center gap-1.5 rounded-[5px] px-3 py-1.5',
              'font-bold',
              'transition-all duration-150',
              mode === 'editor'
                ? 'bg-background text-foreground border-border border-2'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent'
            )}
            style={{ fontSize: 'var(--font-ui-size, 14px)' }}
          >
            <Code className="h-3.5 w-3.5" />
            {t('queryView.sqlEditor', { defaultValue: 'SQL Editor' })}
          </button>
          <button
            type="button"
            onClick={() => setMode('builder')}
            className={cn(
              'flex items-center gap-1.5 rounded-[5px] px-3 py-1.5',
              'font-bold',
              'transition-all duration-150',
              mode === 'builder'
                ? 'bg-background text-foreground border-border border-2'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent'
            )}
            style={{ fontSize: 'var(--font-ui-size, 14px)' }}
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

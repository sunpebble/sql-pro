import { Blocks, Code } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { QueryBuilder } from './query-builder';
import { QueryEditor } from './QueryEditor';

type QueryViewMode = 'editor' | 'builder';

/**
 * Combined Query View component that includes SQL Query Editor and Query Builder
 * with internal tab switching.
 */
export function QueryView() {
  const { t } = useTranslation('common');
  const [activeMode, setActiveMode] = useState<QueryViewMode>('editor');

  return (
    <div className="flex h-full flex-col">
      {/* Mode Switcher */}
      <div className="bg-muted/30 flex shrink-0 items-center gap-1 border-b px-2 py-1">
        <button
          onClick={() => setActiveMode('editor')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeMode === 'editor'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Code className="h-4 w-4" />
          {t('queryView.sqlEditor')}
        </button>
        <button
          onClick={() => setActiveMode('builder')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            activeMode === 'builder'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Blocks className="h-4 w-4" />
          {t('queryView.queryBuilder')}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeMode === 'editor' ? <QueryEditor /> : <QueryBuilder />}
      </div>
    </div>
  );
}

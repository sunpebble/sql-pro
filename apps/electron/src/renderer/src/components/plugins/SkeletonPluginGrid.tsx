import * as React from 'react';
import { cn } from '@/lib/utils';
import { SkeletonCard, SkeletonCardList } from '../ui/skeleton-components';

interface SkeletonPluginGridProps {
  /** Number of skeleton cards to display */
  count?: number;
  /** Display mode: grid or list */
  viewMode?: 'grid' | 'list';
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for the plugin marketplace grid/list.
 * Displays animated skeleton cards that match the PluginCard layout.
 */
export function SkeletonPluginGrid({
  count = 6,
  viewMode = 'grid',
  className,
}: SkeletonPluginGridProps) {
  const items = React.useMemo(
    () => Array.from({ length: count }, (_, i) => i),
    [count]
  );

  if (viewMode === 'list') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {items.map((i) => (
          <SkeletonCardList
            key={`skeleton-plugin-list-${i}`}
            className="animate-in fade-in duration-300"
            style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {items.map((i) => (
        <SkeletonCard
          key={`skeleton-plugin-grid-${i}`}
          className="animate-in fade-in duration-300"
          style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

import { Skeleton } from '@sqlpro/ui/skeleton';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonMediaGridProps {
  /** Number of skeleton items to display */
  count?: number;
  /** Thumbnail size in pixels */
  size?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for the media gallery thumbnail grid.
 * Displays animated skeleton thumbnails that match the gallery layout.
 */
export function SkeletonMediaGrid({
  count = 12,
  size = 150,
  className,
}: SkeletonMediaGridProps) {
  const items = React.useMemo(
    () => Array.from({ length: count }, (_, i) => i),
    [count]
  );

  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-4',
        className
      )}
      data-slot="skeleton-media-grid"
      style={
        size !== 150
          ? { gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))` }
          : undefined
      }
    >
      {items.map((i) => (
        <Skeleton
          key={`skeleton-media-${i}`}
          className="aspect-square rounded-lg"
          style={{ animationDelay: `${i * 30}ms` }}
        />
      ))}
    </div>
  );
}

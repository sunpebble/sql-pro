import { Skeleton } from '@quarry/ui/skeleton';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton card for plugin marketplace, pro features, etc.
 * Matches the PluginCard grid layout structure.
 */
export function SkeletonCard({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('rounded-base border p-4', className)}
      data-slot="skeleton-card"
      style={style}
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 pb-2">
        <Skeleton className="rounded-base size-10 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5 py-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      {/* Footer with buttons */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton card for list layout (horizontal).
 * Matches the PluginCard list layout structure.
 */
export function SkeletonCardList({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'rounded-base flex flex-row items-center gap-4 border px-4 py-3',
        className
      )}
      data-slot="skeleton-card-list"
      style={style}
    >
      {/* Icon */}
      <Skeleton className="rounded-base size-10 shrink-0" />

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Action */}
      <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
    </div>
  );
}

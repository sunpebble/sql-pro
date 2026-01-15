import { Skeleton } from '@sqlpro/ui/skeleton';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton card for plugin marketplace, pro features, etc.
 * Matches the PluginCard grid layout structure.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-xl border p-4', className)}
      data-slot="skeleton-card"
    >
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 pb-2">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
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
export function SkeletonCardList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-row items-center gap-4 rounded-xl border px-4 py-3',
        className
      )}
      data-slot="skeleton-card-list"
    >
      {/* Icon */}
      <Skeleton className="size-10 shrink-0 rounded-lg" />

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

/**
 * Skeleton for form input fields.
 */
export function SkeletonInput({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)} data-slot="skeleton-input">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

/**
 * Skeleton for text lines with varying widths.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = React.useMemo(
    () =>
      Array.from({ length: lines }).map(
        () => `${Math.floor(Math.random() * 40) + 60}%`
      ),
    [lines]
  );

  return (
    <div className={cn('space-y-2', className)} data-slot="skeleton-text">
      {widths.map((width, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width, animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for license/pro info card.
 */
export function SkeletonLicenseInfo({ className }: { className?: string }) {
  return (
    <div
      className={cn('space-y-4 rounded-lg border p-4', className)}
      data-slot="skeleton-license-info"
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Input field */}
      <Skeleton className="h-9 w-full rounded-md" />

      {/* Feature list */}
      <div className="space-y-2 rounded-lg border p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-1"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="size-5 rounded-full" />
            <Skeleton
              className="h-4 flex-1"
              style={{ width: `${50 + Math.random() * 40}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

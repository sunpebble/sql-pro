import { Skeleton } from '@sqlpro/ui/skeleton';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProfileListProps {
  /** Number of skeleton items to display */
  count?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for the connection profile list.
 * Displays animated skeleton items that match the profile list layout.
 */
export function SkeletonProfileList({
  count = 6,
  className,
}: SkeletonProfileListProps) {
  const widths = React.useMemo(
    () =>
      Array.from(
        { length: count },
        () => `${Math.floor(Math.random() * 30) + 60}%`
      ),
    [count]
  );

  return (
    <div
      className={cn('space-y-4', className)}
      data-slot="skeleton-profile-list"
    >
      {/* Recent Connections Section */}
      <div>
        <Skeleton className="mb-2 h-3 w-32" />
        <div className="space-y-1">
          {widths.slice(0, Math.min(3, count)).map((width, i) => (
            <div
              key={`skeleton-recent-${i}`}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 flex-1" style={{ width }} />
            </div>
          ))}
        </div>
      </div>

      {/* Saved Profiles Section */}
      {count > 3 && (
        <div>
          <Skeleton className="mb-2 h-3 w-28" />
          <div className="space-y-1">
            {widths.slice(3).map((width, i) => (
              <div
                key={`skeleton-saved-${i}`}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5"
                style={{ animationDelay: `${(i + 3) * 50}ms` }}
              >
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 flex-1" style={{ width }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

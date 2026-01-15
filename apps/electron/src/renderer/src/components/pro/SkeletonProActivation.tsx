import { Skeleton } from '@sqlpro/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonProActivationProps {
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for the Pro activation dialog content.
 * Displays animated skeleton that matches the Pro activation layout.
 */
export function SkeletonProActivation({
  className,
}: SkeletonProActivationProps) {
  return (
    <div
      className={cn('grid gap-4 py-4', className)}
      data-slot="skeleton-pro-activation"
    >
      {/* Pro Status Section skeleton */}
      <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>

      {/* License Key Input skeleton */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Pro Features List skeleton */}
      <div className="grid gap-2">
        <Skeleton className="h-3 w-28" />
        <div className="bg-muted/50 space-y-1 rounded-lg border p-3">
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
    </div>
  );
}

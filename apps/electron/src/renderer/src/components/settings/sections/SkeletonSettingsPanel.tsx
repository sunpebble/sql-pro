import { Skeleton } from '@sqlpro/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonSettingsPanelProps {
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for the AI settings panel.
 * Displays animated skeleton that matches the settings layout.
 */
export function SkeletonSettingsPanel({
  className,
}: SkeletonSettingsPanelProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      data-slot="skeleton-settings-panel"
    >
      {/* Provider Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Provider Select */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        {/* Model Select */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </div>
        </div>

        {/* Claude Code Path */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="size-8 shrink-0 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

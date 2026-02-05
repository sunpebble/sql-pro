import { Skeleton } from '@sqlpro/ui/skeleton';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '../data-table/Animations';

interface SkeletonQueryResultsProps {
  /** Number of columns to display */
  columns?: number;
  /** Number of rows to display */
  rows?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Skeleton placeholder for query results.
 * Displays animated skeleton that matches the query results layout.
 */
export function SkeletonQueryResults({
  columns = 5,
  rows = 10,
  className,
}: SkeletonQueryResultsProps) {
  return (
    <div
      className={cn('flex h-full flex-col', className)}
      data-slot="skeleton-query-results"
    >
      {/* Results Header */}
      <div
        className="text-muted-foreground flex items-center gap-4 border-b-2 px-4 py-2"
        style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
      >
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-hidden">
        <SkeletonTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}

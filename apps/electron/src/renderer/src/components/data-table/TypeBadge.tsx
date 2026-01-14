import type { ColumnTypeCategory } from '@/lib/filter-utils';
import { Calendar, Database, Hash, HelpCircle, Type } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  typeCategory: ColumnTypeCategory;
  className?: string;
}

/**
 * Badge component that displays the column data type with an appropriate icon
 */
export const TypeBadge = memo(
  ({ type, typeCategory, className }: TypeBadgeProps) => {
    // Select icon based on type category
    const Icon = (() => {
      switch (typeCategory) {
        case 'numeric':
          return Hash;
        case 'date':
          return Calendar;
        case 'boolean':
          return Database;
        case 'text':
          return Type;
        case 'unknown':
        default:
          return HelpCircle;
      }
    })();

    // Select color based on type category using design tokens
    const colorClasses = (() => {
      switch (typeCategory) {
        case 'numeric':
          return 'bg-type-numeric-bg text-type-numeric';
        case 'date':
          return 'bg-type-date-bg text-type-date';
        case 'boolean':
          return 'bg-type-boolean-bg text-type-boolean';
        case 'text':
          return 'bg-type-text-bg text-type-text';
        case 'unknown':
        default:
          return 'bg-type-unknown-bg text-type-unknown';
      }
    })();

    return (
      <span
        className={cn(
          'text-2xs inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium uppercase',
          colorClasses,
          className
        )}
        title={`Data type: ${type}`}
      >
        <Icon className="h-2.5 w-2.5" />
        <span>{type}</span>
      </span>
    );
  }
);

TypeBadge.displayName = 'TypeBadge';

import type { ColumnTypeCategory } from '@/lib/filter-utils';
import { Calendar, Database, Hash, HelpCircle, Type } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  typeCategory: ColumnTypeCategory;
  className?: string;
}

// Icon and color per type category (module-level so React Compiler can prove
// the rendered component reference is static)
const CATEGORY_ICONS: Record<ColumnTypeCategory, typeof Hash> = {
  numeric: Hash,
  date: Calendar,
  boolean: Database,
  text: Type,
  unknown: HelpCircle,
};

const CATEGORY_COLORS: Record<ColumnTypeCategory, string> = {
  numeric: 'bg-type-numeric-bg text-type-numeric',
  date: 'bg-type-date-bg text-type-date',
  boolean: 'bg-type-boolean-bg text-type-boolean',
  text: 'bg-type-text-bg text-type-text',
  unknown: 'bg-type-unknown-bg text-type-unknown',
};

/**
 * Badge component that displays the column data type with an appropriate icon
 */
export const TypeBadge = memo(
  ({ type, typeCategory, className }: TypeBadgeProps) => {
    const { t } = useTranslation('common');
    const Icon = CATEGORY_ICONS[typeCategory] ?? HelpCircle;
    const colorClasses =
      CATEGORY_COLORS[typeCategory] ?? CATEGORY_COLORS.unknown;

    return (
      <span
        className={cn(
          'text-2xs inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium uppercase',
          colorClasses,
          className
        )}
        title={t('common.dataType', { type })}
      >
        <Icon className="h-2.5 w-2.5" />
        <span>{type}</span>
      </span>
    );
  }
);

TypeBadge.displayName = 'TypeBadge';

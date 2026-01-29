import type { TagDefinition } from '@shared/types/tag';
import { getContrastColor } from '@shared/types/tag';
import { Badge } from '@sqlpro/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColoredTagBadgeProps {
  tag: TagDefinition;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ColoredTagBadge({
  tag,
  onRemove,
  size = 'sm',
  className,
}: ColoredTagBadgeProps) {
  const textColor = getContrastColor(tag.color);

  return (
    <Badge
      className={cn(
        'gap-1 border-0 transition-opacity hover:opacity-90',
        size === 'sm' ? 'text-2xs h-4 px-1.5' : 'h-5 px-2 text-xs',
        className
      )}
      style={{
        backgroundColor: tag.color,
        color: textColor,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          aria-label={`Remove tag ${tag.name}`}
        >
          <X className={cn(size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        </button>
      )}
    </Badge>
  );
}

// Simple color dot for compact display
interface TagColorDotProps {
  color: string;
  className?: string;
}

export function TagColorDot({ color, className }: TagColorDotProps) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  );
}

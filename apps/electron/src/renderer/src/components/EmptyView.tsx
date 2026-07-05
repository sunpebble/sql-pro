import type { LucideIcon } from 'lucide-react';
import { Button } from '@quarry/ui/button';
// 直接导入优化 tree-shaking (vercel-react-best-practices: bundle-barrel-imports)
import { DecoFrame } from '@quarry/ui/decorations';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface EmptyViewProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Additional className */
  className?: string;
}

/**
 * Unified empty state component for all views.
 * Provides consistent styling with Data Sanctum design language.
 */
export const EmptyView = memo(
  ({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className,
  }: EmptyViewProps) => {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-1 items-center justify-center p-8',
          className
        )}
      >
        <div className="animate-fade-in-up flex max-w-md flex-col items-center text-center">
          {/* Decorated Icon */}
          <DecoFrame
            size="default"
            variant="gold"
            animated
            className="rounded-base mb-6 flex h-20 w-20 items-center justify-center"
          >
            <Icon className="text-primary h-10 w-10" />
          </DecoFrame>

          {/* Title */}
          <h3
            className="text-primary mb-2 font-semibold"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
          >
            {title}
          </h3>

          {/* Description */}
          <p
            className="text-muted-foreground mb-6 leading-relaxed"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {description}
          </p>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {action && (
                <Button onClick={action.onClick} className="gap-2">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  variant="outline"
                  onClick={secondaryAction.onClick}
                  className="gap-2"
                >
                  {secondaryAction.icon && (
                    <secondaryAction.icon className="h-4 w-4" />
                  )}
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

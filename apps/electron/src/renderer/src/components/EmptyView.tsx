import type { LucideIcon } from 'lucide-react';
import { DecoFrame, GoldButton } from '@sqlpro/ui';
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
          'bg-grid-dot flex h-full w-full flex-1 items-center justify-center p-8',
          className
        )}
      >
        <div className="animate-fade-in-up flex max-w-md flex-col items-center text-center">
          {/* Decorated Icon */}
          <DecoFrame
            size="default"
            variant="gold"
            animated
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          >
            <Icon className="text-primary h-10 w-10" />
          </DecoFrame>

          {/* Title */}
          <h3 className="text-primary mb-2 text-lg font-semibold">{title}</h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {action && (
                <GoldButton onClick={action.onClick} className="gap-2">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </GoldButton>
              )}
              {secondaryAction && (
                <GoldButton
                  variant="outline"
                  onClick={secondaryAction.onClick}
                  className="gap-2"
                >
                  {secondaryAction.icon && (
                    <secondaryAction.icon className="h-4 w-4" />
                  )}
                  {secondaryAction.label}
                </GoldButton>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

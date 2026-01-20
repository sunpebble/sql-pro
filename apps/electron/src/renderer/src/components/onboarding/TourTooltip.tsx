import type { TourStep, TourStepPlacement } from '@/types/onboarding';
import { Button } from '@sqlpro/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface TooltipPosition {
  top: number;
  left: number;
}

interface TourTooltipProps {
  /** The current tour step to display */
  step: TourStep;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether the tooltip is visible */
  isVisible: boolean;
  /** Callback when Next button is clicked */
  onNext: () => void;
  /** Callback when Previous button is clicked */
  onPrevious: () => void;
  /** Callback when Skip button is clicked */
  onSkip: () => void;
  /** Callback when user completes the tour (last step) */
  onComplete: () => void;
  /** Whether there is a next step */
  hasNext: boolean;
  /** Whether there is a previous step */
  hasPrevious: boolean;
}

/**
 * Viewport margin to keep tooltip inside the screen
 */
const VIEWPORT_MARGIN = 16;

/**
 * Top margin specifically for macOS traffic lights (window controls)
 * This ensures the tooltip doesn't overlap with the traffic lights area
 */
const TOP_MARGIN = 52;

/**
 * Tooltip offset from the target element
 */
const TOOLTIP_OFFSET = 16;

/**
 * Calculate the best position for the tooltip based on target element and placement
 */
function calculateTooltipPosition(
  targetRect: DOMRect | null,
  tooltipRect: DOMRect | null,
  placement: TourStepPlacement
): TooltipPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Center placement (used for welcome step with no target)
  if (placement === 'center' || !targetRect) {
    const tooltipWidth = tooltipRect?.width ?? 320;
    const tooltipHeight = tooltipRect?.height ?? 200;
    return {
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(
          viewportWidth - tooltipWidth - VIEWPORT_MARGIN,
          (viewportWidth - tooltipWidth) / 2
        )
      ),
      top: Math.max(
        TOP_MARGIN,
        Math.min(
          viewportHeight - tooltipHeight - VIEWPORT_MARGIN,
          (viewportHeight - tooltipHeight) / 2
        )
      ),
    };
  }

  const tooltipWidth = tooltipRect?.width ?? 320;
  const tooltipHeight = tooltipRect?.height ?? 200;

  let position: TooltipPosition = { top: 0, left: 0 };

  switch (placement) {
    case 'top':
      position = {
        top: targetRect.top - tooltipHeight - TOOLTIP_OFFSET,
        left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
      };
      break;
    case 'bottom':
      position = {
        top: targetRect.bottom + TOOLTIP_OFFSET,
        left: targetRect.left + (targetRect.width - tooltipWidth) / 2,
      };
      break;
    case 'left':
      position = {
        top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
        left: targetRect.left - tooltipWidth - TOOLTIP_OFFSET,
      };
      break;
    case 'right':
      position = {
        top: targetRect.top + (targetRect.height - tooltipHeight) / 2,
        left: targetRect.right + TOOLTIP_OFFSET,
      };
      break;
  }

  // Smart repositioning: adjust if tooltip would go outside viewport
  position = adjustForViewport(
    position,
    tooltipWidth,
    tooltipHeight,
    viewportWidth,
    viewportHeight
  );

  return position;
}

/**
 * Adjust position to ensure tooltip stays within viewport
 */
function adjustForViewport(
  position: TooltipPosition,
  tooltipWidth: number,
  tooltipHeight: number,
  viewportWidth: number,
  viewportHeight: number
): TooltipPosition {
  let { top, left } = position;

  // Horizontal adjustment
  if (left < VIEWPORT_MARGIN) {
    left = VIEWPORT_MARGIN;
  } else if (left + tooltipWidth > viewportWidth - VIEWPORT_MARGIN) {
    left = viewportWidth - tooltipWidth - VIEWPORT_MARGIN;
  }

  // Vertical adjustment - use TOP_MARGIN for top edge to avoid traffic lights
  if (top < TOP_MARGIN) {
    top = TOP_MARGIN;
  } else if (top + tooltipHeight > viewportHeight - VIEWPORT_MARGIN) {
    top = viewportHeight - tooltipHeight - VIEWPORT_MARGIN;
  }

  return { top, left };
}

/**
 * Internal state for tooltip position including positioned flag
 */
interface TooltipState {
  position: TooltipPosition;
  isPositioned: boolean;
}

/**
 * TourTooltip component for displaying tour step content.
 * Positions itself relative to highlighted elements with smart viewport awareness.
 */
export function TourTooltip({
  step,
  currentStepIndex,
  totalSteps,
  isVisible,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  hasNext,
  hasPrevious,
}: TourTooltipProps) {
  const { t } = useTranslation('common');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    position: { top: 0, left: 0 },
    isPositioned: false,
  });

  /**
   * Update tooltip position based on target element
   */
  const updatePosition = useCallback(() => {
    if (!tooltipRef.current) {
      setTooltipState((prev) => ({ ...prev, isPositioned: false }));
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let targetRect: DOMRect | null = null;

    // Find target element if not center/body
    if (step.target !== 'body' && step.placement !== 'center') {
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetRect = targetElement.getBoundingClientRect();
      }
    }

    const newPosition = calculateTooltipPosition(
      targetRect,
      tooltipRect,
      step.placement
    );

    setTooltipState({
      position: newPosition,
      isPositioned: true,
    });
  }, [step.target, step.placement]);

  /**
   * Update position when step changes or on mount
   * Reset positioned state on cleanup to ensure fade-in on next show
   */
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    // Reset positioned state initially for fade-in effect
    // This is an intentional animation pattern: reset on step change, then update
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional animation setup
    setTooltipState((prev) => ({ ...prev, isPositioned: false }));

    // Use requestAnimationFrame to ensure DOM has updated
    const frameId = requestAnimationFrame(() => {
      updatePosition();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isVisible, step.id, updatePosition]);

  /**
   * Update position on resize and scroll
   */
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
    };
  }, [isVisible, updatePosition]);

  /**
   * Generate stable keys for progress dots
   */
  const progressDotKeys = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => `step-dot-${i}`),
    [totalSteps]
  );

  if (!isVisible) {
    return null;
  }

  const isLastStep = !hasNext;
  const stepNumber = currentStepIndex + 1;
  const { position, isPositioned } = tooltipState;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[10000] w-80 max-w-[calc(100vw-32px)]',
        'bg-popover text-popover-foreground',
        'ring-foreground/10 rounded-lg shadow-lg ring-1',
        'transition-all duration-300 ease-out',
        isPositioned ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-tooltip-title"
      aria-describedby="tour-tooltip-description"
    >
      {/* Header with step indicator and close button */}
      <div className="border-border/50 flex items-center justify-between border-b px-4 py-3">
        <span className="text-muted-foreground text-xs font-medium">
          {t('tour.step', { current: stepNumber, total: totalSteps })}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground -mr-1"
          aria-label={t('tour.skip')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h3
          id="tour-tooltip-title"
          className="text-foreground text-base font-semibold"
        >
          {t(step.title)}
        </h3>
        <p
          id="tour-tooltip-description"
          className="text-muted-foreground mt-2 text-sm leading-relaxed"
        >
          {t(step.description)}
        </p>
      </div>

      {/* Footer with navigation */}
      <div className="border-border/50 flex items-center justify-between border-t px-4 py-3">
        <div className="flex items-center gap-2">
          {hasPrevious && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t('tour.previous')}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              {t('tour.skip')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={isLastStep ? onComplete : onNext}
            className="border-gold bg-gold/15 text-gold hover:bg-gold/25 gap-1"
          >
            {isLastStep ? (
              <span>{t('tour.finish')}</span>
            ) : (
              <>
                <span>{t('tour.next')}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pb-3">
        {progressDotKeys.map((key, index) => (
          <div
            key={key}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-all duration-200',
              index === currentStepIndex
                ? 'bg-gold w-4'
                : index < currentStepIndex
                  ? 'bg-gold/50'
                  : 'bg-muted-foreground/30'
            )}
            role="presentation"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export type { TourTooltipProps };

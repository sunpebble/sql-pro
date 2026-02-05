import type { WelcomeTourStep } from '@/lib/welcome-tour-steps';
import { Button } from '@sqlpro/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  getWelcomeTourStepByIndex,
  hasNextWelcomeStep,
  hasPreviousWelcomeStep,
  WELCOME_TOUR_STEPS,
  WELCOME_TOUR_TOTAL_STEPS,
} from '@/lib/welcome-tour-steps';

interface TooltipPosition {
  top: number;
  left: number;
}

interface WelcomeTourProps {
  /** Whether the tour is visible */
  isVisible: boolean;
  /** Callback when user completes the tour */
  onComplete: () => void;
  /** Callback when user skips the tour */
  onSkip: () => void;
}

/**
 * Viewport margin to keep tooltip inside the screen
 */
const VIEWPORT_MARGIN = 16;

/**
 * Tooltip offset from the target element
 */
const TOOLTIP_OFFSET = 16;

/**
 * WelcomeTour component for the welcome screen.
 * Guides users through the main UI elements before connecting to a database.
 */
export function WelcomeTour({
  isVisible,
  onComplete,
  onSkip,
}: WelcomeTourProps) {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
  });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = useMemo(
    () => getWelcomeTourStepByIndex(currentStep),
    [currentStep]
  );
  const hasNext = useMemo(() => hasNextWelcomeStep(currentStep), [currentStep]);
  const hasPrevious = useMemo(
    () => hasPreviousWelcomeStep(currentStep),
    [currentStep]
  );

  /**
   * Calculate tooltip position based on target element and placement
   */
  const calculatePosition = useCallback(
    (
      targetRect: DOMRect | null,
      tooltipRect: DOMRect | null,
      placement: WelcomeTourStep['placement']
    ): TooltipPosition => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const tooltipWidth = tooltipRect?.width ?? 320;
      const tooltipHeight = tooltipRect?.height ?? 200;

      if (!targetRect) {
        return {
          left: (viewportWidth - tooltipWidth) / 2,
          top: (viewportHeight - tooltipHeight) / 2,
        };
      }

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

      // Adjust for viewport bounds
      position.left = Math.max(
        VIEWPORT_MARGIN,
        Math.min(viewportWidth - tooltipWidth - VIEWPORT_MARGIN, position.left)
      );
      position.top = Math.max(
        VIEWPORT_MARGIN,
        Math.min(viewportHeight - tooltipHeight - VIEWPORT_MARGIN, position.top)
      );

      return position;
    },
    []
  );

  /**
   * Update tooltip position
   */
  const updatePosition = useCallback(() => {
    if (!tooltipRef.current || !step) {
      setIsPositioned(false);
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const targetElement = document.querySelector(step.target);
    const targetRect = targetElement?.getBoundingClientRect() ?? null;

    const position = calculatePosition(targetRect, tooltipRect, step.placement);
    setTooltipPosition(position);
    setIsPositioned(true);
  }, [step, calculatePosition]);

  // Update position when step changes or on resize
  useEffect(() => {
    if (!isVisible) return;

    // Initial position update
    const frameId = requestAnimationFrame(() => {
      updatePosition();
    });

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, currentStep, updatePosition]);

  // Reset step when tour becomes visible
  useEffect(() => {
    if (isVisible) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Reset state on visibility change
      setCurrentStep(0);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Reset state on visibility change
      setIsPositioned(false);
    }
  }, [isVisible]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (hasNext) {
            setCurrentStep((prev) => prev + 1);
          } else {
            onComplete();
          }
          break;
        case 'ArrowLeft':
          if (hasPrevious) {
            setCurrentStep((prev) => prev - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, hasNext, hasPrevious, onSkip, onComplete]);

  if (!isVisible || !step) return null;

  const stepTitle = t(`welcomeTour.steps.${step.translationKey}.title`);
  const stepDescription = t(
    `welcomeTour.steps.${step.translationKey}.description`
  );

  return (
    <>
      {/* Spotlight overlay with cutout for current target */}
      <SpotlightHighlight
        targetSelector={step.target}
        onOverlayClick={onSkip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'bg-card rounded-base border-border shadow-shadow fixed z-[10000] w-[320px] border-2 p-4',
          'transition-all duration-300',
          isPositioned ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-tour-title"
        aria-describedby="welcome-tour-description"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3
            id="welcome-tour-title"
            className="text-foreground text-base font-semibold"
          >
            {stepTitle}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onSkip}
            aria-label={t('welcomeTour.closeTour')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p
          id="welcome-tour-description"
          className="text-muted-foreground mb-4"
          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
        >
          {stepDescription}
        </p>

        {/* Progress indicator */}
        <div className="mb-3 flex gap-1">
          {WELCOME_TOUR_STEPS.map((stepItem, index) => (
            <div
              key={stepItem.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <span
            className="text-muted-foreground"
            style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
          >
            {currentStep + 1} / {WELCOME_TOUR_TOTAL_STEPS}
          </span>

          <div className="flex gap-2">
            {hasPrevious && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t('welcomeTour.back')}
              </Button>
            )}

            {hasNext ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                {t('welcomeTour.next')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={onComplete}>
                {t('welcomeTour.done')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Spotlight highlight component to highlight the target element
 * Uses SVG mask to create a true cutout effect
 */
function SpotlightHighlight({
  targetSelector,
  onOverlayClick,
}: {
  targetSelector: string;
  onOverlayClick?: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const maskIdRef = useRef(
    `welcome-spotlight-mask-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Initial DOM measurement
      setRect(targetElement.getBoundingClientRect());
    }

    const handleResize = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetSelector]);

  if (!rect) return null;

  const padding = 8;
  const borderRadius = 8;

  const spotlightRect = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  return (
    <>
      {/* SVG overlay with spotlight cutout */}
      <svg
        className="fixed inset-0 z-[9998] h-full w-full"
        onClick={onOverlayClick}
        aria-hidden="true"
      >
        <defs>
          <mask id={maskIdRef.current}>
            {/* White background = visible overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle = transparent cutout */}
            <rect
              x={spotlightRect.left}
              y={spotlightRect.top}
              width={spotlightRect.width}
              height={spotlightRect.height}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        {/* Overlay rectangle with mask applied */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.85)"
          mask={`url(#${maskIdRef.current})`}
          style={{ cursor: 'pointer' }}
        />
      </svg>

      {/* Spotlight ring/border highlight */}
      <div
        className="pointer-events-none fixed z-[9999] border-2 border-white/80"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius,
          boxShadow:
            '0 0 0 4px rgba(255, 255, 255, 0.15), 0 0 40px 12px rgba(255, 255, 255, 0.2), inset 0 0 20px 4px rgba(255, 255, 255, 0.05)',
        }}
      />
    </>
  );
}

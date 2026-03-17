/* eslint-disable react-refresh/only-export-components -- Hook and types are intentionally co-located with component */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourSpotlightProps {
  /** CSS selector for the target element to highlight */
  targetSelector: string;
  /** Whether spotlight mode is enabled (dims background) */
  isActive: boolean;
  /** Padding around the spotlight area in pixels */
  padding?: number;
  /** Border radius of the spotlight area in pixels */
  borderRadius?: number;
  /** Callback when user clicks the overlay (outside spotlight) */
  onOverlayClick?: () => void;
  /** Children to render inside the overlay (e.g., tooltip) */
  children?: React.ReactNode;
}

/**
 * TourSpotlight component for highlighting UI elements during onboarding.
 * Creates an overlay that dims the entire screen except for the target element.
 * Supports smooth animations between steps.
 */
export function TourSpotlight({
  targetSelector,
  isActive,
  padding = 8,
  borderRadius = 8,
  onOverlayClick,
  children,
}: TourSpotlightProps) {
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const maskIdRef = useRef(
    `tour-spotlight-mask-${Math.random().toString(36).slice(2)}`
  );

  /**
   * Find and measure the target element
   */
  const updateSpotlightPosition = useCallback(() => {
    if (!targetSelector || !isActive) {
      setSpotlightRect(null);
      return;
    }

    // Handle special case for 'body' (full screen, no spotlight)
    if (targetSelector === 'body') {
      setSpotlightRect(null);
      return;
    }

    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      setSpotlightRect(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [targetSelector, isActive, padding]);

  /**
   * Update spotlight position on mount and when target changes
   */
  useEffect(() => {
    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (isActive) {
      // Trigger animation
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsAnimating(true);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsVisible(true);

      // Use requestAnimationFrame to ensure DOM has updated
      const frameId = requestAnimationFrame(() => {
        updateSpotlightPosition();
        // End animation after position update
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      });

      return () => {
        cancelAnimationFrame(frameId);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    } else {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsVisible(false);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSpotlightRect(null);
      return undefined;
    }
  }, [isActive, targetSelector, updateSpotlightPosition]);

  /**
   * Update spotlight position on window resize and scroll
   */
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => {
      updateSpotlightPosition();
    };

    // Throttle scroll/resize updates for performance
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledUpdate = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        updateSpotlightPosition();
        throttleTimeout = null;
      }, 50);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', throttledUpdate, {
      capture: true,
      passive: true,
    });

    // Also observe DOM changes that might affect element position
    const observer = new MutationObserver(throttledUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', throttledUpdate, { capture: true });
      observer.disconnect();
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isActive, updateSpotlightPosition]);

  /**
   * Handle overlay click (clicking outside the spotlight)
   */
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      // Only trigger if clicking the overlay, not children
      if (event.target === event.currentTarget) {
        onOverlayClick?.();
      }
    },
    [onOverlayClick]
  );

  if (!isVisible) {
    if (!isActive && children) {
      return <>{children}</>;
    }
    return null;
  }

  // Render the overlay using SVG for the spotlight cutout effect
  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] overflow-hidden',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-0' : 'opacity-100'
      )}
      onClick={handleOverlayClick}
      role="presentation"
      aria-hidden="true"
    >
      {/* SVG overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id={maskIdRef.current}>
            {/* White background = visible overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle = transparent cutout */}
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={borderRadius}
                ry={borderRadius}
                fill="black"
                className="transition-all duration-300 ease-out"
              />
            )}
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
          style={{ pointerEvents: 'auto' }}
        />
      </svg>

      {/* Spotlight ring/border highlight */}
      {spotlightRect && (
        <div
          className={cn(
            'pointer-events-none absolute',
            'border border-white/80',
            'transition-all duration-300 ease-out'
          )}
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
      )}

      {/* Children (e.g., tooltip) rendered above the overlay */}
      {children}
    </div>
  );
}

/**
 * Hook to get the current position of a tour target element
 */
export function useTourTargetPosition(
  targetSelector: string,
  isActive: boolean
): SpotlightRect | null {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!isActive || !targetSelector || targetSelector === 'body') {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const boundingRect = element.getBoundingClientRect();
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRect({
          top: boundingRect.top,
          left: boundingRect.left,
          width: boundingRect.width,
          height: boundingRect.height,
        });
      } else {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRect(null);
      }
    };

    updatePosition();

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [targetSelector, isActive]);

  return rect;
}

export type { SpotlightRect, TourSpotlightProps };

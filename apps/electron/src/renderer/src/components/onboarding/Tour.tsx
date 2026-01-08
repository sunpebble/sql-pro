import type { TourStepAction } from '@/types/onboarding';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTourStepByIndex,
  hasNextStep,
  hasPreviousStep,
  TOUR_CONFIG,
} from '../../lib/tour-steps';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { TourSpotlight } from './TourSpotlight';
import { TourTooltip } from './TourTooltip';

/**
 * Callback type for tab switching action.
 * The Tour component will call this when a step requires switching to a different tab.
 */
export type TabSwitchCallback = (
  tab: 'browser' | 'query' | 'diagram' | 'compare' | 'dataDiff'
) => void;

interface TourProps {
  /**
   * Callback to switch the main view tab.
   * If not provided, switch-tab actions will be skipped.
   */
  onSwitchTab?: TabSwitchCallback;
}

/**
 * Main Tour component that orchestrates the onboarding tour experience.
 * Coordinates TourSpotlight and TourTooltip, handles step transitions,
 * executes step actions, and manages keyboard navigation.
 *
 * This component is rendered inside DatabaseView after user connects to a database.
 */
export function Tour({ onSwitchTab }: TourProps) {
  const {
    isTourVisible,
    currentStep,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
  } = useOnboardingStore();

  // Track if we're waiting for a target element to appear
  const [isWaitingForTarget, setIsWaitingForTarget] = useState(false);

  // Track if target element was found
  const [targetFound, setTargetFound] = useState(true);

  // Track if step action has been executed
  const lastExecutedStepRef = useRef<number>(-1);

  // Get current tour step
  const step = getTourStepByIndex(currentStep);

  // Navigation state
  const hasNext = hasNextStep(currentStep);
  const hasPrev = hasPreviousStep(currentStep);

  /**
   * Execute step action (like switching tabs)
   */
  const executeStepAction = useCallback(
    async (action: TourStepAction | undefined) => {
      if (!action) return;

      switch (action.type) {
        case 'switch-tab':
          if (onSwitchTab) {
            onSwitchTab(action.tab);
          }
          break;
        case 'open-command-palette':
          // Trigger command palette via keyboard shortcut simulation
          // This will be handled by the global shortcut handler
          document.dispatchEvent(
            new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            })
          );
          break;
        case 'wait':
          await new Promise((resolve) => setTimeout(resolve, action.duration));
          break;
      }
    },
    [onSwitchTab]
  );

  /**
   * Wait for target element to become visible
   */
  const waitForTargetElement = useCallback(
    (selector: string, timeout = 1000): Promise<boolean> => {
      return new Promise((resolve) => {
        // Check immediately
        const element = document.querySelector(selector);
        if (element) {
          resolve(true);
          return;
        }

        // Set up observer
        const observer = new MutationObserver(() => {
          const el = document.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(true);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        // Timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(false);
        }, timeout);
      });
    },
    []
  );

  /**
   * Execute step action and wait for target when step changes
   */
  useEffect(() => {
    if (!isTourVisible || !step) return;

    // Only execute if we haven't executed for this step yet
    if (lastExecutedStepRef.current === currentStep) return;

    const setupStep = async () => {
      // Mark as executed to prevent re-runs
      lastExecutedStepRef.current = currentStep;

      // Reset target found state
      setTargetFound(true);

      // Execute step action first (e.g., switch tab)
      if (step.action) {
        await executeStepAction(step.action);
      }

      // Wait for target if required
      if (step.waitForTarget && step.target !== 'body') {
        setIsWaitingForTarget(true);
        const found = await waitForTargetElement(step.target);
        setTargetFound(found);
        setIsWaitingForTarget(false);
      } else if (step.target !== 'body') {
        // Check if target exists immediately for non-waiting steps
        const targetExists = !!document.querySelector(step.target);
        setTargetFound(targetExists);
      }
    };

    setupStep();
  }, [
    isTourVisible,
    currentStep,
    step,
    executeStepAction,
    waitForTargetElement,
  ]);

  /**
   * Reset last executed step when tour becomes invisible
   */
  useEffect(() => {
    if (!isTourVisible) {
      lastExecutedStepRef.current = -1;
    }
  }, [isTourVisible]);

  /**
   * Handle next step navigation
   */
  const handleNext = useCallback(() => {
    if (hasNext) {
      nextStep();
    }
  }, [hasNext, nextStep]);

  /**
   * Handle previous step navigation
   */
  const handlePrevious = useCallback(() => {
    if (hasPrev) {
      previousStep();
    }
  }, [hasPrev, previousStep]);

  /**
   * Handle skip tour
   */
  const handleSkip = useCallback(() => {
    skipTour();
  }, [skipTour]);

  /**
   * Handle tour completion (on last step)
   */
  const handleComplete = useCallback(() => {
    completeTour();
  }, [completeTour]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!isTourVisible || !step) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          handleSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          if (hasNext) {
            handleNext();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          if (hasPrev) {
            handlePrevious();
          }
          break;
        case 'Tab':
          // Prevent tab navigation while tour is active
          event.preventDefault();
          event.stopPropagation();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [
    isTourVisible,
    step,
    hasNext,
    hasPrev,
    handleNext,
    handlePrevious,
    handleSkip,
  ]);

  // Don't render if tour is not visible or no step
  if (!isTourVisible || !step) {
    return null;
  }

  // Show loading overlay while waiting for target element
  if (isWaitingForTarget) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/40 transition-opacity duration-300" />
    );
  }

  // Disable spotlight when target is not found - tooltip will be centered
  const spotlightActive = step.spotlightMode && targetFound;

  return (
    <TourSpotlight
      targetSelector={step.target}
      isActive={spotlightActive}
      onOverlayClick={handleSkip}
    >
      <TourTooltip
        step={step}
        currentStepIndex={currentStep}
        totalSteps={TOUR_CONFIG.totalSteps}
        isVisible={true}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        onComplete={handleComplete}
        hasNext={hasNext}
        hasPrevious={hasPrev}
      />
    </TourSpotlight>
  );
}

export type { TourProps };

/**
 * Tour step placement relative to the target element
 */
export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

/**
 * Action to perform before showing a tour step
 */
export type TourStepAction =
  | {
      type: 'switch-tab';
      tab: 'browser' | 'query' | 'diagram' | 'compare' | 'dataDiff';
    }
  | {
      type: 'open-command-palette';
    }
  | {
      type: 'wait';
      duration: number;
    };

/**
 * Configuration for a single tour step
 */
export interface TourStep {
  /** Unique identifier for the step */
  id: string;

  /** CSS selector or data-tour-target value to highlight */
  target: string;

  /** Step title displayed in the tooltip */
  title: string;

  /** Step description/content displayed in the tooltip */
  description: string;

  /** Where to position the tooltip relative to the target element */
  placement: TourStepPlacement;

  /** Whether to use spotlight mode (dim everything except target) */
  spotlightMode: boolean;

  /** Optional action to perform before showing this step */
  action?: TourStepAction;

  /** Whether this step should wait for the target to be visible before proceeding */
  waitForTarget?: boolean;
}

/**
 * Complete tour configuration
 */
export interface TourConfig {
  /** All tour steps in order */
  steps: TourStep[];

  /** Total number of steps */
  totalSteps: number;
}

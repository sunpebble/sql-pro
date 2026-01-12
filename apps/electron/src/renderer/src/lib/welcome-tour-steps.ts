/**
 * Welcome tour step placement type
 */
export type WelcomeTourPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Welcome tour step configuration
 */
export interface WelcomeTourStep {
  id: string;
  target: string;
  /** Translation key for the step (e.g., 'features' -> 'welcomeTour.steps.features') */
  translationKey: string;
  placement: WelcomeTourPlacement;
}

/**
 * Welcome tour steps configuration for the WelcomeScreen.
 * Introduces users to the main UI elements before connecting to a database.
 * Title and description are stored in translation files under 'welcomeTour.steps.[translationKey]'
 */
export const WELCOME_TOUR_STEPS: WelcomeTourStep[] = [
  {
    id: 'welcome-features',
    target: '[data-tour-target="feature-showcase"]',
    translationKey: 'features',
    placement: 'right',
  },
  {
    id: 'welcome-open-database',
    target: '[data-action="open-database"]',
    translationKey: 'openDatabase',
    placement: 'left',
  },
  {
    id: 'welcome-server-connection',
    target: '[data-action="connect-server"]',
    translationKey: 'serverConnection',
    placement: 'left',
  },
  {
    id: 'welcome-profiles',
    target: '[data-tour-target="profiles-button"]',
    translationKey: 'profiles',
    placement: 'bottom',
  },
  {
    id: 'welcome-recent',
    target: '[data-tour-target="recent-connections"]',
    translationKey: 'recent',
    placement: 'left',
  },
];

/**
 * Get total number of welcome tour steps
 */
export const WELCOME_TOUR_TOTAL_STEPS = WELCOME_TOUR_STEPS.length;

/**
 * Get a welcome tour step by index
 */
export function getWelcomeTourStepByIndex(
  index: number
): WelcomeTourStep | undefined {
  if (index < 0 || index >= WELCOME_TOUR_STEPS.length) {
    return undefined;
  }
  return WELCOME_TOUR_STEPS[index];
}

/**
 * Check if there is a next welcome tour step
 */
export function hasNextWelcomeStep(currentIndex: number): boolean {
  return currentIndex < WELCOME_TOUR_STEPS.length - 1;
}

/**
 * Check if there is a previous welcome tour step
 */
export function hasPreviousWelcomeStep(currentIndex: number): boolean {
  return currentIndex > 0;
}

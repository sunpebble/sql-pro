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
  title: string;
  description: string;
  placement: WelcomeTourPlacement;
}

/**
 * Welcome tour steps configuration for the WelcomeScreen.
 * Introduces users to the main UI elements before connecting to a database.
 */
export const WELCOME_TOUR_STEPS: WelcomeTourStep[] = [
  {
    id: 'welcome-features',
    target: '[data-tour-target="feature-showcase"]',
    title: 'Feature Overview',
    description:
      'Explore the powerful features of SQL Pro. Click on any feature card to learn more, or check the documentation for detailed guides.',
    placement: 'right',
  },
  {
    id: 'welcome-open-database',
    target: '[data-action="open-database"]',
    title: 'Open Database',
    description:
      'Click here to open a SQLite database file (.db, .sqlite, .sqlite3). SQL Pro supports both regular and encrypted SQLCipher databases.',
    placement: 'left',
  },
  {
    id: 'welcome-server-connection',
    target: '[data-action="connect-server"]',
    title: 'Connect to Server',
    description:
      'Connect to remote database servers including MySQL, PostgreSQL, and Supabase. Configure host, port, and authentication settings.',
    placement: 'left',
  },
  {
    id: 'welcome-profiles',
    target: '[data-tour-target="profiles-button"]',
    title: 'Connection Profiles',
    description:
      'Save your frequently used connections as profiles for quick access. Organize them into folders and add notes for easy management.',
    placement: 'bottom',
  },
  {
    id: 'welcome-recent',
    target: '[data-tour-target="recent-connections"]',
    title: 'Recent Connections',
    description:
      'Quickly reconnect to your recently opened databases. Right-click for options like edit, save as profile, or remove from history.',
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

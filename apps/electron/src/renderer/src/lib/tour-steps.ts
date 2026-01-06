import type { TourConfig, TourStep } from '@/types/onboarding';

/**
 * Complete tour configuration for SQL Pro onboarding.
 * Covers all major features: schema browser, query editor, data grid,
 * command palette, ER diagram, Vim mode, and diff preview.
 */
export const TOUR_STEPS: TourStep[] = [
  // Step 1: Welcome
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to SQL Pro',
    description:
      "SQL Pro is a modern database client designed for developers. Let's take a quick tour of the key features to help you get started.",
    placement: 'center',
    spotlightMode: false,
  },

  // Step 2: Schema Browser (Sidebar)
  {
    id: 'schema-browser',
    target: '[data-tour-target="sidebar"]',
    title: 'Schema Browser',
    description:
      'Navigate your database structure here. Browse tables, views, and search for specific objects. Click any table to view its data.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
  },

  // Step 3: Data Browser
  {
    id: 'data-browser',
    target: '[data-tour-target="data-browser-tab"]',
    title: 'Data Browser',
    description:
      'View and edit table data with a powerful spreadsheet-like interface. Sort, filter, and modify data inline. Changes are tracked and can be previewed before saving.',
    placement: 'bottom',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'browser',
    },
  },

  // Step 4: Query Editor
  {
    id: 'query-editor',
    target: '[data-tour-target="query-editor-tab"]',
    title: 'Query Editor',
    description:
      'Write and execute SQL queries with syntax highlighting and autocomplete. View query results and execution time. Support for multiple queries and result sets.',
    placement: 'bottom',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'query',
    },
  },

  // Step 5: Command Palette
  {
    id: 'command-palette',
    target: '[data-tour-target="toolbar"]',
    title: 'Command Palette',
    description:
      'Press Cmd+K (or Ctrl+K) to open the command palette for quick access to all actions. Search for commands, switch between tables, and navigate your database without using the mouse.',
    placement: 'bottom',
    spotlightMode: true,
    waitForTarget: true,
  },

  // Step 6: ER Diagram
  {
    id: 'er-diagram',
    target: '[data-tour-target="diagram-tab"]',
    title: 'ER Diagram',
    description:
      'Visualize your database schema with interactive entity-relationship diagrams. See table relationships, foreign keys, and navigate your database structure visually.',
    placement: 'bottom',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'diagram',
    },
  },

  // Step 7: Vim Mode
  {
    id: 'vim-mode',
    target: '[data-tour-target="settings-button"]',
    title: 'Vim Mode',
    description:
      'Enable Vim mode for keyboard-driven editing in both the query editor and application navigation. Access settings from the toolbar to customize your experience.',
    placement: 'left',
    spotlightMode: true,
    waitForTarget: true,
  },

  // Step 8: Diff Preview
  {
    id: 'diff-preview',
    target: '[data-tour-target="data-browser-tab"]',
    title: 'Diff Preview',
    description:
      'Review all your changes before committing them to the database. See a visual diff of modified, inserted, and deleted rows. Safely review and apply changes with confidence.',
    placement: 'bottom',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'browser',
    },
  },
];

/**
 * Get the complete tour configuration
 */
export const TOUR_CONFIG: TourConfig = {
  steps: TOUR_STEPS,
  totalSteps: TOUR_STEPS.length,
};

/**
 * Get a specific tour step by ID
 */
export function getTourStepById(id: string): TourStep | undefined {
  return TOUR_STEPS.find((step) => step.id === id);
}

/**
 * Get a tour step by index (0-based)
 */
export function getTourStepByIndex(index: number): TourStep | undefined {
  if (index < 0 || index >= TOUR_STEPS.length) {
    return undefined;
  }
  return TOUR_STEPS[index];
}

/**
 * Get the index of a tour step by ID
 */
export function getTourStepIndex(id: string): number {
  return TOUR_STEPS.findIndex((step) => step.id === id);
}

/**
 * Check if a step index is valid
 */
export function isValidStepIndex(index: number): boolean {
  return index >= 0 && index < TOUR_STEPS.length;
}

/**
 * Check if there is a next step
 */
export function hasNextStep(currentIndex: number): boolean {
  return currentIndex < TOUR_STEPS.length - 1;
}

/**
 * Check if there is a previous step
 */
export function hasPreviousStep(currentIndex: number): boolean {
  return currentIndex > 0;
}

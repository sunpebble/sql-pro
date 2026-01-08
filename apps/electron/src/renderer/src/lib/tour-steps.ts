import type { TourConfig, TourStep } from '@/types/onboarding';

/**
 * Simplified tour configuration for SQL Pro onboarding.
 * Covers the essential features: schema browser, data browser, query editor,
 * ER diagram, schema compare, data diff, and command palette.
 *
 * The tour starts after user connects to a database.
 */
export const TOUR_STEPS: TourStep[] = [
  // Step 1: Schema Browser (Sidebar)
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

  // Step 2: Data Browser
  {
    id: 'data-browser',
    target: '[data-tour-target="data-browser-tab"]',
    title: 'Data Browser',
    description:
      'View and edit table data with a powerful spreadsheet-like interface. Sort, filter, and modify data inline. Changes are tracked and can be previewed before saving.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'browser',
    },
  },

  // Step 3: Query Editor
  {
    id: 'query-editor',
    target: '[data-tour-target="query-editor-tab"]',
    title: 'Query Editor',
    description:
      'Write and execute SQL queries with syntax highlighting and autocomplete. Supports Vim mode for keyboard-driven editing.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'query',
    },
  },

  // Step 4: ER Diagram
  {
    id: 'er-diagram',
    target: '[data-tour-target="diagram-tab"]',
    title: 'ER Diagram',
    description:
      'Visualize your database schema with interactive entity-relationship diagrams. See table relationships and foreign keys at a glance.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'diagram',
    },
  },

  // Step 5: Schema Compare
  {
    id: 'schema-compare',
    target: '[data-tour-target="schema-compare-tab"]',
    title: 'Schema Compare',
    description:
      'Compare database schemas between two connections. Identify differences in tables, columns, indexes, and generate migration scripts automatically.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'compare',
    },
  },

  // Step 6: Data Diff
  {
    id: 'data-diff',
    target: '[data-tour-target="data-diff-tab"]',
    title: 'Data Diff',
    description:
      'Compare table data between two databases. Visualize row-level differences and identify data changes across environments.',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'dataDiff',
    },
  },

  // Step 7: Command Palette & Settings (Final step)
  {
    id: 'command-palette',
    target: '[data-tour-target="toolbar"]',
    title: 'Command Palette & Settings',
    description:
      'Press ⌘K (or Ctrl+K) to open the command palette for quick access to all actions. Access settings to customize themes, fonts, Vim mode, keyboard shortcuts, and more!',
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

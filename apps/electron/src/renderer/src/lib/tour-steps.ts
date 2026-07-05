import type { TourConfig, TourStep } from '@/types/onboarding';

/**
 * Simplified tour configuration for Quarry onboarding.
 * Covers the essential features: schema browser, data browser, query editor,
 * ER diagram, schema compare, data diff, and command palette.
 *
 * The tour starts after user connects to a database.
 *
 * Note: title and description are translation keys that should be resolved
 * using t(`tour.steps.${step.id}.title`) and t(`tour.steps.${step.id}.description`)
 */
export const TOUR_STEPS: TourStep[] = [
  // Step 1: Schema Browser (Sidebar)
  {
    id: 'schemaBrowser',
    target: '[data-tour-target="sidebar"]',
    title: 'tour.steps.schemaBrowser.title',
    description: 'tour.steps.schemaBrowser.description',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
  },

  // Step 2: Data Browser
  {
    id: 'dataBrowser',
    target: '[data-tour-target="data-browser-tab"]',
    title: 'tour.steps.dataBrowser.title',
    description: 'tour.steps.dataBrowser.description',
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
    id: 'queryEditor',
    target: '[data-tour-target="query-editor-tab"]',
    title: 'tour.steps.queryEditor.title',
    description: 'tour.steps.queryEditor.description',
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
    id: 'erDiagram',
    target: '[data-tour-target="diagram-tab"]',
    title: 'tour.steps.erDiagram.title',
    description: 'tour.steps.erDiagram.description',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'diagram',
    },
  },

  // Step 5: Compare View (Schema Compare & Data Diff)
  {
    id: 'compare',
    target: '[data-tour-target="compare-tab"]',
    title: 'tour.steps.compare.title',
    description: 'tour.steps.compare.description',
    placement: 'right',
    spotlightMode: true,
    waitForTarget: true,
    action: {
      type: 'switch-tab',
      tab: 'compare',
    },
  },

  // Step 6: Command Palette & Settings (Final step)
  {
    id: 'commandPalette',
    target: '[data-tour-target="toolbar"]',
    title: 'tour.steps.commandPalette.title',
    description: 'tour.steps.commandPalette.description',
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

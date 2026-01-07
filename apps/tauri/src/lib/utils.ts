import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared Tailwind class string for toolbar button micro-interactions.
 * Provides subtle hover scale-up and active press-down animations.
 * - duration-150: Quick 150ms animation
 * - hover:scale-[1.02]: 2% scale up on hover (subtle professional feel)
 * - active:scale-[0.98]: 2% scale down on press (tactile feedback)
 */
export const TOOLBAR_BUTTON_INTERACTIVE =
  'duration-150 hover:scale-[1.02] active:scale-[0.98]';

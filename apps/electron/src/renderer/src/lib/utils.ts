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
 * - ease-in-out: Natural acceleration/deceleration curve
 * - hover:scale-[1.02]: 2% scale up on hover (subtle professional feel)
 * - active:scale-[0.98]: 2% scale down on press (tactile feedback)
 */
export const TOOLBAR_BUTTON_INTERACTIVE =
  'duration-150 ease-in-out hover:scale-[1.02] active:scale-[0.98]';

/**
 * Shared Tailwind class string for tooltip content styling.
 * Enhances default tooltip with frosted glass effect.
 * - tooltip-kbd: Marker class for kbd styling inside tooltip
 * - bg-popover/95: Semi-transparent for backdrop blur
 * - backdrop-blur-sm: Frosted glass blur effect
 */
export const TOOLTIP_CONTENT_STYLE =
  'tooltip-kbd bg-popover/95 backdrop-blur-sm';

/**
 * Shared Tailwind class string for tooltip content with flex layout.
 * Extends TOOLTIP_CONTENT_STYLE with flex layout for items with shortcuts.
 */
export const TOOLTIP_CONTENT_FLEX =
  'tooltip-kbd flex items-center gap-2.5 bg-popover/95 backdrop-blur-sm';

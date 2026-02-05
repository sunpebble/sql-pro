import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared Tailwind class string for toolbar button micro-interactions.
 * Neobrutalism style: translate effect instead of scale.
 * - transition-all duration-150: Quick 150ms animation
 * - hover:translate-x-0.5 hover:translate-y-0.5: Offset on hover
 * - active:translate-x-1 active:translate-y-1: Press effect
 */
export const TOOLBAR_BUTTON_INTERACTIVE =
  'transition-all duration-150 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1';

/**
 * Shared Tailwind class string for tooltip content styling.
 * Neobrutalism style: solid background with border.
 * - tooltip-kbd: Marker class for kbd styling inside tooltip
 * - bg-popover: Solid background (no transparency)
 * - border-2 border-border: Thick border
 */
export const TOOLTIP_CONTENT_STYLE =
  'tooltip-kbd bg-popover border-2 border-border shadow-shadow';

/**
 * Shared Tailwind class string for tooltip content with flex layout.
 * Extends TOOLTIP_CONTENT_STYLE with flex layout for items with shortcuts.
 */
export const TOOLTIP_CONTENT_FLEX =
  'tooltip-kbd flex items-center gap-2.5 bg-popover border-2 border-border shadow-shadow';

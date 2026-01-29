// Tag definition with color support for table organization

/**
 * A tag definition with unique ID and color support
 */
export interface TagDefinition {
  /** UUID for stable references */
  id: string;
  /** Display name */
  name: string;
  /** Hex color (e.g., "#F97316") */
  color: string;
  /** ISO timestamp when tag was created */
  createdAt: string;
}

/**
 * Table metadata for organization purposes
 * Uses tag IDs instead of tag names for stable references
 */
export interface TableMetadata {
  /** Tag IDs assigned to the table */
  tagIds: string[];
  /** Custom sort order (used when sortOption is 'custom') */
  sortOrder?: number;
  /** Whether the table is pinned to the top */
  pinned?: boolean;
  /** Custom color for the table (hex) - separate from tag colors */
  color?: string;
}

/**
 * Preset colors for quick tag color selection
 * Curated palette that works well in both light and dark modes
 */
export const PRESET_TAG_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange (brand color)
  '#F59E0B', // Amber
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
] as const;

/** Type for preset tag colors */
export type PresetTagColor = (typeof PRESET_TAG_COLORS)[number];

/** Default tag color (orange - matches brand) */
export const DEFAULT_TAG_COLOR = '#F97316';

/**
 * Calculate contrast color for text on a colored background
 * Uses relative luminance formula for accessibility
 *
 * @param hexColor - Hex color string (e.g., "#F97316")
 * @returns 'white' or 'black' for optimal text contrast
 */
export function getContrastColor(hexColor: string): 'white' | 'black' {
  // Handle invalid input
  if (!hexColor || hexColor.length < 7) {
    return 'white';
  }

  const r = Number.parseInt(hexColor.slice(1, 3), 16);
  const g = Number.parseInt(hexColor.slice(3, 5), 16);
  const b = Number.parseInt(hexColor.slice(5, 7), 16);

  // Handle NaN from invalid hex
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return 'white';
  }

  // Calculate relative luminance using sRGB coefficients
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Generate a random tag color from the preset palette
 * @param excludeColors - Colors to exclude from selection
 */
export function getRandomTagColor(excludeColors: string[] = []): string {
  const available = PRESET_TAG_COLORS.filter((c) => !excludeColors.includes(c));
  if (available.length === 0) {
    return DEFAULT_TAG_COLOR;
  }
  return available[Math.floor(Math.random() * available.length)];
}

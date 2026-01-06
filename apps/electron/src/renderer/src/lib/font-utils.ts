/**
 * Font utilities for the renderer process
 * Uses the Local Font Access API to get system fonts
 */

import type { FontCategory, SystemFont } from '@shared/types/font';

// Well-known font lists for efficient classification
const MONOSPACE_FONTS = new Set([
  'Cascadia Code',
  'Cascadia Mono',
  'Consolas',
  'Courier',
  'Courier New',
  'DejaVu Sans Mono',
  'Droid Sans Mono',
  'Fira Code',
  'Fira Mono',
  'Hack',
  'IBM Plex Mono',
  'Inconsolata',
  'JetBrains Mono',
  'Menlo',
  'Monaco',
  'Noto Mono',
  'Noto Sans Mono',
  'PT Mono',
  'Roboto Mono',
  'SF Mono',
  'Source Code Pro',
  'Ubuntu Mono',
  'Victor Mono',
]);

const SERIF_FONTS = new Set([
  'Baskerville',
  'Book Antiqua',
  'Cambria',
  'Century',
  'Charter',
  'Crimson Text',
  'DejaVu Serif',
  'Didot',
  'EB Garamond',
  'Georgia',
  'Hoefler Text',
  'IBM Plex Serif',
  'Iowan Old Style',
  'Linux Libertine',
  'Lora',
  'Merriweather',
  'Noto Serif',
  'PT Serif',
  'Palatino',
  'Palatino Linotype',
  'Playfair Display',
  'Source Serif Pro',
  'Times',
  'Times New Roman',
]);

const SANS_SERIF_FONTS = new Set([
  'Arial',
  'Avenir',
  'Avenir Next',
  'Calibri',
  'DejaVu Sans',
  'Fira Sans',
  'Franklin Gothic',
  'Gill Sans',
  'Helvetica',
  'Helvetica Neue',
  'IBM Plex Sans',
  'Inter',
  'Lato',
  'Lucida Grande',
  'Lucida Sans',
  'Montserrat',
  'Noto Sans',
  'Nunito',
  'Open Sans',
  'Optima',
  'Oswald',
  'PT Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'San Francisco',
  'Segoe UI',
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'Source Sans Pro',
  'Tahoma',
  'Trebuchet MS',
  'Ubuntu',
  'Verdana',
]);

const DISPLAY_FONTS = new Set([
  'American Typewriter',
  'Brush Script',
  'Chalkboard',
  'Comic Sans MS',
  'Copperplate',
  'Impact',
  'Luminari',
  'Marker Felt',
  'Papyrus',
  'Phosphate',
  'Rockwell',
  'Snell Roundhand',
  'Zapfino',
]);

// Category ordering for sorting
const CATEGORY_ORDER: Record<FontCategory, number> = {
  monospace: 0,
  'sans-serif': 1,
  serif: 2,
  display: 3,
  other: 4,
};

// Font name keywords for heuristic classification
const MONOSPACE_KEYWORDS = ['mono', 'code', 'console', 'courier'];
const SERIF_KEYWORDS = ['serif'];
const SANS_SERIF_KEYWORDS = ['sans', 'gothic', 'grotesk'];
const DISPLAY_KEYWORDS = ['script', 'hand', 'brush', 'display'];

/**
 * Classify a font into a category based on known font lists or naming heuristics
 */
export function classifyFont(fontName: string): FontCategory {
  const normalized = fontName.trim();

  // Check known font sets first (O(1) lookup)
  if (MONOSPACE_FONTS.has(normalized)) return 'monospace';
  if (SERIF_FONTS.has(normalized)) return 'serif';
  if (SANS_SERIF_FONTS.has(normalized)) return 'sans-serif';
  if (DISPLAY_FONTS.has(normalized)) return 'display';

  // Use naming heuristics (case-insensitive)
  const lower = normalized.toLowerCase();

  if (MONOSPACE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'monospace';
  }
  if (
    SERIF_KEYWORDS.some((kw) => lower.includes(kw)) &&
    !lower.includes('sans') &&
    !lower.includes('sans-serif')
  ) {
    return 'serif';
  }
  if (SANS_SERIF_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'sans-serif';
  }
  if (DISPLAY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'display';
  }

  return 'other';
}

/**
 * Font data returned by the Local Font Access API
 */
interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

/**
 * Check if the Local Font Access API is available
 */
export function isLocalFontAccessAvailable(): boolean {
  return 'queryLocalFonts' in window;
}

/**
 * Get all system fonts using the Local Font Access API
 * Falls back to IPC call if the API is not available
 */
export async function getSystemFonts(): Promise<SystemFont[]> {
  // Check if Local Font Access API is available
  if (!isLocalFontAccessAvailable()) {
    console.warn('Local Font Access API not available');
    return [];
  }

  try {
    // Query local fonts using the browser API
    // This requires user permission on first use
    const fonts = (await (
      window as unknown as Window & {
        queryLocalFonts: () => Promise<FontData[]>;
      }
    ).queryLocalFonts()) as FontData[];

    // Extract unique font families
    const fontFamilies = new Set<string>();
    for (const font of fonts) {
      fontFamilies.add(font.family);
    }

    // Convert to SystemFont array with classification
    const systemFonts: SystemFont[] = Array.from(fontFamilies).map((name) => ({
      name,
      category: classifyFont(name),
    }));

    // Sort by category then alphabetically
    return systemFonts.sort((a, b) => {
      const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
      if (catDiff !== 0) return catDiff;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  } catch (error) {
    // User denied permission or API error
    console.error('Failed to query local fonts:', error);
    return [];
  }
}

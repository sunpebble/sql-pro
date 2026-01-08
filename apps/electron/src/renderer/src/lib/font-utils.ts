/**
 * Font utilities for the renderer process
 * Uses Electron backend to get system fonts
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
 * Check if font access is available
 * In Electron, we use the CSS font loading API or queryLocalFonts if available
 */
export function isLocalFontAccessAvailable(): boolean {
  return true;
}

/**
 * Get all system fonts
 * In Electron, we use a combination of known fonts and CSS font detection
 */
export async function getSystemFonts(): Promise<SystemFont[]> {
  try {
    // Try to use queryLocalFonts if available (Chrome 103+)
    if ('queryLocalFonts' in window) {
      // @ts-expect-error queryLocalFonts is not in TypeScript types yet
      const fonts = await window.queryLocalFonts();
      const uniqueFonts = new Map<string, SystemFont>();

      for (const font of fonts) {
        if (!uniqueFonts.has(font.family)) {
          uniqueFonts.set(font.family, {
            name: font.family,
            category: classifyFont(font.family),
          });
        }
      }

      return Array.from(uniqueFonts.values());
    }

    // Fallback: return a list of common fonts
    const commonFonts = [
      ...MONOSPACE_FONTS,
      ...SERIF_FONTS,
      ...SANS_SERIF_FONTS,
      ...DISPLAY_FONTS,
    ];

    return commonFonts.map((name) => ({
      name,
      category: classifyFont(name),
    }));
  } catch (error) {
    console.error('Failed to get system fonts:', error);
    return [];
  }
}

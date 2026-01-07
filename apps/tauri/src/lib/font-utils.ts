/**
 * Font utilities for the renderer process
 * Uses Tauri backend to get system fonts (Local Font Access API not available in WebView)
 */

import type { FontCategory, SystemFont } from '@shared/types/font';
import { invoke } from '@tauri-apps/api/core';

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

// Category ordering for sorting (used for reference, sorting done in backend)
// @ts-expect-error Reserved for future use
const _CATEGORY_ORDER: Record<FontCategory, number> = {
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
 * Check if the Local Font Access API is available
 * Note: This API is not available in Tauri's WebView, we use the backend instead.
 */
export function isLocalFontAccessAvailable(): boolean {
  // In Tauri, we always use the backend to get fonts
  // Return true to indicate font access is available
  return true;
}

/**
 * Get all system fonts using the Tauri backend
 * The backend uses platform-specific methods to enumerate fonts
 */
export async function getSystemFonts(): Promise<SystemFont[]> {
  try {
    // Use Tauri backend to get system fonts
    const result = await invoke<{
      success: boolean;
      fonts: Array<{ name: string; category: string }>;
    }>('get_system_fonts');

    if (result.success && result.fonts) {
      // Convert backend response to SystemFont array
      return result.fonts.map((font) => ({
        name: font.name,
        category: (font.category as FontCategory) || classifyFont(font.name),
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to get system fonts from backend:', error);
    return [];
  }
}

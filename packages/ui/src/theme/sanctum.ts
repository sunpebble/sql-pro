/**
 * Data Sanctum Design System
 * Art Deco meets Modern Database Aesthetic
 *
 * This theme provides design tokens and utilities for the SQL Pro brand identity.
 */

// ═══════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════

export const sanctumColors = {
  // The Void - Deep blacks
  void: {
    absolute: '#020202',
    deep: '#060606',
    base: '#0B0B0B',
    elevated: '#141414',
  },

  // Antique Gold - Sacred accent
  gold: {
    bright: '#D4AF37',
    muted: '#C9A962',
    dark: '#9A7B2D',
    glow: 'rgba(212, 175, 55, 0.35)',
    subtle: 'rgba(212, 175, 55, 0.08)',
  },

  // Ivory - Text and contrast
  ivory: {
    DEFAULT: '#F8F6F1',
    dim: 'rgba(248, 246, 241, 0.85)',
    muted: 'rgba(248, 246, 241, 0.6)',
    ghost: 'rgba(248, 246, 241, 0.25)',
    whisper: 'rgba(248, 246, 241, 0.08)',
  },

  // Accent colors
  burgundy: {
    DEFAULT: '#8B2942',
    glow: 'rgba(139, 41, 66, 0.4)',
  },

  // Semantic
  success: '#4A7C59',
  info: '#4A6D8C',
} as const;

// ═══════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════

export const sanctumFonts = {
  display:
    "'Cormorant Garamond', 'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  body: "'Manrope', 'Avenir Next', Avenir, Helvetica, sans-serif",
  mono: "'IBM Plex Mono', 'SF Mono', Monaco, monospace",
} as const;

// ═══════════════════════════════════════
// EFFECTS & SHADOWS
// ═══════════════════════════════════════

export const sanctumShadows = {
  subtle: '0 4px 24px rgba(0, 0, 0, 0.4)',
  elevated: '0 16px 64px rgba(0, 0, 0, 0.5)',
  dramatic: '0 32px 128px rgba(0, 0, 0, 0.6), 0 0 1px rgba(212, 175, 55, 0.2)',
  goldGlow: '0 0 40px rgba(212, 175, 55, 0.35)',
  goldGlowIntense:
    '0 8px 50px rgba(212, 175, 55, 0.5), 0 0 80px rgba(212, 175, 55, 0.15)',
} as const;

// ═══════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════

export const sanctumGradients = {
  gold: 'linear-gradient(135deg, #D4AF37 0%, #E8D59E 25%, #C9A962 50%, #E8D59E 75%, #D4AF37 100%)',
  goldButton: 'linear-gradient(135deg, #C9A962 0%, #D4AF37 50%, #C9A962 100%)',
  goldButtonHover:
    'linear-gradient(135deg, #D4AF37 0%, #E8D59E 50%, #D4AF37 100%)',
  voidRadial:
    'radial-gradient(ellipse 100% 40% at 50% -5%, rgba(212, 175, 55, 0.06), transparent 50%)',
} as const;

// ═══════════════════════════════════════
// ANIMATION TIMING
// ═══════════════════════════════════════

export const sanctumEasing = {
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
  dramatic: 'cubic-bezier(0.6, 0.01, 0.05, 0.95)',
} as const;

export const sanctumDuration = {
  instant: '100ms',
  swift: '200ms',
  smooth: '400ms',
  theatrical: '800ms',
} as const;

// ═══════════════════════════════════════
// CSS VARIABLE NAMES
// ═══════════════════════════════════════

export const cssVars = {
  goldBright: 'var(--gold-bright)',
  goldMuted: 'var(--gold-muted)',
  goldDark: 'var(--gold-dark)',
  goldGlow: 'var(--gold-glow)',
  goldSubtle: 'var(--gold-subtle)',
  gradientGold: 'var(--gradient-gold)',
} as const;

// ═══════════════════════════════════════
// TAILWIND CLASS PRESETS
// ═══════════════════════════════════════

/**
 * Pre-built Tailwind class combinations for common patterns
 */
export const sanctumClasses = {
  // Text styles
  textGold: 'text-[#C9A962]',
  textIvory: 'text-[#F8F6F1]',
  textMuted: 'text-[rgba(248,246,241,0.6)]',

  // Background styles
  bgVoid: 'bg-[#060606]',
  bgElevated: 'bg-[#141414]',
  bgGoldSubtle: 'bg-[rgba(212,175,55,0.08)]',

  // Border styles
  borderGold: 'border-[rgba(212,175,55,0.3)]',
  borderGoldBright: 'border-[#C9A962]',
  borderWhisper: 'border-[rgba(248,246,241,0.08)]',

  // Glow effects
  glowGold: 'shadow-[0_0_40px_rgba(212,175,55,0.35)]',
  glowGoldIntense:
    'shadow-[0_8px_50px_rgba(212,175,55,0.5),0_0_80px_rgba(212,175,55,0.15)]',
} as const;

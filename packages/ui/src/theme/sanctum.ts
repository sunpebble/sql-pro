/**
 * SQL Pro Design System
 * Modern, Professional Database Management Aesthetic
 *
 * This theme provides design tokens and utilities for the SQL Pro brand identity.
 * Primary color: Emerald Green (#10B981 / oklch(0.696 0.17 162.48))
 */

// ═══════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════

export const brandColors = {
  // Background colors (light mode)
  background: {
    DEFAULT: '#ffffff',
    subtle: '#f8fafc',
    muted: '#f1f5f9',
    elevated: '#ffffff',
  },

  // Background colors (dark mode)
  backgroundDark: {
    DEFAULT: '#0f172a', // Slate 900
    subtle: '#1e293b', // Slate 800
    muted: '#334155', // Slate 700
    elevated: '#1e293b',
  },

  // Primary - Emerald Green
  primary: {
    DEFAULT: '#10b981', // Emerald 500
    light: '#34d399', // Emerald 400
    dark: '#059669', // Emerald 600
    50: '#ecfdf5',
    100: '#d1fae5',
    glow: 'rgba(16, 185, 129, 0.35)',
    subtle: 'rgba(16, 185, 129, 0.08)',
  },

  // Foreground / Text colors
  foreground: {
    DEFAULT: '#0f172a', // Slate 900
    secondary: '#475569', // Slate 600
    muted: '#64748b', // Slate 500
    light: '#94a3b8', // Slate 400
    inverse: '#ffffff',
  },

  // Border colors
  border: {
    DEFAULT: '#e2e8f0', // Slate 200
    medium: '#cbd5e1', // Slate 300
    dark: '#94a3b8', // Slate 400
  },

  // Accent colors
  accent: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f97316',
    pink: '#ec4899',
    cyan: '#06b6d4',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// Legacy alias for backward compatibility
export const sanctumColors = brandColors;

// ═══════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════

export const brandFonts = {
  sans: "'Noto Sans Variable', 'Inter', system-ui, -apple-system, sans-serif",
  display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', Monaco, monospace",
} as const;

// Legacy alias for backward compatibility
export const sanctumFonts = brandFonts;

// ═══════════════════════════════════════
// EFFECTS & SHADOWS
// ═══════════════════════════════════════

export const brandShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  card: '0 4px 24px rgba(0, 0, 0, 0.06)',
  cardHover: '0 12px 40px rgba(0, 0, 0, 0.12)',
  primaryGlow: '0 0 40px rgba(16, 185, 129, 0.35)',
  primaryGlowIntense:
    '0 8px 50px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.15)',
} as const;

// Legacy alias for backward compatibility
export const sanctumShadows = brandShadows;

// ═══════════════════════════════════════
// GRADIENTS
// ═══════════════════════════════════════

export const brandGradients = {
  primary: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
  primaryButton:
    'linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)',
  primaryButtonHover:
    'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
  primaryToCyan: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  subtleRadial:
    'radial-gradient(ellipse 100% 40% at 50% -5%, rgba(16, 185, 129, 0.06), transparent 50%)',
} as const;

// Legacy alias for backward compatibility
export const sanctumGradients = brandGradients;

// ═══════════════════════════════════════
// ANIMATION TIMING
// ═══════════════════════════════════════

export const brandEasing = {
  out: 'cubic-bezier(0.33, 1, 0.68, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

// Legacy alias for backward compatibility
export const sanctumEasing = brandEasing;

export const brandDuration = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  slower: '600ms',
} as const;

// Legacy alias for backward compatibility
export const sanctumDuration = brandDuration;

// ═══════════════════════════════════════
// CSS VARIABLE NAMES
// ═══════════════════════════════════════

export const cssVars = {
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  border: 'var(--border)',
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  // Legacy aliases (mapped to primary in CSS)
  goldBright: 'var(--primary)',
  goldMuted: 'var(--primary)',
  goldDark: 'var(--primary-dark)',
  goldGlow: 'var(--primary-glow)',
  goldSubtle: 'var(--primary-subtle)',
} as const;

// ═══════════════════════════════════════
// TAILWIND CLASS PRESETS
// ═══════════════════════════════════════

/**
 * Pre-built Tailwind class combinations for common patterns
 * Uses theme-aware CSS variable classes instead of hardcoded colors
 */
export const brandClasses = {
  // Text styles
  textPrimary: 'text-primary',
  textForeground: 'text-foreground',
  textMuted: 'text-muted-foreground',

  // Background styles
  bgBackground: 'bg-background',
  bgCard: 'bg-card',
  bgMuted: 'bg-muted',
  bgPrimarySubtle: 'bg-primary/10',

  // Border styles
  borderDefault: 'border-border',
  borderPrimary: 'border-primary/30',
  borderPrimaryBright: 'border-primary',

  // Glow effects
  glowPrimary: 'shadow-[0_0_40px_rgba(16,185,129,0.35)]',
  glowPrimaryIntense:
    'shadow-[0_8px_50px_rgba(16,185,129,0.5),0_0_80px_rgba(16,185,129,0.15)]',
} as const;

// Legacy alias for backward compatibility
export const sanctumClasses = brandClasses;

// SQL Pro Design System Colors (from CLAUDE.md)
export const colors = {
  // Primary - Orange
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FB923C',

  // Backgrounds - Dark theme
  bgDark: '#1C1917',
  bgDarker: '#0F0F0E',
  bgCard: '#292524',

  // Text
  textPrimary: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',

  // Accent
  accentBlue: '#3B82F6',
  accentCyan: '#06B6D4',
  accentPurple: '#8B5CF6',

  // Status
  success: '#22C55E',
};

export const fonts = {
  display: 'Plus Jakarta Sans, Inter, system-ui, sans-serif',
  body: 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
  mono: 'JetBrains Mono, SF Mono, Monaco, monospace',
};

// Video dimensions
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const FPS = 30;

// Timing helpers (in seconds)
export const seconds = (s: number) => s * FPS;

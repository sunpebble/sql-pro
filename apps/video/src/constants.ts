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

// Scene duration constants (in seconds)
export const INTRO_DURATION_S = 5;
export const FEATURE_DURATION_S = 8;
export const OUTRO_DURATION_S = 6;
export const TRANSITION_DURATION_S = 0.8;

// Feature data for showcasing
export const features = [
  {
    title: 'Smart Query Editor',
    description:
      'Monaco editor with SQL syntax highlighting, autocomplete, Vim mode, and query history.',
    screenshot: 'screenshots/query-dark.png',
    align: 'left' as const,
  },
  {
    title: 'Visual Data Editing',
    description:
      'Inline editing with diff preview. See exactly what changed before saving.',
    screenshot: 'screenshots/table-dark.png',
    align: 'right' as const,
  },
  {
    title: 'Multi-Database Support',
    description:
      'SQLite, SQLCipher encryption. Open multiple databases in tabs.',
    screenshot: 'screenshots/database-dark.png',
    align: 'left' as const,
  },
];

export const FEATURE_COUNT = features.length;
export const TRANSITION_COUNT = FEATURE_COUNT + 1;

// Total duration in frames
export const TOTAL_DURATION =
  seconds(INTRO_DURATION_S) +
  seconds(FEATURE_DURATION_S) * FEATURE_COUNT +
  seconds(OUTRO_DURATION_S) -
  Math.round(TRANSITION_DURATION_S * FPS) * TRANSITION_COUNT;

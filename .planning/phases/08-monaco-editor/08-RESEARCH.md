# Phase 8: Monaco Editor - Research

**Researched:** 2026-01-27
**Domain:** Monaco Editor SQL theming, syntax highlighting customization
**Confidence:** HIGH

## Summary

This phase coordinates the Monaco SQL editor theme with the app's dark-first design system using orange accents. The current editor uses default VS Code-style colors that don't harmonize with the warm orange design language.

Monaco Editor v0.55.1 (via @monaco-editor/react v4.7.0) provides comprehensive theming through `defineTheme()` with token rules for syntax highlighting and color tokens for UI elements like cursor, selection, and suggest widget. The existing `defineCustomThemes()` function in `monaco-sql-config.ts` already defines `sql-pro-light` and `sql-pro-dark` themes but uses generic VS Code colors rather than the app's design system.

The SQL tokenizer produces these key token types: `keyword`, `string`, `number`, `comment`, `operator`, `identifier`, `predefined` (functions/variables), and `delimiter`. Each can be styled with foreground color and font style (bold/italic).

**Primary recommendation:** Update the Monaco theme definitions to use colors derived from the app's OKLCH-based Slate/Orange palette, with orange accent for cursor and selection, and harmonized syntax colors that maintain readability on the Slate-900 dark background.

## Standard Stack

The editor stack is already in place - this phase focuses on theme configuration only.

### Core

| Library              | Version | Purpose          | Why Standard                               |
| -------------------- | ------- | ---------------- | ------------------------------------------ |
| monaco-editor        | 0.55.1  | Code editor core | VS Code's editor, mature and full-featured |
| @monaco-editor/react | 4.7.0   | React wrapper    | Official React binding for Monaco          |

### Existing Configuration

| File                                                            | Purpose                                                |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/electron/src/renderer/src/lib/monaco-sql-config.ts`       | Contains `defineCustomThemes()` with theme definitions |
| `apps/electron/src/renderer/src/components/MonacoSqlEditor.tsx` | Editor component using themes                          |

## Architecture Patterns

### Monaco Theme Definition Structure

Themes are defined via `monaco.editor.defineTheme()` with this structure:

```typescript
monaco.editor.defineTheme('theme-name', {
  base: 'vs-dark', // Base theme: 'vs', 'vs-dark', or 'hc-black'
  inherit: true, // Inherit base theme rules
  rules: [
    // Token color rules
    { token: 'keyword', foreground: 'RRGGBB', fontStyle: 'bold' },
    { token: 'string', foreground: 'RRGGBB' },
    // ...
  ],
  colors: {
    // UI element colors
    'editor.background': '#RRGGBB',
    'editorCursor.foreground': '#RRGGBB',
    // ...
  },
});
```

### SQL Token Types (from Monaco SQL tokenizer)

| Token              | Description        | Example                   |
| ------------------ | ------------------ | ------------------------- |
| `keyword`          | SQL keywords       | SELECT, FROM, WHERE, JOIN |
| `keyword.block`    | Block keywords     | BEGIN, CASE, END          |
| `keyword.choice`   | Choice keywords    | WHEN, THEN                |
| `keyword.try`      | Try/catch keywords | BEGIN TRY, END TRY        |
| `keyword.catch`    | Catch keywords     | BEGIN CATCH, END CATCH    |
| `string`           | String literals    | 'value', N'unicode'       |
| `number`           | Numeric literals   | 123, 45.67, 0xFF          |
| `comment`          | Comments           | -- comment, /_ block _/   |
| `operator`         | Operators          | =, <, >, AND, OR          |
| `identifier`       | Table/column names | users, created_at         |
| `identifier.quote` | Quoted identifiers | [table], "column"         |
| `predefined`       | Built-in functions | COUNT, MAX, GETDATE       |
| `delimiter`        | Punctuation        | ;, ,, .                   |
| `white`            | Whitespace         | spaces, tabs              |

### Color Token Categories for Monaco

**Cursor & Selection:**

- `editorCursor.foreground` - Cursor color
- `editorCursor.background` - Block cursor background
- `editor.selectionBackground` - Selected text background
- `editor.inactiveSelectionBackground` - Selection when unfocused
- `editor.selectionHighlightBackground` - Matches of selected text

**Line & Highlighting:**

- `editor.background` - Editor background
- `editor.foreground` - Default text color
- `editor.lineHighlightBackground` - Current line background
- `editor.lineHighlightBorder` - Current line border (optional)

**Line Numbers:**

- `editorLineNumber.foreground` - Line number color
- `editorLineNumber.activeForeground` - Active line number

**Suggest Widget (Autocomplete):**

- `editorSuggestWidget.background` - Popup background
- `editorSuggestWidget.border` - Popup border
- `editorSuggestWidget.foreground` - Text color
- `editorSuggestWidget.selectedBackground` - Selected item
- `editorSuggestWidget.selectedForeground` - Selected text
- `editorSuggestWidget.highlightForeground` - Match highlight
- `editorSuggestWidget.focusHighlightForeground` - Focused match

**Bracket Matching:**

- `editorBracketMatch.background` - Matching bracket background
- `editorBracketMatch.border` - Matching bracket border

**Find/Search:**

- `editor.findMatchBackground` - Current match
- `editor.findMatchHighlightBackground` - Other matches

### Recommended Color Mapping (Dark Theme)

Mapping app design tokens to Monaco hex colors:

| Design Token     | OKLCH                      | Hex (approx) | Monaco Use                 |
| ---------------- | -------------------------- | ------------ | -------------------------- |
| --orange-400     | oklch(0.75 0.183 55.934)   | #FB923C      | Cursor, selection accent   |
| --orange-400/15% |                            | #FB923C26    | Selection background       |
| --slate-900      | oklch(0.208 0.042 265.755) | #0F172A      | Editor background          |
| --slate-100      | oklch(0.968 0.007 247.896) | #F1F5F9      | Default foreground         |
| --slate-400      | oklch(0.704 0.04 256.788)  | #94A3B8      | Line numbers               |
| --slate-300      | oklch(0.869 0.022 252.894) | #CBD5E1      | Active line number         |
| --slate-800      | oklch(0.279 0.041 260.031) | #1E293B      | Line highlight, suggest bg |
| --slate-700      | oklch(0.372 0.044 257.287) | #334155      | Suggest selected           |

### Recommended Syntax Color Palette (Dark Theme)

Harmonized colors for SQL syntax on dark background:

| Token               | Suggested Color | Hex     | Rationale                          |
| ------------------- | --------------- | ------- | ---------------------------------- |
| keyword             | Warm blue       | #93C5FD | Blue-300, readable but not jarring |
| keyword (fontStyle) | bold            | -       | Emphasis for structure             |
| string              | Warm green      | #86EFAC | Green-300, distinct from keywords  |
| number              | Amber           | #FCD34D | Amber-300, warm and visible        |
| comment             | Slate-500       | #64748B | Muted, non-distracting             |
| comment (fontStyle) | italic          | -       | Visual distinction                 |
| operator            | Slate-300       | #CBD5E1 | Neutral, doesn't compete           |
| identifier          | Slate-100       | #F1F5F9 | Default, primary readability       |
| predefined          | Orange-300      | #FDBA74 | Orange accent for built-ins        |
| delimiter           | Slate-400       | #94A3B8 | Subtle punctuation                 |

### Recommended Syntax Color Palette (Light Theme)

| Token      | Suggested Color | Hex     | Rationale                  |
| ---------- | --------------- | ------- | -------------------------- |
| keyword    | Blue-700        | #1D4ED8 | Strong contrast on white   |
| string     | Green-700       | #15803D | Distinct, readable         |
| number     | Amber-700       | #B45309 | Warm, consistent with dark |
| comment    | Slate-500       | #64748B | Muted                      |
| operator   | Slate-900       | #0F172A | High contrast              |
| identifier | Slate-800       | #1E293B | Primary text               |
| predefined | Orange-600      | #EA580C | Orange accent              |
| delimiter  | Slate-500       | #64748B | Subtle                     |

## Don't Hand-Roll

| Problem             | Don't Build          | Use Instead                     | Why                                      |
| ------------------- | -------------------- | ------------------------------- | ---------------------------------------- |
| Syntax highlighting | Custom tokenizer     | Monaco's built-in SQL tokenizer | Already handles all SQL syntax correctly |
| Theme switching     | Manual CSS injection | `monaco.editor.setTheme()`      | Monaco manages theme state internally    |
| OKLCH to hex        | Runtime conversion   | Pre-computed hex values         | Monaco requires hex colors, not CSS vars |
| Token types         | Custom token names   | Standard Monaco SQL tokens      | Must match tokenizer output              |

**Key insight:** Monaco themes use hex colors directly, not CSS variables. The theme definition must include pre-computed hex approximations of the OKLCH design tokens.

## Common Pitfalls

### Pitfall 1: CSS Variable Usage

**What goes wrong:** Attempting to use CSS variables like `var(--primary)` in Monaco theme definitions
**Why it happens:** Monaco themes expect hex colors, not CSS references
**How to avoid:** Pre-compute hex approximations of OKLCH colors and use those directly
**Warning signs:** Theme colors don't apply, editor appears unstyled

### Pitfall 2: Token Name Mismatches

**What goes wrong:** Using non-existent token names in theme rules
**Why it happens:** Guessing token names instead of checking tokenizer output
**How to avoid:** Use exact token names from the SQL tokenizer: `keyword`, `string`, `number`, `comment`, `operator`, `identifier`, `predefined`, `delimiter`
**Warning signs:** Certain syntax elements remain default colored

### Pitfall 3: Selection Visibility

**What goes wrong:** Orange selection too bright or too dim
**Why it happens:** Pure orange is too saturated for selection background
**How to avoid:** Use orange with ~15-25% opacity for selection, keep cursor fully opaque
**Warning signs:** Selected text hard to read, selection distracting

### Pitfall 4: Light Theme Contrast

**What goes wrong:** Colors that work in dark theme are washed out in light
**Why it happens:** Same lightness values don't work for both themes
**How to avoid:** Define separate color palettes per theme, test contrast ratios
**Warning signs:** WCAG contrast failures in light mode

### Pitfall 5: Suggest Widget Styling

**What goes wrong:** Autocomplete popup doesn't match app style
**Why it happens:** Missing suggest widget color tokens in theme
**How to avoid:** Include all editorSuggestWidget.\* tokens in theme colors
**Warning signs:** Jarring white/black autocomplete popup

## Code Examples

### Complete Theme Definition Pattern

```typescript
// Source: Monaco Editor API + design system colors

// Dark theme (primary)
monaco.editor.defineTheme('sql-pro-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords - warm blue, bold for structure
    { token: 'keyword', foreground: '93C5FD', fontStyle: 'bold' },
    { token: 'keyword.sql', foreground: '93C5FD', fontStyle: 'bold' },
    { token: 'keyword.block', foreground: '93C5FD', fontStyle: 'bold' },
    { token: 'keyword.choice', foreground: '93C5FD' },

    // Strings - warm green
    { token: 'string', foreground: '86EFAC' },
    { token: 'string.sql', foreground: '86EFAC' },

    // Numbers - amber
    { token: 'number', foreground: 'FCD34D' },
    { token: 'number.sql', foreground: 'FCD34D' },

    // Comments - muted, italic
    { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
    { token: 'comment.sql', foreground: '64748B', fontStyle: 'italic' },
    { token: 'comment.quote', foreground: '64748B', fontStyle: 'italic' },

    // Operators - neutral
    { token: 'operator', foreground: 'CBD5E1' },
    { token: 'operator.sql', foreground: 'CBD5E1' },

    // Identifiers - primary text
    { token: 'identifier', foreground: 'F1F5F9' },
    { token: 'identifier.quote', foreground: 'F1F5F9' },

    // Built-in functions - orange accent
    { token: 'predefined', foreground: 'FDBA74' },

    // Delimiters - subtle
    { token: 'delimiter', foreground: '94A3B8' },
  ],
  colors: {
    // Editor background/foreground (Slate-900/Slate-100)
    'editor.background': '#0F172A',
    'editor.foreground': '#F1F5F9',

    // Cursor - orange accent
    'editorCursor.foreground': '#FB923C',

    // Selection - orange with opacity
    'editor.selectionBackground': '#FB923C40',
    'editor.inactiveSelectionBackground': '#FB923C25',
    'editor.selectionHighlightBackground': '#FB923C20',

    // Line highlight (Slate-800)
    'editor.lineHighlightBackground': '#1E293B',

    // Line numbers (Slate-400/Slate-300)
    'editorLineNumber.foreground': '#94A3B8',
    'editorLineNumber.activeForeground': '#CBD5E1',

    // Suggest widget (Slate-800/Slate-700)
    'editorSuggestWidget.background': '#1E293B',
    'editorSuggestWidget.border': '#334155',
    'editorSuggestWidget.foreground': '#F1F5F9',
    'editorSuggestWidget.selectedBackground': '#334155',
    'editorSuggestWidget.highlightForeground': '#FB923C',
    'editorSuggestWidget.focusHighlightForeground': '#FB923C',

    // Bracket matching - orange tint
    'editorBracketMatch.background': '#FB923C30',
    'editorBracketMatch.border': '#FB923C',

    // Find matches
    'editor.findMatchBackground': '#FB923C50',
    'editor.findMatchHighlightBackground': '#FB923C25',

    // Hover widget
    'editorHoverWidget.background': '#1E293B',
    'editorHoverWidget.border': '#334155',

    // Scrollbar
    'scrollbarSlider.background': '#94A3B840',
    'scrollbarSlider.hoverBackground': '#94A3B860',
    'scrollbarSlider.activeBackground': '#FB923C60',
  },
});
```

### Theme Color Mapping Reference

```typescript
// Design system color to hex conversion reference
// These are approximations - OKLCH to sRGB can vary slightly

const colorMap = {
  // Slate scale
  slate900: '#0F172A', // oklch(0.208 0.042 265.755) - editor bg
  slate800: '#1E293B', // oklch(0.279 0.041 260.031) - card/line highlight
  slate700: '#334155', // oklch(0.372 0.044 257.287) - suggest selected
  slate500: '#64748B', // oklch(0.554 0.046 257.417) - comments
  slate400: '#94A3B8', // oklch(0.704 0.04 256.788) - line numbers
  slate300: '#CBD5E1', // oklch(0.869 0.022 252.894) - operators
  slate100: '#F1F5F9', // oklch(0.968 0.007 247.896) - identifiers

  // Orange accent
  orange400: '#FB923C', // oklch(0.75 0.183 55.934) - cursor, highlights
  orange300: '#FDBA74', // oklch(0.837 0.128 66.29) - predefined
  orange600: '#EA580C', // oklch(0.646 0.222 41.116) - light mode accent

  // Syntax colors (harmonized with Slate)
  blue300: '#93C5FD', // Keywords (warm blue)
  green300: '#86EFAC', // Strings (warm green)
  amber300: '#FCD34D', // Numbers (warm amber)
};
```

## State of the Art

| Old Approach           | Current Approach         | When Changed | Impact                  |
| ---------------------- | ------------------------ | ------------ | ----------------------- |
| VS Code default colors | Design system harmonized | This phase   | Editor feels integrated |
| Blue/purple syntax     | Warm blue/green/amber    | This phase   | Matches orange accent   |
| White cursor           | Orange cursor            | This phase   | Brand consistency       |
| Blue selection         | Orange-tinted selection  | This phase   | Unified accent color    |

**Deprecated/outdated:**

- None - Monaco theming API is stable

## Open Questions

None - the theming approach is well-documented and the requirements are clear.

## Sources

### Primary (HIGH confidence)

- Monaco Editor bundled SQL tokenizer (`node_modules/monaco-editor/esm/vs/basic-languages/sql/sql.js`) - Token types verified
- VS Code editorColorRegistry.ts (GitHub) - Color token IDs verified
- Existing `monaco-sql-config.ts` - Current theme structure verified

### Secondary (MEDIUM confidence)

- Monaco Editor docs (microsoft.github.io/monaco-editor) - API structure confirmed
- VS Code color registry (GitHub raw files) - Additional token IDs

### Color Approximations

- OKLCH to sRGB conversions are approximations using standard Tailwind color values
- Actual colors may vary slightly; visual testing required

## Metadata

**Confidence breakdown:**

- Monaco API: HIGH - Verified against local package and official docs
- Token types: HIGH - Extracted directly from bundled tokenizer
- Color tokens: HIGH - Extracted from VS Code source
- Color values: MEDIUM - OKLCH to hex approximations, needs visual verification

**Research date:** 2026-01-27
**Valid until:** 90 days (Monaco theming API is stable)

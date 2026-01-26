# Technology Stack: Linear/Raycast-Style Design System Upgrade

**Project:** SQL Pro Design System Migration
**Researched:** 2026-01-26
**Focus:** CSS techniques, animation patterns, and UI tools for dark-first Linear/Raycast aesthetic

---

## Executive Summary

This research covers the specific CSS techniques, animation libraries, and design patterns needed to migrate SQL Pro from "Warm Modern" (orange + light background) to a Linear/Raycast-style interface (dark-first + minimal + refined micro-interactions).

**Key Finding:** The existing stack (React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, cmdk) is well-suited for this migration. No new major dependencies are required. The focus should be on CSS variable restructuring, animation refinement, and color system overhaul.

**Overall Confidence:** HIGH - Based on Context7 documentation for Framer Motion, Tailwind CSS, and shadcn/ui, plus verified CSS techniques.

---

## Color System: Dark-First with OKLCH

### Recommended Approach

**Use OKLCH color space** (already in use). OKLCH provides perceptually uniform colors and superior dark mode handling.

| Confidence | Technique                      | Rationale                                                                               |
| ---------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| HIGH       | OKLCH for all colors           | Already adopted by shadcn/ui; perceptually uniform; better interpolation for animations |
| HIGH       | Dark-first variable definition | Define dark mode as `:root`, light as `.light` override                                 |
| HIGH       | Alpha-based borders            | Use `oklch(1 0 0 / 10%)` instead of named colors for borders                            |

### Color Palette Structure (Linear/Raycast Style)

```css
/* Dark-first approach - :root IS dark mode */
:root {
  /* Backgrounds - Deep, rich darks with slight blue undertone */
  --background: oklch(0.13 0.02 260); /* Deep slate */
  --background-elevated: oklch(0.17 0.02 260); /* Cards, popovers */
  --background-surface: oklch(0.21 0.02 260); /* Subtle elevation */

  /* Foreground - High contrast whites */
  --foreground: oklch(0.98 0 0); /* Primary text */
  --foreground-muted: oklch(0.65 0.01 260); /* Secondary text */
  --foreground-subtle: oklch(0.45 0.01 260); /* Tertiary/disabled */

  /* Accent - Orange preserved, adjusted for dark */
  --accent: oklch(0.75 0.18 45); /* Orange 400 equivalent */
  --accent-foreground: oklch(0.15 0.02 45); /* Dark text on accent */
  --accent-muted: oklch(0.75 0.18 45 / 15%); /* Subtle accent backgrounds */

  /* Borders - Subtle alpha-based */
  --border: oklch(1 0 0 / 8%);
  --border-strong: oklch(1 0 0 / 15%);

  /* Interactive states */
  --hover: oklch(1 0 0 / 5%);
  --active: oklch(1 0 0 / 10%);
  --focus-ring: oklch(0.75 0.18 45 / 60%); /* Accent with transparency */
}

/* Light mode as override */
.light {
  --background: oklch(0.99 0.002 260);
  --background-elevated: oklch(1 0 0);
  --background-surface: oklch(0.97 0.005 260);
  --foreground: oklch(0.15 0.02 260);
  --foreground-muted: oklch(0.45 0.02 260);
  --foreground-subtle: oklch(0.65 0.01 260);
  --accent: oklch(0.65 0.2 45); /* Orange 500 for light mode */
  --border: oklch(0 0 0 / 8%);
  --border-strong: oklch(0 0 0 / 15%);
  --hover: oklch(0 0 0 / 3%);
  --active: oklch(0 0 0 / 6%);
}
```

### What NOT to Do

| Anti-Pattern                   | Why Avoid                                                  | Instead                 |
| ------------------------------ | ---------------------------------------------------------- | ----------------------- |
| HSL for design tokens          | Less perceptually uniform; poor interpolation in dark mode | Use OKLCH               |
| Named color borders            | Hard to maintain contrast across themes                    | Use alpha-based borders |
| Light-first then dark override | Forces duplication; dark mode feels like afterthought      | Dark-first approach     |
| Warm neutrals (Stone palette)  | Conflicts with Linear/Raycast cool aesthetic               | Use Slate/cool neutrals |

---

## CSS Techniques: Glassmorphism and Subtle Gradients

### Glassmorphism (Confidence: HIGH)

**Performance-conscious approach** for Electron desktop apps:

```css
/* Primary glassmorphism - use sparingly */
.glass {
  background: oklch(0.15 0.02 260 / 70%);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid oklch(1 0 0 / 10%);
}

/* Lighter glass for more elements - better performance */
.glass-subtle {
  background: oklch(0.17 0.02 260 / 85%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid oklch(1 0 0 / 8%);
}
```

**Performance Guidelines:**

- Limit `backdrop-filter` to max 3-4 elements visible at once
- Use smaller blur values (8-12px) over large (20px+)
- Never animate elements with `backdrop-filter` applied
- Provide fallback solid backgrounds for performance-constrained scenarios

### Subtle Gradients (Confidence: HIGH)

Linear/Raycast signature: gradients so subtle they're almost imperceptible.

```css
/* Card surface gradient - barely visible */
.card-gradient {
  background: linear-gradient(
    180deg,
    oklch(0.18 0.02 260) 0%,
    oklch(0.16 0.02 260) 100%
  );
}

/* Top highlight - simulates light source */
.surface-highlight {
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 5%);
}

/* Interactive glow on hover */
.glow-accent {
  box-shadow: 0 0 20px oklch(0.75 0.18 45 / 20%);
}

/* Radial glow for focus/selection */
.glow-radial {
  background: radial-gradient(
    circle at center,
    oklch(0.75 0.18 45 / 10%) 0%,
    transparent 70%
  );
}
```

### Border Techniques

```css
/* Gradient border using pseudo-element */
.gradient-border {
  position: relative;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    oklch(1 0 0 / 15%) 0%,
    oklch(1 0 0 / 5%) 50%,
    oklch(1 0 0 / 15%) 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

---

## Animation Patterns: Framer Motion

### Micro-Interactions (Confidence: HIGH)

Based on Context7 documentation for Motion/Framer Motion:

#### Spring Presets

```typescript
// Animation presets - use consistently across app
export const spring = {
  // For buttons, toggles, quick feedback
  snappy: { type: 'spring', stiffness: 400, damping: 30 },

  // For cards, modals, panels
  smooth: { type: 'spring', stiffness: 200, damping: 25 },

  // For subtle reveals, hover states
  gentle: { type: 'spring', stiffness: 100, damping: 20 },

  // For playful elements (use sparingly)
  bouncy: { type: 'spring', stiffness: 300, damping: 15 },
};
```

#### Hover Patterns

```tsx
// Button micro-interaction
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={spring.snappy}
/>

// Card hover with glow
<motion.div
  whileHover={{
    y: -2,
    boxShadow: '0 8px 30px oklch(0.75 0.18 45 / 15%)'
  }}
  transition={spring.smooth}
/>

// Icon button with rotation hint
<motion.button
  whileHover={{ rotate: 15 }}
  whileTap={{ scale: 0.9 }}
  transition={spring.snappy}
/>
```

#### Layout Animations

```tsx
// Smooth list reordering
<motion.ul layout>
  {items.map(item => (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring.gentle}
    />
  ))}
</motion.ul>

// Tab indicator sliding
<motion.div
  layoutId="activeTab"
  className="absolute bottom-0 h-0.5 bg-accent"
  transition={spring.smooth}
/>
```

#### Loading States

```tsx
// Skeleton shimmer - CSS-based for performance
.skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.2 0.02 260) 0%,
    oklch(0.25 0.02 260) 50%,
    oklch(0.2 0.02 260) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Spinner - Framer Motion
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    repeat: Infinity,
    duration: 1,
    ease: 'linear'
  }}
/>
```

### What NOT to Do with Animations

| Anti-Pattern                            | Why Avoid                    | Instead                            |
| --------------------------------------- | ---------------------------- | ---------------------------------- |
| Duration > 300ms for micro-interactions | Feels sluggish               | Keep hover/tap under 200ms         |
| Animating `width`/`height` directly     | Causes layout thrashing      | Use `transform: scale()`           |
| Bounce on every element                 | Overwhelming, unprofessional | Reserve for key moments            |
| Animation on `backdrop-filter` elements | GPU performance hit          | Animate opacity of overlay instead |
| Ignoring `prefers-reduced-motion`       | Accessibility violation      | Always check preference            |

### Accessibility: Reduced Motion

```tsx
// Hook for respecting reduced motion
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

// Conditional spring
const spring = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 400, damping: 30 };

// CSS fallback
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## UI Component Patterns

### shadcn/ui Customization (Confidence: HIGH)

shadcn/ui already uses OKLCH in 2025. Key customizations for Linear/Raycast style:

```css
/* Override default radius for sharper look */
:root {
  --radius: 0.5rem; /* 8px - Linear uses 8-10px typically */
}

/* Reduce default border visibility */
[data-slot='card'] {
  border-color: oklch(1 0 0 / 6%);
  box-shadow: 0 1px 2px oklch(0 0 0 / 5%);
}

/* Mute focus rings - more subtle than default */
:focus-visible {
  outline: 2px solid oklch(0.75 0.18 45 / 50%);
  outline-offset: 2px;
}

/* Input fields - minimal borders */
[data-slot='input'] {
  border-color: oklch(1 0 0 / 10%);
  background: oklch(0.17 0.02 260);
}

[data-slot='input']:focus {
  border-color: oklch(0.75 0.18 45 / 40%);
  box-shadow: 0 0 0 3px oklch(0.75 0.18 45 / 15%);
}
```

### Command Palette (cmdk) Styling

```css
/* cmdk Linear/Raycast style */
[cmdk-root] {
  background: oklch(0.15 0.02 260 / 95%);
  backdrop-filter: blur(20px);
  border: 1px solid oklch(1 0 0 / 10%);
  border-radius: 12px;
  box-shadow:
    0 25px 50px -12px oklch(0 0 0 / 40%),
    0 0 0 1px oklch(1 0 0 / 5%);
}

[cmdk-input] {
  background: transparent;
  border-bottom: 1px solid oklch(1 0 0 / 8%);
  padding: 16px;
  font-size: 16px;
  color: var(--foreground);
}

[cmdk-input]::placeholder {
  color: var(--foreground-subtle);
}

[cmdk-item] {
  padding: 10px 14px;
  border-radius: 8px;
  margin: 2px 4px;
  color: var(--foreground-muted);
  transition: background 100ms ease;
}

[cmdk-item][aria-selected='true'] {
  background: oklch(1 0 0 / 8%);
  color: var(--foreground);
}

[cmdk-group-heading] {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--foreground-subtle);
  padding: 8px 14px 4px;
}
```

---

## Typography

### Font Stack (Confidence: MEDIUM)

No change needed to existing Noto Sans Variable. However, for closer Linear/Raycast parity:

| Option      | Font               | Notes                                              |
| ----------- | ------------------ | -------------------------------------------------- |
| Current     | Noto Sans Variable | Good; neutral sans-serif                           |
| Alternative | Inter              | Used by many modern apps; excellent at small sizes |
| Display     | Plus Jakarta Sans  | For headings if more personality needed            |
| Monospace   | JetBrains Mono     | Already good; matches Linear's code aesthetic      |

**Recommendation:** Keep Noto Sans Variable for consistency. Focus font effort on sizing and weight refinement, not font changes.

### Font Weight Hierarchy

```css
/* Linear/Raycast use very subtle weight differences */
:root {
  --font-weight-normal: 400;
  --font-weight-medium: 500; /* Primary for labels, buttons */
  --font-weight-semibold: 600; /* Headings, emphasis */
}

/* Avoid bold (700+) except for marketing/hero text */
```

---

## Electron-Specific Considerations

### Native Vibrancy (Confidence: MEDIUM)

Electron supports macOS vibrancy but with caveats:

```typescript
// Main process
const win = new BrowserWindow({
  vibrancy: 'sidebar', // or 'under-window', 'menu'
  visualEffectState: 'active',
  backgroundColor: '#00000000', // Transparent
});
```

**Trade-offs:**

- Pro: Native feel, respects system appearance
- Con: Performance overhead; may conflict with CSS backdrop-filter
- Recommendation: Use vibrancy for sidebar/title bar only; use CSS glass elsewhere

### Performance Optimizations

```css
/* GPU compositing hints for smooth scroll */
.scroll-container {
  transform: translateZ(0);
  will-change: scroll-position;
}

/* Reduce repaints during animation */
.animated-element {
  will-change: transform, opacity;
  contain: layout style paint;
}

/* After animation completes, remove will-change */
.animated-element.settled {
  will-change: auto;
}
```

---

## Implementation Priority

### Phase 1: Color System (Foundation)

1. Restructure CSS variables to dark-first
2. Replace warm Stone palette with cool Slate
3. Update accent color for dark mode contrast
4. Migrate borders to alpha-based

### Phase 2: Visual Polish

1. Update glassmorphism classes
2. Add subtle gradient utilities
3. Refine shadow system for dark mode
4. Update focus ring styling

### Phase 3: Animation Refinement

1. Create spring preset constants
2. Standardize hover/tap animations
3. Add layout animations to lists/tabs
4. Implement reduced motion fallbacks

### Phase 4: Component Updates

1. Update shadcn/ui theme variables
2. Refine cmdk styling
3. Polish dialog/modal animations
4. Update skeleton/loading states

---

## Sources

### HIGH Confidence (Context7/Official Docs)

- Motion documentation: https://motion.dev/docs/react-transitions
- shadcn/ui theming: https://ui.shadcn.com/docs/theming
- Tailwind CSS dark mode: https://tailwindcss.com/docs/dark-mode

### MEDIUM Confidence (Verified Patterns)

- OKLCH color space adoption in modern design systems
- Spring animation parameters from Motion documentation
- glassmorphism performance considerations from web platform documentation

### LOW Confidence (General Trends)

- Linear/Raycast exact color values (proprietary)
- 2025-specific CSS features adoption rates

---

## Confidence Assessment

| Area                        | Confidence | Notes                                                              |
| --------------------------- | ---------- | ------------------------------------------------------------------ |
| Color System (OKLCH)        | HIGH       | Verified via shadcn/ui official docs using OKLCH                   |
| Animation Patterns          | HIGH       | Context7 documentation for Motion library                          |
| Glassmorphism CSS           | HIGH       | Standard CSS techniques with documented performance considerations |
| Spring Parameters           | HIGH       | Direct from Motion documentation                                   |
| Dark-first approach         | MEDIUM     | Industry trend; verified by shadcn/ui patterns                     |
| Exact Linear/Raycast values | LOW        | Proprietary; approximated from visual inspection                   |

---

## Open Questions for Later Phases

1. **Electron vibrancy vs CSS backdrop-filter:** Need runtime testing to determine optimal balance
2. **Color contrast ratios:** Verify WCAG AA compliance after color migration
3. **Animation performance on lower-end hardware:** Profile before/after
4. **cmdk animation integration:** May need custom animation wrapper for smooth open/close

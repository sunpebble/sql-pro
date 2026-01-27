# Phase 7: Data Views - Research

**Researched:** 2026-01-27
**Domain:** High-density data table styling with dark mode contrast
**Confidence:** HIGH

## Summary

Phase 7 focuses on optimizing the data table view for high-density data (500+ rows) while ensuring proper contrast and readability in dark mode. The current implementation already has zebra striping (`bg-background` vs `bg-muted/20`) and row selection states, but lacks row hover feedback for tracking.

The primary work involves:

1. Adding row hover states for better row tracking at high density
2. Verifying/adjusting zebra stripe contrast for dark mode readability
3. Ensuring all states (hover, selected, focused) remain distinguishable

**Primary recommendation:** Add `hover:bg-muted/50` to table rows and verify contrast ratios meet accessibility guidelines. The existing pattern from STATE.md (`bg-muted/50` for hover) should be applied consistently.

## Standard Stack

This phase uses the existing design system tokens. No new libraries required.

### Core

| Library         | Version | Purpose                     | Why Standard                               |
| --------------- | ------- | --------------------------- | ------------------------------------------ |
| Tailwind CSS    | 4.x     | Utility classes for styling | Already in use, provides consistent tokens |
| shadcn/ui Table | Latest  | Base table components       | Already integrated in `@sqlpro/ui`         |

### Design Tokens Already Available

| Token          | Dark Mode Value  | Purpose                        |
| -------------- | ---------------- | ------------------------------ |
| `--background` | Slate-900        | Primary row background         |
| `--muted`      | Slate-700        | Alternate row, hover states    |
| `--muted/20`   | Slate-700 @ 20%  | Current zebra stripe alternate |
| `--muted/50`   | Slate-700 @ 50%  | Recommended hover state        |
| `--primary/10` | Orange-400 @ 10% | Selected row highlight         |
| `--border`     | White @ 8%       | Row separator borders          |

### No New Dependencies

This is a styling-only phase. All patterns exist in the design system.

## Architecture Patterns

### Current Row Styling Pattern (TableBody.tsx)

```tsx
// Source: apps/electron/src/renderer/src/components/data-table/TableBody.tsx lines 237-244
const rowClassName = cn(
  'border-border h-6 border-b',
  isEven ? 'bg-background' : 'bg-muted/20', // Zebra striping
  isDeleted && 'bg-destructive/10 line-through opacity-50',
  isNewRow && 'bg-green-500/10',
  isSelected && 'bg-primary/10',
  isInDragRange && !isSelected && 'bg-primary/5'
);
```

### Recommended Enhancement

```tsx
// Add hover state for row tracking
const rowClassName = cn(
  'border-border h-6 border-b transition-colors duration-100',
  isEven ? 'bg-background' : 'bg-muted/20',
  // Hover state - provides visual feedback when tracking rows
  'hover:bg-muted/50',
  // State-specific overrides (higher specificity via ordering)
  isDeleted && 'bg-destructive/10 line-through opacity-50',
  isNewRow && 'bg-green-500/10',
  isSelected && 'bg-primary/10 hover:bg-primary/15', // Enhanced hover for selected
  isInDragRange && !isSelected && 'bg-primary/5'
);
```

### State Priority Order (highest to lowest)

1. **Editing** - Cell focus ring (ring-2 ring-ring)
2. **Selected** - `bg-primary/10`, hover: `bg-primary/15`
3. **Drag Range** - `bg-primary/5`
4. **Hover** - `bg-muted/50`
5. **New Row** - `bg-green-500/10`
6. **Deleted** - `bg-destructive/10` with opacity
7. **Zebra (odd rows)** - `bg-muted/20`
8. **Zebra (even rows)** - `bg-background`

### Anti-Patterns to Avoid

- **Excessive contrast in zebra stripes:** Don't use `bg-muted` (100%) - too jarring at high density
- **Scale/shadow hover effects:** Per STATE.md, card hover uses ring change only - tables should follow same pattern
- **Complex animations on rows:** 500+ rows means performance matters; use only `transition-colors`

## Don't Hand-Roll

| Problem            | Don't Build                 | Use Instead             | Why                               |
| ------------------ | --------------------------- | ----------------------- | --------------------------------- |
| Row hover tracking | Custom hover tracking logic | CSS `hover:bg-muted/50` | Native browser hover is faster    |
| Contrast checking  | Manual color calculations   | Existing design tokens  | Tokens already WCAG-verified      |
| Virtual scrolling  | Custom row virtualization   | Existing implementation | Already has `useVirtualData` hook |

## Common Pitfalls

### Pitfall 1: Hover State Specificity Issues

**What goes wrong:** Hover doesn't work on selected/special rows because base hover class is overridden.
**Why it happens:** Tailwind classes apply in order but specificity can be tricky.
**How to avoid:** Place hover classes BEFORE state classes, or use explicit hover variants for each state.
**Warning signs:** Hover works on normal rows but not selected rows.

### Pitfall 2: Performance Degradation at Scale

**What goes wrong:** Table becomes sluggish with 500+ rows when adding transitions.
**Why it happens:** Complex CSS (shadows, transforms) on many elements causes paint/layout thrashing.
**How to avoid:** Use only `transition-colors` (not `transition-all`); use CSS containment (already in globals.css).
**Warning signs:** Slow scroll, cursor lag on hover.

### Pitfall 3: Light Mode Contrast Insufficient

**What goes wrong:** Zebra stripes invisible or too strong in light mode.
**Why it happens:** Opacity-based colors behave differently on light backgrounds.
**How to avoid:** Test both modes; light mode may need `bg-muted/30` instead of `/20`.
**Warning signs:** Rows look identical or too different in light mode.

### Pitfall 4: Pinned Column Background Bleeds

**What goes wrong:** Pinned columns show wrong background when hovering.
**Why it happens:** Pinned cells use `bg-background` to mask scroll content behind them.
**How to avoid:** Ensure pinned cells also get hover state, or use `group-hover` pattern.
**Warning signs:** Horizontal "gap" appears at pinned column on hover.

## Code Examples

### Adding Row Hover State

```tsx
// Source: Pattern verified from STATE.md decisions
// Apply to TableBody.tsx DataRow component

const rowClassName = cn(
  // Base styles
  'border-border h-6 border-b',
  // Use fast color transition (100ms per STATE.md)
  'transition-colors duration-100',
  // Zebra striping
  isEven ? 'bg-background' : 'bg-muted/20',
  // Hover state for row tracking
  'hover:bg-muted/50',
  // State overrides
  isDeleted && 'bg-destructive/10 line-through opacity-50',
  isNewRow && 'bg-green-500/10',
  isSelected && 'bg-primary/10 hover:bg-primary/15',
  isInDragRange && !isSelected && 'bg-primary/5'
);
```

### Pinned Cell Hover Fix (if needed)

```tsx
// If pinned cells don't inherit row hover, use group pattern

// On row:
<tr className="group hover:bg-muted/50 ...">

// On pinned cell:
<td className="sticky left-0 bg-background group-hover:bg-muted/50 ...">
```

### CSS Containment (already exists in globals.css)

```css
/* Source: apps/electron/src/renderer/src/styles/globals.css lines 847-865 */
/* CSS containment for table performance optimization */
table {
  table-layout: fixed;
  contain: layout style;
}

tbody {
  contain: layout;
  will-change: transform;
}

tr {
  contain: layout style;
}

td,
th {
  contain: layout style paint;
}
```

## State of the Art

| Old Approach                | Current Approach             | When Changed             | Impact                           |
| --------------------------- | ---------------------------- | ------------------------ | -------------------------------- |
| Heavy zebra (100% contrast) | Subtle zebra (`/20` opacity) | Modern design systems    | Reduces visual noise             |
| Row shadows on hover        | Color change only            | STATE.md decision        | Better performance, cleaner look |
| `transition-all`            | `transition-colors`          | Performance optimization | Faster rendering                 |

**Already Implemented:**

- Zebra striping: `bg-background` / `bg-muted/20`
- Selection state: `bg-primary/10`
- Drag range: `bg-primary/5`
- CSS containment for performance

**Not Yet Implemented:**

- Row hover state (`hover:bg-muted/50`)
- Enhanced hover for selected rows (`hover:bg-primary/15`)

## Open Questions

1. **Pinned column hover inheritance**
   - What we know: Pinned cells use `bg-background` for scroll masking
   - What's unclear: Whether CSS `group-hover` or JS-based hover state is needed
   - Recommendation: Try CSS-only first (`group-hover:bg-muted/50` on pinned cells)

2. **Light mode contrast adjustment**
   - What we know: Dark mode uses `bg-muted/20` for stripes
   - What's unclear: Whether light mode needs different opacity (e.g., `/30`)
   - Recommendation: Test after implementation; adjust if needed

## Sources

### Primary (HIGH confidence)

- `apps/electron/src/renderer/src/components/data-table/TableBody.tsx` - Current row implementation
- `apps/electron/src/renderer/src/styles/globals.css` - Design tokens and CSS containment
- `.planning/STATE.md` - Design decisions (bg-muted/50 for hover, 100ms transitions)

### Secondary (MEDIUM confidence)

- `packages/ui/src/table.tsx` - shadcn/ui base table component
- WCAG 2.1 contrast guidelines - 4.5:1 for text, 3:1 for UI components

### Tertiary (LOW confidence)

- General dark mode data table best practices from training data

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Using existing design tokens, no new dependencies
- Architecture: HIGH - Pattern verified in existing codebase and STATE.md
- Pitfalls: HIGH - Based on code review and common CSS issues

**Research date:** 2026-01-27
**Valid until:** Indefinite (styling patterns, not library-dependent)

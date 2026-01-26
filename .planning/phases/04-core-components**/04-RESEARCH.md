# Phase 4: Core Components - Research

**Researched:** 2026-01-27
**Domain:** Button/Input/Form Component Simplification, Dark Mode Styling
**Confidence:** HIGH

## Summary

This research covers the simplification of buttons, inputs, and form controls in SQL Pro to achieve a minimal, Linear/Raycast-style aesthetic. The current implementation uses shadcn/ui components built on Base UI primitives with class-variance-authority (CVA) for variants. The components are functional but carry visual "baggage" from the original "Warm Modern" design (shadow-xs decorations, gradient effects on BrandButton, and extra visual weight).

Phase 4 focuses on two requirements:

- **VISL-02**: Simplified button design (less decoration)
- **VISL-03**: Refined input/form styling for dark mode

The key insight is that the components are already well-structured with Tailwind/CVA - the changes are primarily about removing/reducing decorative classes rather than restructuring. The `shadow-xs` class appears on inputs, checkboxes, selects, switches, and outline buttons - removing it will immediately reduce visual weight. The BrandButton (formerly GoldButton) uses heavier shadows and gradients that should be simplified.

**Primary recommendation:** Reduce decorative shadows and gradients on form controls while preserving functional styling (borders, focus rings, error states). Update BrandButton to use flat styling with subtle hover effects instead of shadows/gradients.

## Current State Analysis

### Component Inventory

| Component   | File                              | Current Decorations                           | Needs Simplification |
| ----------- | --------------------------------- | --------------------------------------------- | -------------------- |
| Button      | `packages/ui/src/button.tsx`      | `shadow-xs` on outline variant                | Yes - remove shadow  |
| BrandButton | `packages/ui/src/gold-button.tsx` | `shadow-md`, `shadow-lg`, `shadow-primary/25` | Yes - flatten design |
| Input       | `packages/ui/src/input.tsx`       | `shadow-xs`                                   | Yes - remove shadow  |
| Textarea    | `packages/ui/src/textarea.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Select      | `packages/ui/src/select.tsx`      | `shadow-xs` on trigger                        | Yes - remove shadow  |
| Checkbox    | `packages/ui/src/checkbox.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Switch      | `packages/ui/src/switch.tsx`      | `shadow-xs`                                   | Yes - remove shadow  |
| RadioGroup  | `packages/ui/src/radio-group.tsx` | `shadow-xs`                                   | Yes - remove shadow  |
| Combobox    | `packages/ui/src/combobox.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Toggle      | `packages/ui/src/toggle.tsx`      | `shadow-xs` on outline                        | Yes - remove shadow  |

### Current Button Variants

```typescript
// button.tsx variants
variant: {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  outline: '...dark:bg-input/30 dark:border-input dark:hover:bg-input/50 ...shadow-xs',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80...',
  ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50...',
  destructive: 'bg-destructive/10 hover:bg-destructive/20...',
  link: 'text-primary underline-offset-4 hover:underline',
  accent: 'border-primary bg-primary/10 text-primary hover:bg-primary/20...',
  'ghost-primary': 'text-muted-foreground hover:text-primary hover:bg-primary/10...',
}
```

**Assessment:**

- `default` variant: Already minimal - solid primary color, no shadow
- `outline` variant: Has `shadow-xs` - should be removed
- `secondary`, `ghost`, `ghost-primary`: Already minimal
- `accent`: Clean border + background - good
- `link`: Minimal underline - good

### Current BrandButton (GoldButton) Variants

```typescript
// gold-button.tsx variants
variant: {
  default: [
    'bg-primary', 'text-primary-foreground',
    'shadow-md shadow-primary/25',  // HEAVY - remove
    'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',  // HEAVY - simplify
    'active:shadow-sm',
  ],
  outline: ['bg-transparent', 'border', 'text-foreground border-border', 'hover:border-primary hover:text-primary'],
  ghost: ['bg-transparent', 'text-primary', 'hover:bg-primary/10'],
  pulse: [  // HEAVY animation - consider removal
    'bg-primary', 'text-primary-foreground',
    'shadow-lg shadow-primary/30', 'animate-pulse',
    'hover:shadow-xl hover:shadow-primary/40',
  ],
}
```

**Assessment:**

- `default`: Heavy shadows - should flatten to match regular Button default
- `outline`, `ghost`: Already minimal
- `pulse`: Very heavy, may not fit minimal aesthetic

### Current Input Styling

```typescript
// input.tsx
'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50
focus-visible:bg-background dark:focus-visible:bg-input/50
...rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow,background-color]...'
```

**Assessment:**

- `shadow-xs`: Should be removed for flat appearance
- Border and focus ring styling: Good - keep these
- Dark mode background (`dark:bg-input/30`): Good - provides subtle fill
- Focus background change: Good - provides feedback

## Target State

### Simplified Button Design (VISL-02)

**Target Characteristics:**

1. No shadows on any button variants (remove all `shadow-*` classes)
2. Flat solid or transparent backgrounds
3. Subtle hover: background opacity change only (no lift, no shadow increase)
4. Active state: slight opacity reduction, no scale transform

**Target Button Base:**

```css
/* Remove: shadow-xs, shadow-md, shadow-lg, shadow-primary/* */
/* Keep: transition-all, disabled states, focus rings */
```

**Target BrandButton (simplified to match Button default):**

```css
/* default variant - matches regular Button */
'bg-primary text-primary-foreground hover:bg-primary/90'

/* outline variant - clean border */
'border border-border text-foreground hover:border-primary hover:text-primary'

/* ghost variant - unchanged */
'bg-transparent text-primary hover:bg-primary/10'
```

### Refined Input/Form Styling (VISL-03)

**Target Characteristics:**

1. No shadows on form controls (remove `shadow-xs`)
2. Clean border that shows subtle contrast in dark mode
3. Focus state: border + ring only (no shadow)
4. Consistent height and padding across inputs

**Target Input Base:**

```css
/* Remove shadow-xs */
'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50
rounded-md border bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow]...'
```

### Orange Accent Usage (Success Criteria #3)

**Current patterns that work well:**

- Primary button: Solid `bg-primary` - Good
- Focus ring: `ring-ring/50` where `--ring: var(--orange-400)` - Good
- Ghost-primary hover: `hover:bg-primary/10` - Good

**Patterns to avoid:**

- Heavy glow effects (`shadow-primary/25+`)
- Gradient backgrounds on buttons
- Animated pulse effects on CTAs

## Architecture Patterns

### Recommended CVA Structure for Minimal Design

```typescript
const buttonVariants = cva(
  // Base: Remove shadow-xs from here if present
  'rounded-md border border-transparent text-sm font-medium transition-colors disabled:opacity-50 ...',
  {
    variants: {
      variant: {
        // All variants: no shadow classes
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        // ... etc
      },
    },
  }
);
```

### Anti-Patterns to Avoid

1. **Don't add new shadows** - Remove existing, don't add for "polish"
2. **Don't use gradient backgrounds on buttons** - Flat solid colors only
3. **Don't use scale transforms on hover** - Background change is sufficient
4. **Don't use animate-pulse for CTAs** - Too flashy for minimal aesthetic

## Don't Hand-Roll

| Problem                 | Don't Build           | Use Instead                      | Why                                        |
| ----------------------- | --------------------- | -------------------------------- | ------------------------------------------ |
| Form validation styling | Custom error classes  | Built-in `aria-invalid` patterns | Already implemented, consistent            |
| Focus management        | Custom focus handlers | `focus-visible` CSS              | Browser handles keyboard/mouse distinction |
| Disabled states         | Per-component styling | Base CVA disabled classes        | Consistent across components               |

## Common Pitfalls

### Pitfall 1: Removing Too Much Styling

**What goes wrong:** Components become indistinguishable or lose affordances
**Why it happens:** Over-zealous simplification removes functional styling
**How to avoid:** Keep borders, focus rings, and hover backgrounds - only remove decorative shadows
**Warning signs:** Users can't tell what's clickable, focus state invisible

### Pitfall 2: Breaking Dark Mode Contrast

**What goes wrong:** Inputs/buttons blend into dark background
**Why it happens:** Removing shadows without ensuring border visibility
**How to avoid:** Verify `border-input` (oklch(1 0 0 / 10%)) is visible against `--background`
**Warning signs:** Forms look flat/invisible on dark backgrounds

### Pitfall 3: Inconsistent Application

**What goes wrong:** Some components simplified, others not, creating visual inconsistency
**Why it happens:** Missing some component files in the update
**How to avoid:** Update all components in the inventory table systematically
**Warning signs:** Checkbox has shadow, input doesn't

### Pitfall 4: BrandButton/Button Confusion

**What goes wrong:** Two button components with different styling creates inconsistency
**Why it happens:** BrandButton exists for "special" CTAs but diverges visually
**How to avoid:** Simplify BrandButton to closely match Button default, differentiate by context not decoration
**Warning signs:** BrandButton looks out of place next to regular buttons

## Code Examples

### Button Variant Update (Outline)

```typescript
// Before (current)
outline: 'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs',

// After (simplified)
outline: 'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground',
// Removed: shadow-xs
```

### Input Update

```typescript
// Before (current)
'dark:bg-input/30 border-input ...shadow-xs transition-[color,box-shadow,background-color]...';

// After (simplified)
'dark:bg-input/30 border-input ...transition-[color,box-shadow,background-color]...';
// Removed: shadow-xs
```

### BrandButton Simplification

```typescript
// Before (current)
default: [
  'bg-primary', 'text-primary-foreground',
  'shadow-md shadow-primary/25',
  'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
  'active:shadow-sm',
],

// After (simplified)
default: [
  'bg-primary', 'text-primary-foreground',
  'hover:bg-primary/90',
  // All shadows removed, simple hover
],
```

### Checkbox Update

```typescript
// Before (current)
'border-input dark:bg-input/30 data-checked:bg-primary ...shadow-xs...';

// After (simplified)
'border-input dark:bg-input/30 data-checked:bg-primary ...';
// Removed: shadow-xs
```

## Files to Modify

### Primary Files (Core Component Changes)

| File                               | Changes Required                                | Priority |
| ---------------------------------- | ----------------------------------------------- | -------- |
| `packages/ui/src/button.tsx`       | Remove `shadow-xs` from outline variant         | High     |
| `packages/ui/src/gold-button.tsx`  | Remove all shadow-\* classes, simplify variants | High     |
| `packages/ui/src/input.tsx`        | Remove `shadow-xs`                              | High     |
| `packages/ui/src/textarea.tsx`     | Remove `shadow-xs`                              | High     |
| `packages/ui/src/select.tsx`       | Remove `shadow-xs` from trigger                 | High     |
| `packages/ui/src/checkbox.tsx`     | Remove `shadow-xs`                              | High     |
| `packages/ui/src/switch.tsx`       | Remove `shadow-xs`                              | High     |
| `packages/ui/src/radio-group.tsx`  | Remove `shadow-xs`                              | High     |
| `packages/ui/src/combobox.tsx`     | Remove `shadow-xs`                              | Medium   |
| `packages/ui/src/toggle.tsx`       | Remove `shadow-xs` from outline variant         | Medium   |
| `packages/ui/src/input-otp.tsx`    | Remove `shadow-xs` if present                   | Low      |
| `packages/ui/src/input-group.tsx`  | Remove `shadow-xs` if present                   | Low      |
| `packages/ui/src/button-group.tsx` | Remove `shadow-xs` if present                   | Low      |

### Secondary Files (Verify No Regressions)

- `apps/electron/src/renderer/src/styles/globals.css` - Verify utility classes still work
- Components using BrandButton/GoldButton - Verify visual appearance

## Recommended Implementation Order

### Wave 1: Button Components

1. `button.tsx` - Remove shadow from outline variant
2. `gold-button.tsx` - Flatten all variants, remove shadows/gradients

### Wave 2: Input Components

3. `input.tsx` - Remove shadow
4. `textarea.tsx` - Remove shadow
5. `select.tsx` - Remove shadow from trigger

### Wave 3: Form Controls

6. `checkbox.tsx` - Remove shadow
7. `switch.tsx` - Remove shadow
8. `radio-group.tsx` - Remove shadow

### Wave 4: Secondary Components

9. `toggle.tsx` - Remove shadow from outline
10. `combobox.tsx` - Remove shadow
11. Remaining input-related components

## Success Criteria Verification

| Criterion                                          | How to Verify                                                   |
| -------------------------------------------------- | --------------------------------------------------------------- |
| Buttons appear simpler with less decoration        | Visual comparison before/after screenshots - no shadows visible |
| Input fields look refined against dark backgrounds | Forms visible, borders subtle but distinguishable               |
| Primary actions use orange accent appropriately    | Primary buttons solid orange, not glowing or gradient           |

## Open Questions

1. **BrandButton Purpose**
   - What we know: Currently used for "special" CTAs (5 files use it)
   - What's unclear: Should it remain distinct from Button, or merge?
   - Recommendation: Simplify styling to match Button default, keep as separate component for semantic distinction

2. **Corners Property on BrandButton**
   - What we know: Adds decorative corner pseudo-elements
   - What's unclear: Is this used anywhere?
   - Recommendation: Keep property but verify it's not actively used; consider deprecation in future

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `packages/ui/src/*.tsx` components
- Phase 1-3 research: Design token decisions already implemented
- globals.css: Current design system tokens

### Secondary (MEDIUM confidence)

- Linear/Raycast design patterns: Referenced from Phase 1/3 research
- shadcn/ui conventions: CVA patterns for variant management

## Metadata

**Confidence breakdown:**

- Component inventory: HIGH - Direct codebase analysis
- Change patterns: HIGH - Well-understood Tailwind/CVA modifications
- Success criteria verification: HIGH - Visual inspection approach clear

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable patterns)

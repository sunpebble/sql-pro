# Phase 6: Dialog & Overlay Polish - Research

**Researched:** 2026-01-27
**Domain:** Glassmorphism Effects, Subtle Hover States, Loading State Design
**Confidence:** HIGH

## Summary

This research covers the premium polish for dialogs, popovers, and state feedback components in SQL Pro. The phase addresses three specific visual requirements: VISL-04 (glassmorphism on dialogs), VISL-05 (subtle hover states), and VISL-06 (minimal loading/skeleton states).

The current codebase already has foundational glassmorphism patterns in place. The overlay components (AlertDialog, Sheet, Drawer) use `supports-backdrop-filter:backdrop-blur-xs` on their backdrops, and `globals.css` defines `.glass` and `.glass-primary` utility classes with proper `backdrop-filter` properties. The primary work is applying these patterns consistently to dialog/popover content panels (not just backdrops), refining hover states to use background changes only (no scale/lift per prior decisions), and simplifying the skeleton/loading patterns.

Key insight: The project follows a dark-first design system with orange accent. All glassmorphism effects should use semi-transparent backgrounds with OKLCH colors and blur(8-12px) for optimal performance. Hover states should use `bg-muted/50` (already established in Phase 5's command.tsx patterns).

**Primary recommendation:** Apply subtle glassmorphism (`backdrop-filter: blur(8px)`) to dialog and popover content panels, standardize hover states to background-only changes using existing `bg-muted/50` pattern, and simplify skeleton states to use single `bg-muted` color with `animate-pulse`.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                  | Version | Purpose                                   | Why Standard                              |
| ------------------------ | ------- | ----------------------------------------- | ----------------------------------------- |
| Tailwind CSS             | 4.x     | Utility classes for blur, backdrop-filter | Project standard, built-in utilities      |
| Base UI React            | Latest  | Dialog, Popover, Sheet primitives         | Already in use for all overlay components |
| class-variance-authority | 0.7+    | Component variants                        | Project pattern for styling variants      |

### Supporting

| Library        | Version | Purpose             | When to Use                                                   |
| -------------- | ------- | ------------------- | ------------------------------------------------------------- |
| tw-animate-css | Latest  | Animation utilities | Entry/exit animations already in place                        |
| Framer Motion  | 11.x    | Complex animations  | Only if CSS animations insufficient (unlikely for this phase) |

### Not Needed

| Library                      | Why Not                                                   |
| ---------------------------- | --------------------------------------------------------- |
| Framer Motion for dialogs    | Base UI already provides data-open/data-closed animations |
| Custom glassmorphism library | CSS backdrop-filter is sufficient                         |

**No new installations required.** All necessary capabilities exist in current dependencies.

## Architecture Patterns

### Component Hierarchy for Overlays

```
packages/ui/src/
├── alert-dialog.tsx    # AlertDialogContent, AlertDialogOverlay
├── popover.tsx         # PopoverContent
├── dropdown-menu.tsx   # DropdownMenuContent, DropdownMenuSubContent
├── context-menu.tsx    # ContextMenuContent, ContextMenuSubContent
├── sheet.tsx           # SheetContent, SheetOverlay
├── drawer.tsx          # DrawerContent, DrawerOverlay
├── tooltip.tsx         # TooltipContent
├── hover-card.tsx      # HoverCardContent
├── command.tsx         # CommandItem (hover states)
├── skeleton.tsx        # Skeleton component
└── spinner.tsx         # Spinner component
```

### Pattern 1: Glassmorphism on Overlay Content

**What:** Apply backdrop-filter blur + semi-transparent background to dialog/popover CONTENT panels (not just overlays)
**When to use:** All floating overlay content panels
**Example:**

```tsx
// Source: MDN backdrop-filter + existing globals.css patterns
// Dark mode: semi-transparent dark background
// Light mode: semi-transparent light background

// For dialog/popover content:
className={cn(
  // Base styles
  'bg-popover/90 backdrop-blur-md',
  // Ring border for definition
  'ring-foreground/10 ring-1',
  // Other existing classes...
)}

// For overlay/backdrop (already implemented):
className={cn(
  'bg-black/10 supports-backdrop-filter:backdrop-blur-xs',
)}
```

### Pattern 2: Subtle Hover States (Background Only)

**What:** Hover states use gentle background color change, no scale/lift/shadow effects
**When to use:** All interactive items in dropdowns, menus, lists
**Example:**

```tsx
// Source: Phase 5 command.tsx pattern (already implemented)
// This pattern is ALREADY established and should be propagated

className={cn(
  // Base: no background
  'bg-transparent',
  // Hover: subtle muted background
  'hover:bg-muted/50',
  // Selected/active: accent background (orange-tinted)
  'data-selected:bg-accent data-selected:text-foreground',
  // Smooth transition
  'transition-colors duration-100 ease-out',
)}
```

### Pattern 3: Minimal Loading States

**What:** Simple pulse animation on single-color skeleton, no shimmer gradients
**When to use:** Content loading placeholders
**Example:**

```tsx
// Source: Current skeleton.tsx (already minimal)
className={cn('bg-muted animate-pulse rounded-md', className)}

// For inline loading spinners:
// Current spinner.tsx is already minimal - keep as-is
<Loader2Icon className="size-4 animate-spin" />
```

### Anti-Patterns to Avoid

- **Heavy blur values (16px+):** Performance hit on Electron; use 8-12px max
- **Animating backdrop-filter elements:** GPU performance hit; animate opacity of overlay instead
- **Scale transforms on hover:** Prior decision explicitly forbids (scale-105 only for very specific cases)
- **Multiple stacked backdrop-filter elements:** Limit to 3-4 visible at once
- **Shimmer gradients on skeletons:** Too decorative; use simple animate-pulse

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem               | Don't Build              | Use Instead                                      | Why                                               |
| --------------------- | ------------------------ | ------------------------------------------------ | ------------------------------------------------- |
| Glassmorphism utility | Custom CSS class         | Tailwind `backdrop-blur-md` + `bg-popover/90`    | Already optimized, cross-browser prefixes handled |
| Browser fallback      | Custom feature detection | `supports-backdrop-filter:` variant              | Tailwind v4 built-in support query                |
| Loading animation     | Custom keyframes         | `animate-pulse` class                            | Already defined, consistent timing                |
| Entry/exit animations | Framer Motion            | Base UI's data-open/data-closed + tw-animate-css | Already working in all overlay components         |

**Key insight:** The codebase already has well-structured animation patterns using tw-animate-css data attributes. Glassmorphism is primarily a CSS property addition, not a structural change.

## Common Pitfalls

### Pitfall 1: Backdrop-Filter Without Semi-Transparent Background

**What goes wrong:** Element with backdrop-filter has opaque background, blur effect invisible
**Why it happens:** Forgetting that blur applies to content BEHIND the element
**How to avoid:** Always pair `backdrop-blur-*` with `bg-*/90` or similar semi-transparent background
**Warning signs:** Applied blur class but no visible frosted glass effect

### Pitfall 2: Performance Degradation with Multiple Blur Elements

**What goes wrong:** Laggy UI when multiple dialogs/popovers are visible
**Why it happens:** Each backdrop-filter element requires GPU compositing
**How to avoid:** Limit to 3-4 blur elements visible simultaneously; use lower blur values (8px vs 16px)
**Warning signs:** Frame drops during dialog open/close animations

### Pitfall 3: Inconsistent Hover States Across Components

**What goes wrong:** Some items have scale, some have lift, some have background change
**Why it happens:** Different components implemented at different times with different patterns
**How to avoid:** Audit all interactive items; standardize to `hover:bg-muted/50` pattern
**Warning signs:** Visual inconsistency when moving between different menus/lists

### Pitfall 4: Webkit Prefix Missing

**What goes wrong:** Glassmorphism works in Chromium but fails in Safari/older Electron
**Why it happens:** Safari requires `-webkit-backdrop-filter` prefix
**How to avoid:** Use Tailwind utilities (handles prefixes) or ensure both properties in custom CSS
**Warning signs:** Effect works in dev but not in production build

### Pitfall 5: Focus Ring Visibility on Glass Elements

**What goes wrong:** Focus rings become invisible against blurred background
**Why it happens:** Ring color too subtle on semi-transparent surfaces
**How to avoid:** Ensure `ring-foreground/10` or stronger contrast; test keyboard navigation
**Warning signs:** Can't see focus state when tabbing through glassmorphic panels

## Code Examples

Verified patterns from official sources and existing codebase:

### Glassmorphism for Dialog Content

```tsx
// Source: MDN backdrop-filter + existing globals.css .glass pattern
// Apply to AlertDialogContent, SheetContent, PopoverContent, etc.

function DialogContent({ className, ...props }) {
  return (
    <DialogPrimitive.Popup
      className={cn(
        // Base layout (existing)
        'fixed z-50 grid w-full max-w-lg gap-4 p-6',
        // Glassmorphism: semi-transparent + blur
        'bg-popover/90 backdrop-blur-md',
        // Border for definition on glass
        'ring-foreground/10 ring-1',
        // Rounded corners (12px max per prior decisions)
        'rounded-xl',
        // Shadow for depth
        'shadow-lg',
        // Existing animations (keep as-is)
        'data-open:animate-in data-closed:animate-out',
        'data-closed:fade-out-0 data-open:fade-in-0',
        'data-closed:zoom-out-95 data-open:zoom-in-95',
        className
      )}
      {...props}
    />
  );
}
```

### Standard Hover State for Menu Items

```tsx
// Source: Phase 5 command.tsx, dropdown-menu.tsx patterns
// Standardized across all interactive items

function MenuItem({ className, ...props }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        // Base
        'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
        // Hover: background change only (no scale/lift)
        'hover:bg-muted/50',
        // Focus/selected: accent background (orange-tinted)
        'focus:bg-accent focus:text-accent-foreground',
        // Transition
        'transition-colors duration-100 ease-out',
        // Disabled
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
```

### Minimal Skeleton Component

```tsx
// Source: Current skeleton.tsx (already correct pattern)
// No changes needed - document for reference

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Single color, no gradient
        'bg-muted',
        // Simple pulse animation
        'animate-pulse',
        // Rounded for soft appearance
        'rounded-md',
        className
      )}
      {...props}
    />
  );
}
```

### Backdrop Overlay with Blur Fallback

```tsx
// Source: Current sheet.tsx, alert-dialog.tsx (already implemented)
// Document the @supports pattern

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        // Base overlay color
        'bg-black/10',
        // Blur only if browser supports it
        'supports-backdrop-filter:backdrop-blur-xs',
        // Animation
        'data-open:animate-in data-closed:animate-out',
        'data-closed:fade-out-0 data-open:fade-in-0',
        className
      )}
      {...props}
    />
  );
}
```

## State of the Art

| Old Approach               | Current Approach               | When Changed     | Impact                          |
| -------------------------- | ------------------------------ | ---------------- | ------------------------------- |
| Solid opaque dialogs       | Semi-transparent glassmorphism | 2023+            | More premium, modern feel       |
| Scale/lift hover effects   | Background-only hover          | Phase 4 decision | Consistent, subtle interactions |
| Shimmer skeleton gradients | Simple pulse animation         | 2024+            | Minimal, less distracting       |
| Heavy box-shadows          | Blur + ring borders            | 2024+            | Softer, more integrated look    |

**Deprecated/outdated patterns to avoid:**

- Heavy drop shadows on dialogs (too "floaty")
- Scale transforms on menu items (too playful for professional app)
- Complex skeleton shimmer (too decorative, distracting)
- Solid white dialog backgrounds (feels dated, lacks depth)

## Implementation Notes

### Files to Modify

**Priority 1: Dialog/Overlay Content Panels**
| File | Component | Change |
|------|-----------|--------|
| `packages/ui/src/alert-dialog.tsx` | AlertDialogContent | Add `bg-popover/90 backdrop-blur-md` |
| `packages/ui/src/sheet.tsx` | SheetContent | Add `bg-background/90 backdrop-blur-md` |
| `packages/ui/src/popover.tsx` | PopoverContent | Add `bg-popover/90 backdrop-blur-md` |
| `packages/ui/src/dropdown-menu.tsx` | DropdownMenuContent | Add `bg-popover/90 backdrop-blur-md` |
| `packages/ui/src/context-menu.tsx` | ContextMenuContent | Add `bg-popover/90 backdrop-blur-md` |
| `packages/ui/src/tooltip.tsx` | TooltipContent | Add `bg-popover/95 backdrop-blur-sm` (lighter) |
| `packages/ui/src/hover-card.tsx` | HoverCardContent | Add `bg-popover/90 backdrop-blur-md` |

**Priority 2: Hover State Standardization**
| File | Component | Change |
|------|-----------|--------|
| `packages/ui/src/card.tsx` | Card | Remove `hover:scale-[1.01] hover:shadow-md`, add `hover:bg-muted/50` |
| `packages/ui/src/dropdown-menu.tsx` | DropdownMenuItem | Verify `hover:bg-muted/50` pattern (may already be correct via focus:bg-accent) |
| `packages/ui/src/context-menu.tsx` | ContextMenuItem | Same as dropdown |

**Priority 3: Loading States (Already Minimal)**
| File | Component | Change |
|------|-----------|--------|
| `packages/ui/src/skeleton.tsx` | Skeleton | Verify minimal (already correct) |
| `packages/ui/src/spinner.tsx` | Spinner | Verify minimal (already correct) |

### Performance Considerations

```css
/* Safe blur values for Electron performance */
backdrop-blur-xs: blur(4px)   /* Lightest - overlays */
backdrop-blur-sm: blur(8px)   /* Moderate - tooltips */
backdrop-blur-md: blur(12px)  /* Standard - dialogs */
backdrop-blur-lg: blur(16px)  /* Avoid - performance hit */
backdrop-blur-xl: blur(24px)  /* Never use */
```

### Browser Support

`backdrop-filter` is **Baseline 2024** - works across all modern browsers including:

- Chrome 76+ (Electron ships Chromium)
- Safari 9+ (with -webkit prefix, handled by Tailwind)
- Firefox 103+

The `supports-backdrop-filter:` Tailwind variant provides graceful fallback.

## Open Questions

1. **Drawer.tsx uses Vaul library, not Base UI**
   - What we know: DrawerContent has different API than other dialogs
   - What's unclear: Whether glassmorphism applies consistently with Vaul
   - Recommendation: Test Vaul drawer with same patterns; may need adjustment

2. **Card hover interaction intent**
   - What we know: Current Card has `hover:scale-[1.01] hover:shadow-md`
   - What's unclear: Is this intentional for "click to expand" cards vs "container" cards?
   - Recommendation: Remove for consistency unless specific use case identified

## Sources

### Primary (HIGH confidence)

- MDN Web Docs - backdrop-filter property (https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- Current codebase analysis - globals.css glassmorphism utilities (lines 997-1032)
- Current codebase analysis - overlay component implementations
- Phase 4 Research - established shadow removal patterns
- Phase 5 Research - established hover state patterns

### Secondary (MEDIUM confidence)

- Tailwind CSS v4 documentation - backdrop-blur utilities
- Base UI documentation - Dialog/Popover animation patterns

### Tertiary (LOW confidence)

- Linear/Raycast design pattern references (general aesthetic direction)

## Metadata

**Confidence breakdown:**

- Glassmorphism implementation: HIGH - MDN verified, existing codebase patterns
- Hover state patterns: HIGH - Already established in Phase 4/5, documented in code
- Skeleton patterns: HIGH - Current implementation already minimal
- Performance guidelines: MEDIUM - Based on general web platform knowledge

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable CSS patterns)

---
phase: 06-dialog-overlay-polish
plan: 03
subsystem: ui-components
tags:
  - card
  - skeleton
  - spinner
  - hover-states
  - loading-states

dependency-graph:
  requires:
    - phase-04 (flat form styling decisions)
    - phase-05 (interaction transitions)
  provides:
    - Subtle card hover states
    - Verified minimal loading components
  affects:
    - Any future Card usage

tech-stack:
  patterns:
    - background/ring-only hover states
    - single-color pulse loading
    - minimal spin animation

file-tracking:
  key-files:
    modified:
      - packages/ui/src/card.tsx

decisions:
  - id: hover-no-scale
    summary: Card uses ring color change only, no scale/shadow lift
    reasoning: Per Phase 4/5 decisions, hover effects should be subtle for professional aesthetic

metrics:
  duration: 2 min
  completed: 2026-01-27
---

# Phase 06 Plan 03: Card Hover and Loading States Summary

**One-liner:** Removed scale/shadow hover from Card, verified Skeleton and Spinner are minimal

## What Was Done

### Task 1: Card Hover State Cleanup

Removed playful hover effects from Card component to align with professional aesthetic:

**Before:**

```tsx
className={cn(
  '... transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-md ...',
  className
)}
```

**After:**

```tsx
className={cn(
  '... transition-colors duration-200 ease-out ...',
  className
)}
```

**Changes:**

- Removed `hover:scale-[1.01]` - no more scale animation
- Removed `hover:shadow-md` - no more shadow lift
- Changed `transition-all` to `transition-colors` - only color transitions animate
- Kept `hover:ring-primary/20` - subtle ring color change provides feedback

### Task 2: Loading Component Verification

Verified both loading components are already minimal (no changes needed):

**Skeleton (`skeleton.tsx`):**

```tsx
className={cn('bg-muted animate-pulse rounded-md', className)}
```

- Single color (`bg-muted`) - no shimmer gradients
- Simple animation (`animate-pulse`) - standard Tailwind fade
- Soft corners (`rounded-md`)

**Spinner (`spinner.tsx`):**

```tsx
<Loader2Icon className={cn('size-4 animate-spin', className)} />
```

- Uses `Loader2Icon` from lucide-react
- Simple rotation (`animate-spin`)
- Minimal size (`size-4`)

## Verification Results

| Check                        | Result |
| ---------------------------- | ------ |
| No `hover:scale` in Card     | PASS   |
| No `hover:shadow-md` in Card | PASS   |
| `transition-colors` in Card  | PASS   |
| `hover:ring-primary` in Card | PASS   |
| Skeleton has `bg-muted`      | PASS   |
| Skeleton has `animate-pulse` | PASS   |
| Spinner has `animate-spin`   | PASS   |
| Spinner uses `Loader2Icon`   | PASS   |
| TypeScript check passes      | PASS   |

## Commits

| Hash     | Type | Description                             |
| -------- | ---- | --------------------------------------- |
| a6b5b426 | fix  | Remove scale and shadow hover from Card |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

The decision to remove scale and shadow lift effects from Card aligns with the flat, minimal aesthetic established in Phase 4 (form flattening) and Phase 5 (interaction transitions). Professional database tools like Linear and Raycast use subtle hover feedback rather than playful animations.

## Success Criteria Met

- [x] Card hover state is background/ring only (no scale, no shadow lift)
- [x] Card uses `transition-colors` for smooth ring color transition
- [x] Skeleton is minimal (single color + pulse)
- [x] Spinner is minimal (single icon + spin)
- [x] No TypeScript errors

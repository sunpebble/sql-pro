---
phase: 11
plan: 01
subsystem: website
tags: [animation, scroll, intersection-observer, ux]
dependency-graph:
  requires: [phase-10]
  provides: [useInView-hook, scroll-animations]
  affects: [future-website-sections]
tech-stack:
  added: []
  patterns: [intersection-observer-hook, transition-based-animation]
key-files:
  created:
    - apps/website/src/hooks/useInView.ts
  modified:
    - apps/website/src/components/Download.tsx
    - apps/website/src/components/Download.css
    - apps/website/src/components/Features.tsx
    - apps/website/src/components/Features.css
decisions: []
metrics:
  duration: 6min
  completed: 2026-01-27
---

# Phase 11 Plan 01: Scroll Animations Summary

Scroll-triggered fade-up animations for Download and Features sections using reusable useInView hook.

## Objective

Add scroll-triggered fade-up animations to website sections, creating a polished, premium feel matching Linear/Raycast level of refinement.

## Completed Tasks

| Task | Name                                                           | Commit  |
| ---- | -------------------------------------------------------------- | ------- |
| 1    | Create useInView hook and convert Download to scroll-triggered | 66b8c1b |
| 2    | Add Features header scroll animation                           | 9a93a13 |

## Changes Made

### Task 1: useInView Hook and Download Animation

**Created `apps/website/src/hooks/useInView.ts`:**

- Reusable IntersectionObserver hook
- Parameters: threshold (0.2), rootMargin (-50px), triggerOnce (true)
- Returns: { ref, isInView } for component integration
- Typed generically for any HTMLElement

**Updated `apps/website/src/components/Download.tsx`:**

- Imported useInView hook
- Added contentRef and isInView state
- Added visible class toggle on download-content div

**Updated `apps/website/src/components/Download.css`:**

- Converted from CSS keyframe animation to transition-based
- Initial state: opacity 0, translateY(30px)
- Visible state: opacity 1, translateY(0)
- 0.6s duration with var(--ease-out) timing
- Reduced motion: instant visibility, no transition

### Task 2: Features Header Animation

**Updated `apps/website/src/components/Features.tsx`:**

- Imported useInView hook
- Added headerRef and headerVisible state
- Added visible class toggle on features-header element

**Updated `apps/website/src/components/Features.css`:**

- Added scroll animation for .features-header
- Same timing: 0.6s var(--ease-out), translateY(30px)
- Added to reduced motion media query

## Technical Details

### Animation Pattern

- **Transition-based** (not CSS keyframe): Allows IntersectionObserver to control animation start
- **Consistent timing**: All sections use 0.6s ease-out, 30px translateY
- **triggerOnce: true**: Animation plays once, element stays visible

### Accessibility

- All animations respect `prefers-reduced-motion: reduce`
- Reduced motion users see instant visibility, no transitions

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] Download section animates only when scrolled into view
- [x] Features header animates when scrolled into view (before cards)
- [x] All animations respect prefers-reduced-motion
- [x] Consistent animation timing (0.6s ease-out)
- [x] useInView hook is reusable
- [x] No new dependencies (native IntersectionObserver)
- [x] Build passes

## Next Phase Readiness

Phase 11 complete. useInView hook available for any future sections needing scroll-triggered animations.

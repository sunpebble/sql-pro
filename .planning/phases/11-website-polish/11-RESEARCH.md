# Phase 11: Website Polish - Research

**Researched:** 2026-01-27
**Domain:** Scroll-triggered animations, CSS transitions, accessibility (reduced motion)
**Confidence:** HIGH

## Summary

Phase 11 focuses on adding refined scroll-triggered animations and ensuring a cohesive, polished user experience for the SQL Pro website. Research reveals that the website already has substantial animation infrastructure in place, including CSS keyframes (`fade-up`, `fade-in`, `scale-in`), utility classes, motion CSS variables, and a working `prefers-reduced-motion` media query.

The Features section already implements IntersectionObserver-based scroll animations with staggered reveal. The Hero and Download sections use entry animations but trigger on page load, not scroll. The primary work involves:

1. Converting Download section to scroll-triggered animation
2. Adding scroll-triggered animations to section headers (Features, Download)
3. Ensuring consistent animation timing and easing across all sections
4. Verifying reduced-motion support is comprehensive

**Primary recommendation:** Use native IntersectionObserver with a reusable hook pattern (matching Features.tsx approach) rather than adding Framer Motion to the website bundle, since the CSS animations and current implementation are already effective.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                         | Version        | Purpose                                       | Why Standard                                               |
| ------------------------------- | -------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Native IntersectionObserver API | Browser native | Detect element visibility for scroll triggers | Zero bundle size, performant, already used in Features.tsx |
| CSS @keyframes                  | CSS native     | Define animation sequences                    | Already defined in index.css (fade-up, scale-in, etc.)     |
| CSS custom properties           | CSS native     | Control animation timing/easing               | Already configured (--ease-out, --duration-normal, etc.)   |

### Supporting

| Library               | Version       | Purpose                          | When to Use                                                               |
| --------------------- | ------------- | -------------------------------- | ------------------------------------------------------------------------- |
| framer-motion         | 12.29.0       | Complex animations with physics  | Already installed in monorepo, but avoid for website to keep bundle small |
| useReducedMotion hook | framer-motion | Detect reduced motion preference | If using Framer Motion animations                                         |

### Alternatives Considered

| Instead of                  | Could Use                   | Tradeoff                                                         |
| --------------------------- | --------------------------- | ---------------------------------------------------------------- |
| Native IntersectionObserver | Framer Motion whileInView   | Framer adds ~20-40KB to bundle; website is simple enough for CSS |
| Native IntersectionObserver | react-intersection-observer | Would add dependency; native API is sufficient                   |
| CSS animations              | Framer Motion               | More control but unnecessary overhead for fade-up effects        |

**Installation:**

```bash
# No new dependencies needed - all tools already available
```

## Architecture Patterns

### Recommended Project Structure

```
apps/website/src/
├── hooks/
│   └── useInView.ts           # Reusable scroll visibility hook
├── components/
│   ├── Hero.tsx               # Entry animations (page load)
│   ├── Features.tsx           # Already has scroll animations
│   ├── Download.tsx           # Needs scroll animation
│   └── Footer.tsx             # Minimal, no animation needed
└── index.css                  # Animation keyframes & utilities
```

### Pattern 1: Reusable useInView Hook

**What:** A custom React hook wrapping IntersectionObserver for scroll-triggered visibility detection
**When to use:** Any element that should animate when scrolling into view
**Example:**

```typescript
// Source: MDN IntersectionObserver API + Features.tsx pattern
import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView(options: UseInViewOptions = {}) {
  const {
    threshold = 0.2,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
  } = options;
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}
```

### Pattern 2: CSS-Driven Animation Classes

**What:** Toggle visibility classes that trigger CSS animations
**When to use:** Simple fade-up/scale-in effects
**Example:**

```css
/* Source: Current index.css pattern */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.6s var(--ease-out),
    transform 0.6s var(--ease-out);
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Reduced motion - instant visibility */
@media (prefers-reduced-motion: reduce) {
  .animate-on-scroll {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### Pattern 3: Staggered Children Animation

**What:** Child elements animate with incremental delays
**When to use:** Grid items, list items, feature cards
**Example:**

```tsx
// Source: Features.tsx current implementation
{
  features.map((feature, index) => (
    <div
      key={feature.key}
      className={`bento-item ${visibleCards.has(index) ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* content */}
    </div>
  ));
}
```

### Anti-Patterns to Avoid

- **Animating layout properties:** Never animate `width`, `height`, `top`, `left` directly. Use `transform` and `opacity` only for GPU acceleration.
- **Missing reduced-motion fallback:** Every animated element MUST have `@media (prefers-reduced-motion: reduce)` handling.
- **Over-animating:** Footer and navigation should NOT have scroll animations - they distract from content.
- **Long durations:** Keep animations under 600ms; 400-500ms is ideal for fade-up effects.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build                                       | Use Instead                                                      | Why                                                         |
| -------------------------- | ------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Scroll detection           | Scroll event listeners with getBoundingClientRect | IntersectionObserver API                                         | Scroll events block main thread; IO is async and performant |
| Reduced motion detection   | Manual window.matchMedia checks                   | CSS `@media (prefers-reduced-motion)` or `useReducedMotion` hook | CSS handles it automatically; hook available if needed      |
| Animation timing functions | Custom bezier curves                              | CSS variables (`--ease-out`, `--ease-spring`)                    | Already defined, consistent across site                     |
| Stagger delays             | Complex JavaScript timing                         | CSS `transition-delay` with inline styles                        | Simpler, declarative, works with reduced motion             |

**Key insight:** The website's animation infrastructure is already well-established. The primary work is extending existing patterns to Download section and ensuring consistency, not building new systems.

## Common Pitfalls

### Pitfall 1: Animation on Every Scroll

**What goes wrong:** Elements re-animate every time they scroll in/out of view
**Why it happens:** Not using `triggerOnce` option or `unobserve()` after first intersection
**How to avoid:** Always unobserve elements after first animation trigger (unless continuous animation is intentional)
**Warning signs:** Page feels "busy" when scrolling up and down

### Pitfall 2: Flash of Unstyled Content (FOUC)

**What goes wrong:** Elements briefly visible at full opacity before animation starts
**Why it happens:** Initial CSS not setting `opacity: 0` or JavaScript loading slowly
**How to avoid:** Set initial hidden state in CSS (not just JS), use `animation-fill-mode: forwards`
**Warning signs:** Brief flash when page loads

### Pitfall 3: Ignoring Reduced Motion

**What goes wrong:** Users with vestibular disorders experience discomfort
**Why it happens:** Developers forget or don't test `prefers-reduced-motion`
**How to avoid:** Use CSS media query fallbacks; test with system reduced motion enabled
**Warning signs:** Animations run without any reduced motion check

### Pitfall 4: Animation Jank on Low-End Devices

**What goes wrong:** Animations stutter or freeze
**Why it happens:** Animating non-composited properties, too many simultaneous animations
**How to avoid:** Only animate `transform` and `opacity`; limit concurrent animations to 6-8 elements
**Warning signs:** Dropped frames, stuttering on scroll

### Pitfall 5: Inconsistent Easing

**What goes wrong:** Some elements feel "snappy" while others feel "sluggish"
**Why it happens:** Different easing functions used across components
**How to avoid:** Use centralized CSS variables (`--ease-out`, `--duration-normal`)
**Warning signs:** Animations don't feel cohesive

## Code Examples

Verified patterns from official sources:

### IntersectionObserver with Threshold

```typescript
// Source: MDN IntersectionObserver API
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2, // 20% of element visible
    rootMargin: '0px 0px -50px 0px', // Trigger 50px before fully in view
  }
);

document.querySelectorAll('.animate-on-scroll').forEach((el) => {
  observer.observe(el);
});
```

### Reduced Motion CSS Pattern

```css
/* Source: MDN prefers-reduced-motion */
/* Default: with motion */
.section-content {
  opacity: 0;
  transform: translateY(30px);
  animation: fade-up 0.6s var(--ease-out) forwards;
}

/* Reduced motion: instant display, opacity fade only acceptable */
@media (prefers-reduced-motion: reduce) {
  .section-content {
    opacity: 1;
    transform: none;
    animation: none;
    /* OR use very short fade if needed */
    /* animation: fade-in 0.1s ease forwards; */
  }
}
```

### Animation Keyframe (Already in index.css)

```css
/* Source: Current index.css */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### React Hook with IntersectionObserver

```tsx
// Source: Features.tsx (existing implementation)
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute('data-index'));
        if (entry.isIntersecting) {
          setVisibleCards((prev) => new Set([...prev, index]));
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
  );

  cardsRef.current.forEach((card) => {
    if (card) observer.observe(card);
  });

  return () => observer.disconnect();
}, []);
```

## State of the Art

| Old Approach                           | Current Approach           | When Changed            | Impact                            |
| -------------------------------------- | -------------------------- | ----------------------- | --------------------------------- |
| Scroll event listeners                 | IntersectionObserver       | 2017+ (IE Edge support) | 10-100x better performance        |
| jQuery animate                         | CSS animations/transitions | 2015+                   | Smaller bundles, GPU acceleration |
| Manual motion checks                   | CSS prefers-reduced-motion | 2019+ (Safari 10.1)     | Automatic accessibility           |
| Animation libraries for simple effects | Native CSS + IO            | 2020+                   | Smaller bundles, better perf      |

**Deprecated/outdated:**

- jQuery animations: Replaced by CSS transitions
- scroll event + getBoundingClientRect: Replaced by IntersectionObserver
- requestAnimationFrame loops for visibility: Replaced by IntersectionObserver

## Open Questions

Things that couldn't be fully resolved:

1. **Hero section scroll animation?**
   - What we know: Hero is above the fold, uses entry animation on page load
   - What's unclear: Should it have any scroll-triggered elements (e.g., parallax on screenshot)?
   - Recommendation: Keep Hero as entry-only animation; scroll animations on below-fold sections

2. **Footer animation?**
   - What we know: Footer is minimal, currently has no animation
   - What's unclear: Should footer fade in on scroll?
   - Recommendation: No animation - footer should be instantly visible when scrolled to

## Sources

### Primary (HIGH confidence)

- MDN IntersectionObserver API - Full API reference, options, best practices
- MDN prefers-reduced-motion - Accessibility media query usage
- Current codebase (Features.tsx, index.css) - Established patterns

### Secondary (MEDIUM confidence)

- Framer Motion useReducedMotion pattern (packages/ui/src/resizable-table.tsx) - React integration example

### Tertiary (LOW confidence)

- General web animation performance patterns - Based on training data

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Native APIs with excellent browser support, already used in codebase
- Architecture: HIGH - Patterns directly from existing Features.tsx implementation
- Pitfalls: HIGH - Well-documented issues, verified with MDN and codebase review

**Research date:** 2026-01-27
**Valid until:** 2026-03-27 (60 days - stable APIs, unlikely to change)

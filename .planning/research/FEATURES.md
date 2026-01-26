# Feature Landscape: Linear/Raycast Design System

**Domain:** Database Management Desktop App + Marketing Website
**Researched:** 2026-01-26
**Overall Confidence:** HIGH (based on direct analysis of Linear.app, Raycast.com, and cmdk library)

---

## Executive Summary

Linear/Raycast style represents the pinnacle of developer-focused UI design: dark-mode-first, keyboard-centric, minimal visual hierarchy, and obsessively refined micro-interactions. This aesthetic prioritizes speed, focus, and professionalism over warmth and approachability.

The transition from "Warm Modern" (orange accents, warm whites, large rounded corners) to Linear/Raycast style requires fundamental shifts in color philosophy, interaction patterns, and visual density.

---

## Table Stakes

Features users **expect** in a Linear/Raycast-style interface. Missing = product feels out of place.

| Feature                             | Why Expected                                                               | Complexity | Notes                                                               |
| ----------------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| **Dark mode as default**            | The defining characteristic; Linear defaults to dark, Raycast is dark-only | Low        | Not just "supported" but designed dark-first, light as afterthought |
| **Command palette (Cmd+K)**         | Signature interaction pattern; instant access to all actions               | Medium     | Use cmdk library; must be fast, fuzzy-searchable                    |
| **Keyboard shortcuts visible**      | Shortcuts displayed inline with menu items                                 | Low        | Badge/kbd elements showing shortcuts next to every action           |
| **Minimal chrome/decoration**       | Reduced visual noise; content > decoration                                 | Low        | No ornamental elements, shadows used sparingly                      |
| **Subtle borders (near-invisible)** | Borders at 5-10% opacity, not solid lines                                  | Low        | Use `oklch(1 0 0 / 6%)` style transparent borders                   |
| **Deep, neutral backgrounds**       | Near-black backgrounds (#0F172A, #121212, not pure #000)                   | Low        | Slate 900 or similar; never pure black                              |
| **High-contrast text hierarchy**    | Clear Primary/Secondary/Muted text levels                                  | Low        | Primary near-white, secondary ~70% opacity, muted ~50%              |
| **System font or Inter**            | Clean, neutral sans-serif                                                  | Low        | Inter or Inter Variable is the de-facto standard                    |
| **Monospace for code/technical**    | JetBrains Mono or similar for code elements                                | Low        | Used for SQL, shortcuts, technical labels                           |
| **Consistent spacing system**       | 4px or 8px grid-based spacing                                              | Low        | Tight, consistent padding throughout                                |
| **Smooth 150-200ms transitions**    | Subtle, professional transition timing                                     | Low        | ease-out curve, never jarring                                       |
| **Focus rings keyboard-only**       | `:focus-visible` not `:focus`                                              | Low        | No focus rings on mouse click                                       |
| **Reduced motion support**          | Respect `prefers-reduced-motion`                                           | Low        | Accessibility requirement                                           |
| **Skip navigation link**            | Keyboard accessibility                                                     | Low        | "Skip to content" for screen readers                                |

### Design Tokens (Table Stakes)

```css
/* Background hierarchy (dark mode) */
--bg-base: oklch(0.13 0.02 265); /* ~#0F172A - Slate 900 */
--bg-elevated: oklch(0.18 0.02 265); /* ~#1E293B - Slate 800 */
--bg-overlay: oklch(0.23 0.02 265); /* ~#334155 - Slate 700 */

/* Text hierarchy */
--text-primary: oklch(0.97 0.002 250); /* Near white */
--text-secondary: oklch(0.7 0.01 250); /* 70% - for descriptions */
--text-muted: oklch(0.55 0.015 250); /* 55% - for placeholders */

/* Borders */
--border-subtle: oklch(1 0 0 / 6%);
--border-default: oklch(1 0 0 / 10%);
--border-strong: oklch(1 0 0 / 15%);

/* Accent (single, muted) */
--accent: oklch(0.65 0.15 145); /* Muted green or blue */
```

---

## Differentiators

Features that **elevate** the product beyond basic Linear/Raycast aesthetic. Not expected, but valued.

| Feature                           | Value Proposition                            | Complexity | Notes                                             |
| --------------------------------- | -------------------------------------------- | ---------- | ------------------------------------------------- |
| **Gradient text for headlines**   | Premium, modern feel; Linear signature       | Low        | `background-clip: text` with subtle gradient      |
| **Glass/blur effects**            | Depth and sophistication (Raycast signature) | Medium     | `backdrop-filter: blur()` on overlays, popovers   |
| **Animated list heights**         | Polished command palette feel                | Medium     | cmdk's `--cmdk-list-height` with CSS transition   |
| **Performance-aware animations**  | Enhanced animations on capable hardware      | Medium     | Check `navigator.hardwareConcurrency > 4`         |
| **Contextual command palette**    | Commands change based on current view        | High       | Different commands for table view vs query editor |
| **Vim-style navigation**          | j/k for up/down, g+g for top                 | Medium     | Power-user appeal, matches Linear                 |
| **Staggered fade-in animations**  | Sections reveal sequentially                 | Low        | `animation-delay` with stagger classes            |
| **Noise texture overlay**         | Subtle grain for depth                       | Low        | SVG noise filter at 3-5% opacity                  |
| **Spotlight/radial gradients**    | Hero sections with glow effects              | Low        | Radial gradient backgrounds                       |
| **Custom scrollbar styling**      | Minimal, auto-hiding scrollbars              | Low        | macOS-style thin scrollbars                       |
| **Real-time search highlighting** | Characters highlighted in results            | Medium     | cmdk supports this pattern                        |
| **Breadcrumb navigation**         | Hierarchical context display                 | Low        | Shows current location in app                     |
| **Shortcut learning prompts**     | "Tip: Press Cmd+K" tooltips                  | Low        | Onboarding for keyboard-first                     |
| **Command history/recents**       | Recently used commands at top                | Medium     | Local storage for command history                 |
| **Theme variants**                | Dark, Light, System, "Glass"                 | Medium     | Linear offers glass variant                       |

### Animation Specifications (Differentiators)

```css
/* Fade-up entrance */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale-in for dialogs */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Timing */
--duration-fast: 100ms;
--duration-normal: 150ms;
--duration-slow: 200ms;
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Anti-Features

Features to **explicitly NOT build**. These break the Linear/Raycast aesthetic.

| Anti-Feature                       | Why Avoid                                      | What to Do Instead                                |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **Warm color palette**             | Orange, amber, warm whites feel casual/playful | Use cool slate/gray neutrals, muted accent colors |
| **Large rounded corners (20px+)**  | Feels soft, consumer-app-like                  | Use 8-12px border-radius max; Linear uses ~12px   |
| **Colored backgrounds**            | Distracts from content                         | Deep neutrals only; color for accents only        |
| **Heavy shadows**                  | Dated, heavy visual weight                     | Subtle or no shadows; use borders for separation  |
| **Gradient buttons**               | Consumer/marketing aesthetic                   | Solid accent color buttons, minimal styling       |
| **Animated hover glow/pulse**      | Distracting, unprofessional                    | Subtle opacity/background changes only            |
| **Warm-tinted shadows**            | Part of "Warm Modern" identity                 | Cool gray or pure black shadows if any            |
| **Decorative elements**            | Hexagons, patterns, flourishes                 | Clean, minimal; content is the decoration         |
| **Emoji in UI**                    | Too casual for professional tools              | Text or icons only                                |
| **Floating dock navigation**       | Mobile-first pattern                           | Linear uses fixed sidebar or command palette      |
| **Art deco/geometric decorations** | Current "Warm Modern" uses these               | Remove entirely                                   |
| **Welcome/splash screens**         | Slows down power users                         | Instant app start; settings accessible via Cmd+K  |
| **Multiple accent colors**         | Visual chaos                                   | Single accent color (green, blue, or purple)      |
| **Busy loading states**            | Complex spinners, animations                   | Minimal skeleton or simple spinner                |
| **Card hover lift effects**        | translateY on hover is overused                | Subtle border/background color change instead     |

---

## Feature Dependencies

```
Command Palette (Cmd+K)
├── requires: Keyboard event handling
├── requires: Fuzzy search implementation (cmdk library)
├── enables: All other keyboard shortcuts
└── enables: Contextual actions

Dark Mode First
├── requires: CSS custom properties for theming
├── requires: System theme detection
└── enables: Glass/blur effects (better in dark mode)

Minimal Visual Hierarchy
├── requires: Refined typography scale
├── requires: Consistent spacing system
└── conflicts with: Warm Modern decorations
```

---

## Component Patterns

### Command Palette Structure

```tsx
// Using cmdk library
<Command.Dialog open={open} onOpenChange={setOpen}>
  <Command.Input placeholder="Type a command or search..." />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>

    <Command.Group heading="Navigation">
      <Command.Item onSelect={() => navigate('/tables')}>
        <TableIcon />
        <span>Tables</span>
        <kbd>G T</kbd>
      </Command.Item>
    </Command.Group>

    <Command.Group heading="Actions">
      <Command.Item>
        <PlusIcon />
        <span>New Query</span>
        <kbd>Cmd+N</kbd>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

### Item States (Linear-style)

```css
/* Default */
[cmdk-item] {
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 100ms ease;
}

/* Hover */
[cmdk-item]:hover {
  background: oklch(1 0 0 / 5%);
}

/* Selected (keyboard focus) */
[cmdk-item][data-selected='true'] {
  background: oklch(1 0 0 / 8%);
  color: var(--text-primary);
}

/* No glow, no lift, no shadows */
```

---

## MVP Recommendation

For MVP migration from "Warm Modern" to Linear/Raycast style:

### Phase 1: Foundation (Must Have)

1. **Dark mode as default** - Flip the theme, update all color tokens
2. **Color palette migration** - Cool slate instead of warm stone
3. **Border radius reduction** - 20px+ down to 8-12px
4. **Remove decorative elements** - Gradients, glows, Art Deco borders
5. **Typography cleanup** - Ensure Inter/system font, proper hierarchy

### Phase 2: Interaction (Should Have)

1. **Command palette (Cmd+K)** - Install and integrate cmdk
2. **Keyboard shortcut system** - Display shortcuts, handle key events
3. **Transition timing** - Audit all transitions, standardize to 150ms

### Phase 3: Polish (Nice to Have)

1. **Glass effects** - Backdrop blur on dialogs, popovers
2. **Contextual commands** - View-specific command palette items
3. **Vim navigation** - j/k navigation in lists

### Defer to Post-MVP

- Light mode refinement (focus on dark first)
- Performance-aware animation enhancement
- Theme variants (glass, etc.)
- Command history/recents

---

## Website-Specific Considerations

The marketing website requires slightly different treatment:

| Website Element  | Linear/Raycast Approach                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Hero section     | Dark background, minimal text, product screenshot prominently displayed |
| Typography       | Larger display text with gradient on key words                          |
| CTA buttons      | Single accent color, no gradient, subtle hover                          |
| Feature sections | Bento grid with screenshots, minimal descriptions                       |
| Navigation       | Fixed header, sparse links, command palette trigger                     |
| Footer           | Simple link columns, no decorations                                     |
| Animations       | Fade-up on scroll, staggered reveals                                    |
| Product demos    | Embedded app screenshots or video loops                                 |

### Remove from Current Website

- Warm background gradients
- Orange accent color
- Testimonials section (optional for dev tools)
- Heavy card hover effects
- Decorative grid patterns
- Art deco border elements

---

## Sources

- **Linear.app** - Direct analysis of homepage and features page (HIGH confidence)
- **Raycast.com** - Direct analysis of homepage design (HIGH confidence)
- **cmdk library** (pacocoursey/cmdk) - Official documentation via Context7 (HIGH confidence)
- **WebSearch** - Command palette patterns, dark mode best practices (MEDIUM confidence)

---

## Confidence Assessment

| Area               | Level  | Reason                                           |
| ------------------ | ------ | ------------------------------------------------ |
| Table Stakes       | HIGH   | Based on direct Linear/Raycast analysis          |
| Differentiators    | HIGH   | Based on actual implementation patterns observed |
| Anti-Features      | HIGH   | Clear contrast with current "Warm Modern" design |
| Component Patterns | HIGH   | cmdk documentation is comprehensive              |
| MVP Phases         | MEDIUM | Prioritization is opinion-based                  |

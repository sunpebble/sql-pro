# SQL Pro Design System

A comprehensive design system for SQL Pro, a professional SQLite database manager. This document covers all design tokens, components, and styling guidelines.

## Overview

- **Primary Brand Color**: Emerald Green (`#10B981` / `oklch(0.696 0.17 162.48)`)
- **Design Philosophy**: Modern, professional, clean
- **Color Space**: OKLCH for perceptually uniform colors
- **CSS Framework**: Tailwind CSS v4 (CSS-first configuration)
- **Theme Support**: Light and Dark modes via `.dark` class

---

## Color Palette

### Primary (Emerald Green)

| Token                  | OKLCH                            | Hex       | Usage                           |
| ---------------------- | -------------------------------- | --------- | ------------------------------- |
| `--primary`            | `oklch(0.696 0.17 162.48)`       | `#10B981` | Primary actions, links, accents |
| `--primary-foreground` | `oklch(0.985 0 0)`               | `#FFFFFF` | Text on primary backgrounds     |
| `--primary-dark`       | `oklch(0.596 0.145 163.23)`      | `#059669` | Hover states, emphasis          |
| `--primary-light`      | `oklch(0.75 0.18 162.48)`        | `#34D399` | Lighter primary variant         |
| `--primary-50`         | `oklch(0.97 0.02 166)`           | `#ECFDF5` | Subtle backgrounds              |
| `--primary-100`        | `oklch(0.94 0.04 166)`           | `#D1FAE5` | Light accents                   |
| `--primary-glow`       | `oklch(0.696 0.17 162.48 / 35%)` | —         | Glow effects                    |
| `--primary-subtle`     | `oklch(0.696 0.17 162.48 / 8%)`  | —         | Subtle overlays                 |

### Backgrounds (Light Mode)

| Token          | OKLCH                      | Hex       | Usage                 |
| -------------- | -------------------------- | --------- | --------------------- |
| `--background` | `oklch(1 0 0)`             | `#FFFFFF` | Main background       |
| `--card`       | `oklch(1 0 0)`             | `#FFFFFF` | Card backgrounds      |
| `--popover`    | `oklch(1 0 0)`             | `#FFFFFF` | Popovers, dropdowns   |
| `--secondary`  | `oklch(0.97 0.005 264.53)` | `#F8FAFC` | Secondary backgrounds |
| `--muted`      | `oklch(0.97 0.005 264.53)` | `#F8FAFC` | Muted backgrounds     |
| `--accent`     | `oklch(0.97 0.02 166)`     | —         | Accent backgrounds    |

### Foreground / Text

| Token                 | OKLCH                      | Hex       | Usage                |
| --------------------- | -------------------------- | --------- | -------------------- |
| `--foreground`        | `oklch(0.145 0.02 264.36)` | `#0F172A` | Primary text         |
| `--card-foreground`   | `oklch(0.145 0.02 264.36)` | `#0F172A` | Card text            |
| `--muted-foreground`  | `oklch(0.556 0.02 264.53)` | `#64748B` | Secondary/muted text |
| `--accent-foreground` | `oklch(0.35 0.1 162)`      | —         | Accent text          |

### Borders

| Token      | OKLCH                      | Hex       | Usage           |
| ---------- | -------------------------- | --------- | --------------- |
| `--border` | `oklch(0.922 0.01 264.53)` | `#E2E8F0` | Default borders |
| `--input`  | `oklch(0.922 0.01 264.53)` | `#E2E8F0` | Input borders   |
| `--ring`   | `oklch(0.696 0.17 162.48)` | `#10B981` | Focus rings     |

### Semantic (Status Colors)

| Token           | OKLCH                      | Hex       | Usage                    |
| --------------- | -------------------------- | --------- | ------------------------ |
| `--success`     | `oklch(0.723 0.191 142.5)` | `#22C55E` | Success states           |
| `--warning`     | `oklch(0.769 0.188 70.08)` | `#F59E0B` | Warning states           |
| `--destructive` | `oklch(0.577 0.245 27.33)` | `#EF4444` | Error/destructive states |
| `--info`        | `oklch(0.696 0.17 162.48)` | `#10B981` | Informational states     |

### Accent Colors

| Token             | OKLCH                       | Usage                                |
| ----------------- | --------------------------- | ------------------------------------ |
| `--accent-cyan`   | `oklch(0.715 0.143 215.22)` | Gradient endpoints, secondary accent |
| `--accent-blue`   | `oklch(0.623 0.214 259.82)` | Chart color 2                        |
| `--accent-purple` | `oklch(0.586 0.24 292.72)`  | Chart color 3                        |
| `--accent-orange` | `oklch(0.705 0.213 47.6)`   | Chart color 4                        |

### Dark Mode

All colors have dark mode variants applied via `.dark` class. Key differences:

| Token          | Light Mode                 | Dark Mode                  |
| -------------- | -------------------------- | -------------------------- |
| `--primary`    | `oklch(0.696 0.17 162.48)` | `oklch(0.76 0.17 163.22)`  |
| `--background` | `oklch(1 0 0)`             | `oklch(0.145 0.02 264.36)` |
| `--foreground` | `oklch(0.145 0.02 264.36)` | `oklch(0.985 0 0)`         |
| `--card`       | `oklch(1 0 0)`             | `oklch(0.205 0.02 264.36)` |
| `--border`     | `oklch(0.922 0.01 264.53)` | `oklch(1 0 0 / 10%)`       |

---

## Typography

### Font Stack

| Context               | Font Stack                                            |
| --------------------- | ----------------------------------------------------- |
| **Sans (Electron)**   | `'Noto Sans Variable', sans-serif`                    |
| **Display (Website)** | `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` |
| **Body (Website)**    | `'Inter', 'Plus Jakarta Sans', system-ui, sans-serif` |
| **Mono**              | `'JetBrains Mono', 'SF Mono', Monaco, monospace`      |

### Font Loading (Website)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

### Font Size Variables (Electron App)

```css
--font-ui-size: 14px;
--font-table-size: 13px;
--font-editor-size: 14px;
```

---

## Components

### Brand Components (`@sqlpro/ui`)

#### BrandButton

Primary action button with glow effects and variants.

```tsx
import { BrandButton } from '@sqlpro/ui';

<BrandButton variant="default">Primary Action</BrandButton>
<BrandButton variant="outline">Outline</BrandButton>
<BrandButton variant="ghost">Ghost</BrandButton>
<BrandButton variant="pulse">Download CTA</BrandButton>
<BrandButton size="sm" corners>With Corners</BrandButton>
```

**Variants**: `default`, `outline`, `ghost`, `pulse`  
**Sizes**: `default`, `sm`, `lg`, `icon`, `icon-sm`  
**Props**: `corners` (boolean) - adds decorative corner accents

#### BrandCard

Elevated card with decorative inner border frame.

```tsx
import {
  BrandCard,
  BrandCardHeader,
  BrandCardTitle,
  BrandCardContent,
} from '@sqlpro/ui';

<BrandCard decorated interactive>
  <BrandCardHeader decorated>
    <BrandCardTitle>Card Title</BrandCardTitle>
  </BrandCardHeader>
  <BrandCardContent>Content here</BrandCardContent>
</BrandCard>;
```

**Props**:

- `decorated` (boolean) - shows inner border frame
- `interactive` (boolean) - enables hover lift and glow
- `size` - `'default'` | `'sm'` | `'lg'`

#### GradientText

Animated shimmer text with gradient effect.

```tsx
import { GradientText } from '@sqlpro/ui';

<GradientText as="h1" variant="primary" animate speed="default">
  Shimmering Title
</GradientText>;
```

**Props**:

- `as` - `'span'` | `'h1'` | `'h2'` | `'h3'` | `'h4'` | `'p'`
- `variant` - `'primary'` | `'foreground'` | `'accent'`
- `animate` (boolean) - enables shimmer animation
- `speed` - `'slow'` | `'default'` | `'fast'`

#### BrandHeading

Display heading with optional decorative line.

```tsx
import { BrandHeading } from '@sqlpro/ui';

<BrandHeading level={1} decorated centered>
  Section Title
</BrandHeading>;
```

**Props**:

- `level` - `1` | `2` | `3` (h1, h2, h3)
- `decorated` (boolean) - shows decorative line above
- `centered` (boolean) - centers content

### Standard Components (shadcn/ui based)

The `@sqlpro/ui` package also exports standard shadcn/ui components:

- `Button`, `Card`, `Input`, `Select`, `Checkbox`, `Radio`
- `Tabs`, `Table`, `Form`, `Dialog`, `Sheet`, `Popover`
- `ContextMenu`, `DropdownMenu`, `Command`
- `Tooltip`, `Badge`, `Avatar`, `Progress`, `Slider`
- `ScrollArea`, `Separator`, `Skeleton`, `Switch`
- And more...

---

## Usage Examples

### Importing Design Tokens

```tsx
// TypeScript/JavaScript
import { brandColors, brandFonts, brandShadows, brandGradients, brandClasses } from '@sqlpro/ui/theme';

// CSS
@import '@sqlpro/ui/sanctum.css';  // For animations and effects
```

### Using CSS Variables

```css
.my-element {
  color: var(--primary);
  background: var(--background);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-primary-glow);
}
```

### Using Tailwind Classes

```tsx
// Theme-aware classes
<div className="bg-background text-foreground border-border">
  <span className="text-primary">Primary text</span>
  <span className="text-muted-foreground">Muted text</span>
</div>;

// Using brandClasses presets
import { brandClasses } from '@sqlpro/ui/theme';

<div className={brandClasses.glowPrimary}>Glowing element</div>;
```

### Animation Utilities

Available via `@sqlpro/ui/sanctum.css`:

```tsx
<div className="animate-fade-up delay-200">Animated content</div>
<div className="animate-primary-pulse">Pulsing glow</div>
<div className="glow-primary">Static glow</div>
<span className="text-gradient-primary">Gradient text</span>
```

---

## Shadows & Effects

### Shadow Tokens

| Token                   | Value                                     | Usage               |
| ----------------------- | ----------------------------------------- | ------------------- |
| `--shadow-sm`           | `0 1px 2px 0 rgba(0, 0, 0, 0.05)`         | Subtle elevation    |
| `--shadow-md`           | `0 4px 6px -1px rgba(0, 0, 0, 0.1)...`    | Default cards       |
| `--shadow-lg`           | `0 10px 15px -3px rgba(0, 0, 0, 0.1)...`  | Elevated elements   |
| `--shadow-primary-glow` | `0 0 40px oklch(0.696 0.17 162.48 / 35%)` | Primary accent glow |

### Gradients

```css
/* Primary gradient (emerald to cyan) */
--gradient-primary: linear-gradient(
  135deg,
  oklch(0.696 0.17 162.48) 0%,
  oklch(0.715 0.143 215.22) 100%
);
```

---

## Spacing & Radius

### Border Radius

| Token         | Value                       |
| ------------- | --------------------------- |
| `--radius`    | `0.625rem` (10px)           |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)`             |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

### Duration & Easing

| Token               | Value                            |
| ------------------- | -------------------------------- |
| `--duration-fast`   | `100ms`                          |
| `--duration-normal` | `150ms`                          |
| `--duration-slow`   | `200ms`                          |
| `--ease-out`        | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `--ease-in-out`     | `cubic-bezier(0.65, 0, 0.35, 1)` |

---

## Legacy Aliases

For backward compatibility during migration from the previous gold/Art Deco theme, these aliases are maintained:

### Colors

| Legacy          | Maps To            |
| --------------- | ------------------ |
| `--gold-bright` | `--primary`        |
| `--gold-muted`  | `--primary-dark`   |
| `--gold-glow`   | `--primary-glow`   |
| `--gold-subtle` | `--primary-subtle` |

### Components

| Legacy               | Current               |
| -------------------- | --------------------- |
| `sanctumColors`      | `brandColors`         |
| `sanctumFonts`       | `brandFonts`          |
| `sanctumShadows`     | `brandShadows`        |
| `sanctumGradients`   | `brandGradients`      |
| `sanctumClasses`     | `brandClasses`        |
| `GoldButton`         | `BrandButton`         |
| `goldButtonVariants` | `brandButtonVariants` |

### CSS Classes

| Legacy Class          | Current Class            |
| --------------------- | ------------------------ |
| `.text-gradient-gold` | `.text-gradient-primary` |
| `.glow-gold`          | `.glow-primary`          |
| `.glow-gold-pulse`    | `.glow-primary-pulse`    |
| `.animate-gold-pulse` | `.animate-primary-pulse` |
| `.glass-gold`         | `.glass-primary`         |
| `.btn-gold-ghost`     | `.btn-primary-ghost`     |
| `.hover-gold`         | `.hover-primary`         |

---

## Accessibility

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Indicators

- Focus rings use `--ring` color (`--primary`)
- Keyboard navigation uses `:focus-visible` for clean UX
- Focus offset: `2px`

---

## File Structure

```
packages/ui/
├── src/
│   ├── sanctum.css          # CSS animations, variables, utilities
│   ├── theme/
│   │   ├── index.ts         # Theme exports
│   │   └── sanctum.ts       # Color tokens, fonts, effects
│   ├── gold-button.tsx      # BrandButton component
│   ├── sanctum-card.tsx     # BrandCard component
│   ├── typography.tsx       # GradientText, BrandHeading
│   └── index.ts             # Main exports
└── package.json

apps/electron/src/renderer/src/styles/
└── globals.css              # Electron app theme (Tailwind v4)

apps/website/src/
└── index.css                # Website theme (Tailwind v4)
```

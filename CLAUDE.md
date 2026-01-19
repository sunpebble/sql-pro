# SQL Pro - Claude Code Instructions

## Project Overview

SQL Pro is a professional, cross-platform database management application built with:

- **Desktop App**: Electron + React + TypeScript + Tailwind CSS + shadcn/ui
- **Website**: React + TypeScript + Vite

## Design System: Data Sanctum

The visual identity follows the **"Data Sanctum"** (数据圣殿) design philosophy - an Art Deco inspired aesthetic that communicates the value and professionalism of data management.

### Core Aesthetic Principles

1. **Ceremonial & Refined**: High contrast, dramatic typography, architectural elegance
2. **Distinctive Identity**: Deliberately different from generic "tech blue" SaaS aesthetics
3. **Gold as Sacred Accent**: Represents the transformation of raw data into valuable insights

### Color Palette

| Token           | Value                   | Usage                                 |
| --------------- | ----------------------- | ------------------------------------- |
| `--gold-bright` | `#D4AF37`               | Primary brand color, CTAs, highlights |
| `--gold-muted`  | `#C9A962`               | Icons, decorative elements, borders   |
| `--gold-dark`   | `#9A7B2D`               | Hover states, shadows                 |
| `--gold-glow`   | `rgba(212,175,55,0.35)` | Glow effects, shadows                 |
| `--gold-subtle` | `rgba(212,175,55,0.08)` | Subtle backgrounds                    |
| `--void-deep`   | `#060606`               | Primary background                    |
| `--ivory`       | `#F8F6F1`               | Primary text color                    |
| `--burgundy`    | `#8B2942`               | Error/warning states                  |

### Typography

| Font                   | Usage                                          |
| ---------------------- | ---------------------------------------------- |
| **Cormorant Garamond** | Display headings, brand name (elegant serif)   |
| **Manrope**            | Body text, UI elements (modern geometric sans) |
| **IBM Plex Mono**      | Code, technical labels, monospace content      |

### Signature Design Elements

1. **Hexagonal Honeycomb Background** (`.bg-hex-pattern`)
   - Represents data structure and interconnectedness
   - Subtle gold-tinted pattern

2. **Art Deco Corner Frames** (`.border-deco`)
   - Decorative L-shaped corners on containers
   - Adds architectural elegance

3. **Gold Gradient Text** (`.text-gradient-gold`)
   - Animated shimmer effect for brand emphasis
   - Use sparingly on key headlines

4. **Breathing Glow Pulse** (`.glow-gold-pulse`)
   - Subtle pulsing gold glow on primary CTAs
   - Creates visual hierarchy and draws attention

5. **Geometric Grid Background**
   - 45-degree diagonal line pattern
   - Very subtle, adds depth without distraction

### CSS Utility Classes

```css
/* Gold gradient text with shimmer animation */
.text-gradient-gold

/* Gold glow shadow */
.glow-gold

/* Animated pulsing gold glow */
.glow-gold-pulse

/* Hexagonal honeycomb background pattern */
.bg-hex-pattern

/* Art Deco decorative corner frames */
.border-deco
```

### Design Files

| File                                                | Purpose                                         |
| --------------------------------------------------- | ----------------------------------------------- |
| `apps/website/src/index.css`                        | Global design system, CSS variables, animations |
| `apps/website/src/components/Hero.css`              | Hero section styling                            |
| `apps/electron/src/renderer/src/styles/globals.css` | Electron app theme variables                    |

### Design Guidelines

**DO:**

- Use gold accents sparingly for maximum impact
- Maintain high contrast between text and background
- Apply geometric decorations to reinforce the Art Deco theme
- Use Cormorant Garamond for headlines, Manrope for body

**DON'T:**

- Use blue/purple gradients (too generic)
- Use Inter, Roboto, or system fonts for branding
- Overuse gold - it should feel precious, not overwhelming
- Add rounded corners everywhere - prefer subtle or no rounding

### Responsive Behavior

- Desktop: Full Art Deco experience with corner frames and decorations
- Tablet: Simplified decorations, maintained color scheme
- Mobile: Minimal decorations, focus on content and usability

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start Electron app in development
pnpm dev:electron

# Start website in development
pnpm dev:website

# Build for production
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
sql-pro/
├── apps/
│   ├── electron/          # Desktop application
│   │   └── src/
│   │       ├── main/      # Electron main process
│   │       └── renderer/  # React frontend
│   └── website/           # Marketing website
├── packages/
│   └── ui/                # Shared UI components (shadcn/ui)
└── shared/                # Shared types and utilities
```

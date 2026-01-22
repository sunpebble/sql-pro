# SQL Pro - Claude Code Instructions

## Project Overview

SQL Pro is a professional, cross-platform database management application built with:

- **Desktop App**: Electron + React + TypeScript + Tailwind CSS + shadcn/ui
- **Website**: React + TypeScript + Vite

## Design System: Fresh Modern

The visual identity follows a **"Fresh Modern"** design philosophy - a clean, bright, professional aesthetic inspired by modern SaaS applications like TaxMate. The design communicates trust, clarity, and efficiency.

### Core Aesthetic Principles

1. **Clean & Professional**: Bright backgrounds, clear typography, generous whitespace
2. **Distinctive Identity**: Vibrant green accent color, modern sans-serif typography
3. **User-Focused**: High readability, intuitive interactions, accessible design

### Color Palette

#### Light Mode

| Token              | Value                   | Usage                                 |
| ------------------ | ----------------------- | ------------------------------------- |
| `--primary`        | `#10B981` (Emerald 500) | Primary brand color, CTAs, highlights |
| `--primary-dark`   | `#059669` (Emerald 600) | Hover states, emphasis                |
| `--primary-50`     | `#ECFDF5`               | Subtle backgrounds, badges            |
| `--accent-cyan`    | `#06B6D4` (Cyan 500)    | Secondary accent, gradients           |
| `--bg-white`       | `#FFFFFF`               | Primary background                    |
| `--bg-subtle`      | `#F8FAFC` (Slate 50)    | Secondary background                  |
| `--text-primary`   | `#0F172A` (Slate 900)   | Primary text                          |
| `--text-secondary` | `#475569` (Slate 600)   | Secondary text                        |
| `--text-muted`     | `#94A3B8` (Slate 400)   | Muted text, placeholders              |
| `--border-light`   | `#E2E8F0` (Slate 200)   | Light borders                         |
| `--border-medium`  | `#CBD5E1` (Slate 300)   | Medium borders                        |
| `--success`        | `#22C55E` (Green 500)   | Success states                        |
| `--warning`        | `#F59E0B` (Amber 500)   | Warning states                        |
| `--error`          | `#EF4444` (Red 500)     | Error states                          |

#### Dark Mode

| Token              | Value                   | Usage                          |
| ------------------ | ----------------------- | ------------------------------ |
| `--primary`        | `#34D399` (Emerald 400) | Primary brand color (brighter) |
| `--primary-dark`   | `#10B981` (Emerald 500) | Hover states                   |
| `--bg-dark`        | `#0F172A` (Slate 900)   | Primary background             |
| `--bg-card`        | `#1E293B` (Slate 800)   | Card backgrounds               |
| `--text-primary`   | `#F8FAFC` (Slate 50)    | Primary text                   |
| `--text-secondary` | `#CBD5E1` (Slate 300)   | Secondary text                 |
| `--border-dark`    | `#334155` (Slate 700)   | Borders                        |

### Typography

| Font                  | Usage                                         |
| --------------------- | --------------------------------------------- |
| **Plus Jakarta Sans** | Display headings, brand name (modern display) |
| **Inter**             | Body text, UI elements (clean sans-serif)     |
| **JetBrains Mono**    | Code, technical labels, monospace content     |

### Signature Design Elements

1. **Gradient Text** (`.pricing-title-gradient`, `.download-title-gradient`)
   - Primary to cyan gradient for emphasis
   - Use on key headlines and CTAs

2. **Pill Badges** (`.pricing-label`, `.download-label`)
   - Rounded full badges with primary-50 background
   - Icon + text combination

3. **Card Design**
   - Rounded corners (16px-24px border-radius)
   - Subtle shadows (`--shadow-card`)
   - Hover lift effect with enhanced shadow

4. **Bento Box Grid**
   - Asymmetric grid layouts for features
   - Card variants: large, tall, dark, accent

5. **Stats Display**
   - Large numbers with gradient text
   - Supporting labels below

### CSS Variables (Website)

```css
:root {
  /* Primary Colors */
  --primary: #10b981;
  --primary-dark: #059669;
  --primary-50: #ecfdf5;
  --accent-cyan: #06b6d4;

  /* Backgrounds */
  --bg-white: #ffffff;
  --bg-subtle: #f8fafc;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  /* Borders */
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;

  /* Shadows */
  --shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Border Radius */
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-2xl: 24px;
  --border-radius-full: 9999px;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Design Files

| File                                                | Purpose                                     |
| --------------------------------------------------- | ------------------------------------------- |
| `apps/website/src/index.css`                        | Website global design system, CSS variables |
| `apps/website/src/components/*.css`                 | Component-specific styles                   |
| `apps/electron/src/renderer/src/styles/globals.css` | Electron app theme variables (light/dark)   |

### Design Guidelines

**DO:**

- Use the green primary color for CTAs and interactive elements
- Maintain generous whitespace and clean layouts
- Use rounded corners consistently (12px-24px)
- Apply subtle shadows for depth
- Use gradient text sparingly for emphasis
- Support both light and dark modes

**DON'T:**

- Use gold/Art Deco styling (legacy design)
- Use dark backgrounds in light mode
- Overuse gradients - keep them for key elements
- Use sharp corners - prefer rounded edges
- Neglect dark mode support

### Component Patterns

#### Section Header

```jsx
<header className="section-header">
  <div className="section-label">
    <Icon /> Label
  </div>
  <h2 className="section-title">
    Title <span className="title-gradient">Highlight</span>
  </h2>
  <p className="section-subtitle">Description text</p>
</header>
```

#### Card with Hover

```jsx
<div className="card">
  <div className="card-icon">{icon}</div>
  <h3 className="card-title">{title}</h3>
  <p className="card-description">{description}</p>
</div>
```

#### CTA Button

```jsx
<a href="#" className="btn-primary">
  Get Started
  <ArrowIcon />
</a>
```

### Responsive Behavior

- Desktop: Full experience with all decorative elements
- Tablet: Simplified grid layouts, maintained spacing
- Mobile: Single column layouts, reduced padding, touch-friendly targets

### Animations

- `fade-up`: Entry animation for sections (translateY + opacity)
- `scale-in`: Card hover effects
- Hover transitions: 200-300ms with ease-out timing

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

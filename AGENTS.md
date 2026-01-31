# SQL Pro - Claude Code Instructions

## Project Overview

SQL Pro is a professional, cross-platform database management application built with:

- **Desktop App**: Electron + React + TypeScript + Tailwind CSS + shadcn/ui
- **Website**: React + TypeScript + Vite

## Design System: Warm Modern

The visual identity follows a **"Warm Modern"** design philosophy - a friendly, approachable, and inviting aesthetic inspired by Linear and Raycast. The design communicates creativity, warmth, and trustworthiness.

### Core Aesthetic Principles

1. **Warm & Inviting**: Soft backgrounds, warm orange accents, welcoming atmosphere
2. **Soft Modern**: Large rounded corners (16-24px), gentle shadows, smooth transitions
3. **User-Focused**: High readability, intuitive interactions, accessible design

### Color Palette

#### Light Mode

| Token              | Value                  | Usage                                 |
| ------------------ | ---------------------- | ------------------------------------- |
| `--primary`        | `#F97316` (Orange 500) | Primary brand color, CTAs, highlights |
| `--primary-dark`   | `#EA580C` (Orange 600) | Hover states, emphasis                |
| `--primary-light`  | `#FB923C` (Orange 400) | Lighter accents                       |
| `--primary-50`     | `#FFF7ED`              | Subtle backgrounds, badges            |
| `--primary-100`    | `#FFEDD5`              | Light backgrounds                     |
| `--accent`         | `#FDBA74` (Orange 300) | Secondary accent, gradients           |
| `--bg-white`       | `#FFFBF7`              | Primary background (warm white)       |
| `--bg-subtle`      | `#FEF3E7`              | Secondary background                  |
| `--text-primary`   | `#1C1917` (Stone 900)  | Primary text                          |
| `--text-secondary` | `#57534E` (Stone 600)  | Secondary text                        |
| `--text-muted`     | `#A8A29E` (Stone 400)  | Muted text, placeholders              |
| `--border-light`   | `#F5F0EB`              | Light borders (warm)                  |
| `--border-medium`  | `#E7E0D9`              | Medium borders                        |
| `--success`        | `#22C55E` (Green 500)  | Success states                        |
| `--warning`        | `#F59E0B` (Amber 500)  | Warning states                        |
| `--error`          | `#EF4444` (Red 500)    | Error states                          |

#### Dark Mode

| Token              | Value                  | Usage                          |
| ------------------ | ---------------------- | ------------------------------ |
| `--primary`        | `#FB923C` (Orange 400) | Primary brand color (brighter) |
| `--primary-dark`   | `#F97316` (Orange 500) | Hover states                   |
| `--bg-dark`        | `#1C1917` (Stone 900)  | Primary background             |
| `--bg-card`        | `#292524` (Stone 800)  | Card backgrounds               |
| `--text-primary`   | `#FAFAF9` (Stone 50)   | Primary text                   |
| `--text-secondary` | `#D6D3D1` (Stone 300)  | Secondary text                 |
| `--border-dark`    | `#44403C` (Stone 700)  | Borders                        |

### Typography

| Font                  | Usage                                         |
| --------------------- | --------------------------------------------- |
| **Plus Jakarta Sans** | Display headings, brand name (modern display) |
| **Inter**             | Body text, UI elements (clean sans-serif)     |
| **JetBrains Mono**    | Code, technical labels, monospace content     |

### Signature Design Elements

1. **Gradient Text** (`.text-gradient-primary`)
   - Primary orange gradient for emphasis
   - Use on key headlines and CTAs

2. **Pill Badges** (`.badge-primary`)
   - Rounded full badges with primary-50 background
   - Icon + text combination

3. **Card Design**
   - Large rounded corners (20px-28px border-radius)
   - Warm, soft shadows with orange tint
   - Hover lift effect with enhanced glow

4. **Soft Shadows**
   - Use warm-tinted shadows (orange/amber undertones)
   - Larger blur radius for softer appearance

5. **Stats Display**
   - Large numbers with gradient text
   - Supporting labels below

### CSS Variables (Website)

```css
:root {
  /* Primary Colors - Orange Palette */
  --primary: #f97316;
  --primary-dark: #ea580c;
  --primary-light: #fb923c;
  --primary-50: #fff7ed;
  --primary-100: #ffedd5;
  --accent: #fdba74;

  /* Backgrounds - Warm Whites */
  --bg-white: #fffbf7;
  --bg-subtle: #fef3e7;

  /* Text - Stone Palette */
  --text-primary: #1c1917;
  --text-secondary: #57534e;
  --text-muted: #a8a29e;
  --text-inverse: #ffffff;

  /* Borders - Warm */
  --border-light: #f5f0eb;
  --border-medium: #e7e0d9;

  /* Shadows - Warm Tinted */
  --shadow-card: 0 4px 20px -4px rgba(249, 115, 22, 0.1);
  --shadow-card-hover: 0 20px 40px -8px rgba(249, 115, 22, 0.15);

  /* Border Radius - Larger for Soft Modern */
  --border-radius-md: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 20px;
  --border-radius-2xl: 28px;
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

- Use the orange primary color for CTAs and interactive elements
- Maintain generous whitespace and warm, inviting layouts
- Use large rounded corners consistently (16px-28px)
- Apply warm-tinted shadows for depth and softness
- Use gradient text sparingly for emphasis
- Support both light and dark modes
- Use Stone color palette for neutrals (warmer than Slate)

**DON'T:**

- Use cold colors (blue, cyan) as primary accents
- Use sharp corners - prefer large rounded edges
- Use harsh black shadows - prefer warm-tinted shadows
- Neglect dark mode support
- Overuse gradients - keep them for key elements

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

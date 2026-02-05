# SQL Pro - Claude Code Instructions

## Project Overview

SQL Pro is a professional, cross-platform database management application built with:

- **Desktop App**: Electron + React + TypeScript + Tailwind CSS + shadcn/ui
- **Website**: React + TypeScript + Vite

## Design System: Neobrutalism

The visual identity follows a **"Neobrutalism"** design philosophy - a bold, playful, and distinctive aesthetic characterized by thick borders, offset shadows, and vibrant colors. The design communicates confidence, creativity, and modern craftsmanship.

### Core Aesthetic Principles

1. **Bold & Distinctive**: Thick black borders (2px), offset shadows, high contrast
2. **Playful Modern**: Large interactive elements, satisfying hover effects (translate + shadow removal)
3. **Clear Hierarchy**: Simple color palette, strong visual structure, readable typography

### Color Palette

#### Light Mode

| Token                    | Value     | Usage                            |
| ------------------------ | --------- | -------------------------------- |
| `--main`                 | `#f97316` | Primary brand color (Orange)     |
| `--main-foreground`      | `#000000` | Text on primary color            |
| `--background`           | `#ffffff` | Primary background               |
| `--foreground`           | `#000000` | Primary text                     |
| `--secondary-background` | `#e0e0e0` | Secondary/muted backgrounds      |
| `--border`               | `#000000` | All borders (neobrutalism style) |
| `--card`                 | `#ffffff` | Card backgrounds                 |
| `--muted`                | `#f5f5f5` | Muted backgrounds                |
| `--muted-foreground`     | `#737373` | Muted text                       |
| `--destructive`          | `#ef4444` | Error/destructive actions        |
| `--success`              | `#22c55e` | Success states                   |
| `--warning`              | `#f59e0b` | Warning states                   |

#### Dark Mode

| Token                    | Value     | Usage                           |
| ------------------------ | --------- | ------------------------------- |
| `--main`                 | `#fb923c` | Primary brand color (brighter)  |
| `--main-foreground`      | `#000000` | Text on primary color           |
| `--background`           | `#1a1a1a` | Primary background              |
| `--foreground`           | `#ffffff` | Primary text                    |
| `--secondary-background` | `#262626` | Secondary backgrounds           |
| `--border`               | `#ffffff` | All borders (inverted for dark) |
| `--card`                 | `#262626` | Card backgrounds                |
| `--muted`                | `#404040` | Muted backgrounds               |
| `--muted-foreground`     | `#a3a3a3` | Muted text                      |

### Typography

| Font               | Usage                                     |
| ------------------ | ----------------------------------------- |
| **Inter**          | All text - headings, body, UI elements    |
| **JetBrains Mono** | Code, technical labels, monospace content |

### Signature Design Elements

1. **Offset Shadows**
   - Standard: `4px 4px 0px 0px var(--border)`
   - Small: `2px 2px 0px 0px var(--border)`
   - Large: `8px 8px 0px 0px var(--border)`

2. **Border Style**
   - All interactive elements use `2px solid var(--border)`
   - Consistent border-radius: `5px` (rounded-base)

3. **Hover Effect**
   - Elements translate by shadow offset amount
   - Shadow disappears on hover
   - Creates a "press" effect

4. **Button Patterns**

   ```jsx
   <button className="rounded-base border-border bg-main text-main-foreground shadow-shadow border-2 px-6 py-3 font-semibold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
     Click Me
   </button>
   ```

5. **Card Patterns**
   ```jsx
   <div className="rounded-base border-border bg-card shadow-shadow border-2 p-6 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
     Card content
   </div>
   ```

### CSS Variables (Website & Electron)

```css
:root {
  /* Main/Primary - Orange */
  --main: #f97316;
  --main-foreground: #000000;

  /* Core Colors */
  --background: #ffffff;
  --foreground: #000000;
  --secondary-background: #e0e0e0;

  /* Border - Always solid for neobrutalism */
  --border: #000000;
  --ring: #000000;

  /* Shadows - Offset style */
  --shadow: 4px 4px 0px 0px #000000;
  --shadow-sm: 2px 2px 0px 0px #000000;
  --shadow-lg: 8px 8px 0px 0px #000000;

  /* Border Radius - Small, consistent */
  --radius-base: 5px;
}

.dark {
  --main: #fb923c;
  --background: #1a1a1a;
  --foreground: #ffffff;
  --border: #ffffff;
  --shadow: 4px 4px 0px 0px #ffffff;
}
```

### Design Files

| File                                                | Purpose                                     |
| --------------------------------------------------- | ------------------------------------------- |
| `apps/website/src/index.css`                        | Website global design system, CSS variables |
| `apps/electron/src/renderer/src/styles/globals.css` | Electron app theme variables (light/dark)   |
| `packages/ui/src/components/*.tsx`                  | Shared shadcn/ui components (neobrutalism)  |

### Design Guidelines

**DO:**

- Use thick black borders (2px) on all interactive elements
- Apply offset shadows (`shadow-shadow`) for depth
- Use the hover translate effect for buttons and cards
- Keep border-radius small and consistent (5px)
- Support both light and dark modes
- Use high contrast color combinations

**DON'T:**

- Use soft/blurred shadows - use solid offset shadows only
- Use large border-radius - keep it at 5px (rounded-base)
- Use gradients extensively - prefer solid colors
- Forget the hover translate + shadow-none effect
- Mix different border widths - stick to 2px

### Component Patterns

#### Primary Button (Neobrutalism)

```jsx
<button className="btn-neo-primary rounded-base border-border bg-main text-main-foreground shadow-shadow inline-flex items-center gap-2 border-2 px-6 py-3 font-semibold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
  Get Started
  <ArrowIcon />
</button>
```

#### Secondary Button

```jsx
<button className="rounded-base border-border bg-background shadow-shadow border-2 px-6 py-3 font-semibold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
  Learn More
</button>
```

#### Card with Hover

```jsx
<div className="rounded-base border-border bg-card shadow-shadow border-2 p-6 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
  <h3 className="font-bold">{title}</h3>
  <p className="text-muted-foreground">{description}</p>
</div>
```

#### Input Field

```jsx
<input
  className="rounded-base border-border bg-background placeholder:text-muted-foreground focus:border-main focus:ring-main/20 w-full border-2 px-4 py-3 transition-all focus:ring-2 focus:outline-none"
  placeholder="Enter text..."
/>
```

#### Badge

```jsx
<span className="rounded-base border-border bg-main text-main-foreground inline-flex items-center gap-1.5 border-2 px-3 py-1 text-sm font-semibold">
  <Icon /> Label
</span>
```

### Responsive Behavior

- Desktop: Full shadows (4px offset), generous padding
- Tablet: Standard layouts, maintained spacing
- Mobile: Smaller shadows (2px offset), reduced padding, touch-friendly targets

### Animations

- **Hover transitions**: 150ms with ease timing
- **fade-up**: Entry animation for sections (translateY + opacity)
- **bounce-in**: Modal/dialog entry animation (scale + opacity)
- **Reduced motion**: Respect `prefers-reduced-motion` preference

### Tailwind Utility Classes

| Class                     | Effect                       |
| ------------------------- | ---------------------------- |
| `rounded-base`            | Border radius 5px            |
| `shadow-shadow`           | Standard offset shadow (4px) |
| `shadow-shadow-sm`        | Small offset shadow (2px)    |
| `shadow-shadow-lg`        | Large offset shadow (8px)    |
| `bg-main`                 | Primary brand background     |
| `text-main`               | Primary brand text color     |
| `border-border`           | Standard border color        |
| `bg-secondary-background` | Secondary background         |

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
│   └── ui/                # Shared UI components (shadcn/ui + neobrutalism)
└── shared/                # Shared types and utilities
```

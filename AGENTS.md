# Quarry - Claude Code Instructions

## Project Overview

Quarry is a professional, cross-platform database management application built with:

- **Desktop App**: Electron + React + TypeScript + Tailwind CSS + shadcn/ui

## Design System: Modern Minimal & Glassmorphism

The visual identity follows a **"Modern Minimal & Glassmorphism"** design philosophy - a clean, airy, and sophisticated aesthetic characterized by subtle borders, soft diffuse shadows, generous spacing, and frosted glass effects (backdrop-blur). The design communicates professionalism, modern craftsmanship, and fluid performance.

### Core Aesthetic Principles

1. **Clean & Refined**: Thin, subtle borders (`rgba(0,0,0,0.1)` or `rgba(255,255,255,0.1)`), soft drop shadows (diffuse), and ample whitespace.
2. **Glassmorphism**: Use of semi-transparent backgrounds with background blur for floating elements (Sidebar, Titlebar, Dialogs, Navigation).
3. **Fast & Snappy**: Animations should be very quick, responsive, and tactile. Use fast easing curves and short durations (100ms - 150ms). Active states should have immediate physical feedback (e.g., `active:scale-95`).
4. **Friendly Geometry**: Larger, smoother border radii (8px - 12px) for a more modern and approachable feel.

### Color Palette

#### Light Mode

| Token                    | Value     | Usage                        |
| ------------------------ | --------- | ---------------------------- |
| `--main`                 | `#f97316` | Primary brand color (Orange) |
| `--main-foreground`      | `#ffffff` | Text on primary color        |
| `--background`           | `#ffffff` | Primary background           |
| `--foreground`           | `#09090b` | Primary text                 |
| `--secondary-background` | `#f4f4f5` | Secondary/muted backgrounds  |
| `--border`               | `#e4e4e7` | All subtle borders           |
| `--card`                 | `#ffffff` | Card backgrounds             |
| `--muted`                | `#f4f4f5` | Muted backgrounds            |
| `--muted-foreground`     | `#71717a` | Muted text                   |
| `--destructive`          | `#ef4444` | Error/destructive actions    |
| `--success`              | `#22c55e` | Success states               |
| `--warning`              | `#f59e0b` | Warning states               |

#### Dark Mode

| Token                    | Value     | Usage                          |
| ------------------------ | --------- | ------------------------------ |
| `--main`                 | `#fb923c` | Primary brand color (brighter) |
| `--main-foreground`      | `#09090b` | Text on primary color          |
| `--background`           | `#09090b` | Primary background             |
| `--foreground`           | `#fafafa` | Primary text                   |
| `--secondary-background` | `#27272a` | Secondary backgrounds          |
| `--border`               | `#27272a` | All subtle borders             |
| `--card`                 | `#09090b` | Card backgrounds               |
| `--muted`                | `#27272a` | Muted backgrounds              |
| `--muted-foreground`     | `#a1a1aa` | Muted text                     |

### Typography

| Font               | Usage                                     |
| ------------------ | ----------------------------------------- |
| **Inter**          | All text - headings, body, UI elements    |
| **JetBrains Mono** | Code, technical labels, monospace content |

### Signature Design Elements

1. **Subtle Shadows**

- Standard: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
- Small: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)`
- Large: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`

2. **Border Style**

- All interactive elements use `1px solid var(--border)`
- Consistent, larger border-radius: `8px` to `12px` (e.g., `--radius: 8px`)

3. **Interactive & Glass Effects**

- Glass backgrounds: `bg-background/80 backdrop-blur-md`
- Fast click effects: `active:scale-95 transition-all duration-150`

4. **Button Patterns**

```jsx
<button className="bg-main text-main-foreground hover:bg-main/90 focus-visible:ring-main inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95">
  Click Me
</button>
```

5. **Card Patterns**

```jsx
<div className="border-border bg-card rounded-xl border shadow-sm transition-all hover:shadow-md">
  Card content
</div>
```

### Design Guidelines

**DO:**

- Use thin, subtle borders (`1px`)
- Apply soft diffuse drop shadows (`shadow-sm`, `shadow-md`) for depth
- Use background blur (`backdrop-blur`) for floating elements like sticky navs, dialogs, and sidebars
- Make all buttons and interactive elements respond quickly (`active:scale-95`, `duration-100` or `150`)
- Keep border-radius slightly larger (8px, 12px) for a modern feel
- Support both light and dark modes gracefully with reduced contrast in dark mode borders

**DON'T:**

- Use thick borders or offset box-shadows (no more Neobrutalism)
- Use slow, sluggish animations (no durations over 200ms for micro-interactions)
- Overuse high contrast pure blacks and whites; use off-blacks and off-whites (e.g., zinc/slate colors)

### Component Patterns

#### Primary Button

```jsx
<button className="bg-main hover:bg-main/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all active:scale-95">
  Get Started
  <ArrowIcon />
</button>
```

#### Secondary Button

```jsx
<button className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all active:scale-95">
  Learn More
</button>
```

#### Input Field

```jsx
<input
  className="border-border bg-background placeholder:text-muted-foreground focus-visible:ring-main flex w-full rounded-md border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
  placeholder="Enter text..."
/>
```

#### Badge

```jsx
<span className="bg-main/10 text-main inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
  <Icon /> Label
</span>
```

### Animations

- **Micro-interactions**: 100ms - 150ms with fast ease timing (`ease-out`)
- **fade-up**: Quick, smooth entry animation for sections (translateY + opacity, ~300ms)
- **zoom-in**: Modal/dialog entry animation (`zoom-in-95` + opacity, ~150ms)
- **Reduced motion**: Respect `prefers-reduced-motion` preference

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start Electron app in development
pnpm dev:electron

# Build for production
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
quarry/
├── apps/
│   ├── electron/          # Desktop application
│   │   └── src/
│   │       ├── main/      # Electron main process
│   │       └── renderer/  # React frontend
├── packages/
│   └── ui/                # Shared UI components
└── shared/                # Shared types and utilities
```

## Cursor Cloud specific instructions

### Node.js version

This project requires **Node.js 24** (see `.node-version`). The VM snapshot has Node 24 installed via nvm and set as default. If something breaks, run `source ~/.nvm/nvm.sh && nvm use 24`.

### Running services

| Service              | Command                    | Port | Notes                                                                                                               |
| -------------------- | -------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------- |
| Electron (mock mode) | `DISPLAY=:1 pnpm dev:mock` | 5174 | Runs the full Electron app with mocked backend — no real DB needed. Requires `DISPLAY=:1` in headless environments. |
| Electron (real mode) | `DISPLAY=:1 pnpm dev`      | —    | Requires real database connections. Use mock mode for UI-only work.                                                 |

### Testing

- `pnpm lint` — ESLint across all workspace projects. Warnings are expected (ref-naming, use-state naming conventions).
- `pnpm typecheck` — Uses `tsgo` (TypeScript Go compiler). Runs fast (~5s).
- `pnpm test:run` — Vitest single run. ~1500+ tests pass. **Caveat:** ~6 test files that depend on native Electron modules (`database.test.ts`, `backup.test.ts`, `PluginService.test.ts`, `PluginLoader.test.ts`, `QueryHookIntegration.test.ts`, `onboarding-store.test.ts`) show `0 test` and may hang indefinitely. If the test run doesn't complete, kill the process — the passing tests are reliable.

### Electron dbus errors

When running `pnpm dev` or `pnpm dev:mock` in the cloud VM, you'll see `dbus/bus.cc` errors in the console. These are harmless — the VM doesn't have a D-Bus session bus.

### Husky git hooks

Pre-commit runs `pnpm lint-staged` and `pnpm typecheck`. Commit messages must follow Conventional Commits (enforced by commitlint).

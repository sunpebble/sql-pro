# Codebase Structure

**Analysis Date:** 2026-01-25

## Directory Layout

```
sql-pro/
├── .crush/             # Crash reporting/logging related files
├── .husky/             # Git hooks configuration
├── artifacts/          # Build artifacts or temporary files
├── apps/               # Contains separate applications
│   ├── electron/       # Electron desktop application
│   │   ├── src/        # Source code for Electron app
│   │   │   ├── main/   # Electron main process source code
│   │   │   └── renderer/# Electron renderer (React) process source code
│   │   └── dist/       # Build output for Electron app
│   └── website/        # Marketing website
│       └── src/        # Source code for the website
│       └── dist/       # Build output for the website
├── packages/           # Contains reusable code packages
│   ├── license-api/    # Logic for license management API
│   └── ui/             # Shared UI components (shadcn/ui based)
├── out/                # General build output directory (e.g., for Electron dev)
└── dist/               # General distribution output directory
```

## Directory Purposes

**`apps/`:**

- Purpose: Contains the primary applications developed within the monorepo.
- Contains: `electron` desktop application and `website`.
- Key files: `apps/electron/package.json`, `apps/website/package.json`.

**`apps/electron/`:**

- Purpose: Houses all code and configurations specific to the Electron desktop application.
- Contains: Source code for both the main and renderer processes, build scripts, and Electron-specific assets.
- Key files: `apps/electron/src/main/index.ts`, `apps/electron/src/renderer/src/main.tsx`.

**`apps/electron/src/main/`:**

- Purpose: Contains the TypeScript source code for the Electron main process. This handles system-level interactions, window management, and IPC communication.
- Contains: Main entry point, IPC handlers, background services.
- Key files: `apps/electron/src/main/index.ts`.

**`apps/electron/src/renderer/`:**

- Purpose: Contains the React (TypeScript/TSX) source code for the Electron renderer process, which is the user interface of the desktop application.
- Contains: React components, hooks, styles, routing, and UI logic.
- Key files: `apps/electron/src/renderer/src/main.tsx`.

**`apps/website/`:**

- Purpose: Contains all code and configurations specific to the marketing website.
- Contains: React source code, public assets, and build configurations.
- Key files: `apps/website/src/main.tsx`, `apps/website/src/index.html`.

**`packages/`:**

- Purpose: Stores reusable code modules and components that can be shared across different applications within the monorepo.
- Contains: `license-api` for backend logic and `ui` for shared frontend components.

**`packages/license-api/`:**

- Purpose: Provides functionality related to license management, likely including API client code and business logic for licensing.
- Contains: TypeScript source files for license-related operations.
- Key files: `packages/license-api/src/index.ts`.

**`packages/ui/`:**

- Purpose: Contains a collection of reusable UI components, possibly built on shadcn/ui and Tailwind CSS, intended for use in both the Electron renderer and the website.
- Contains: React components, utility functions for UI.
- Key files: `packages/ui/src/button.tsx` (example).

## Key File Locations

**Entry Points:**

- `apps/electron/src/main/index.ts`: Electron Main Process entry.
- `apps/electron/src/renderer/src/main.tsx`: Electron Renderer Process (React app) entry.
- `apps/website/src/main.tsx`: Website (React app) entry.

**Configuration:**

- `package.json`: Found in root and within each `apps/` and `packages/` directory, defines project metadata and dependencies.
- `tsconfig.json`: TypeScript configuration files throughout the project.
- `tailwind.config.js`: Tailwind CSS configuration files.
- `.eslintrc.cjs`: ESLint configuration.
- `.prettierrc`: Prettier configuration.

**Core Logic:**

- `apps/electron/src/main/`: Core Electron main process logic.
- `apps/electron/src/renderer/src/`: Core Electron renderer UI logic.
- `apps/website/src/`: Core website UI logic.
- `packages/license-api/src/`: Core licensing logic.

**Testing:**

- Test files are typically co-located with the source files, often named `*.test.ts` or `*.test.tsx`. (Inferred, no explicit test dir found)

## Naming Conventions

**Files:**

- **Entry points:** `index.ts` or `main.tsx`.
- **React Components:** PascalCase (e.g., `ConnectionSelector.tsx`, `QueryEditor.tsx`).
- **Hooks:** `use` prefix (e.g., `useUMAP.ts`).
- **Utilities:** `utils.ts`, descriptive names.
- **Styles:** `globals.css`.

**Directories:**

- Lowercase, often plural for collections of modules (e.g., `components`, `hooks`, `services`).
- Functional naming (e.g., `main`, `renderer`, `license-api`).

## Where to Add New Code

**New Feature (Electron):**

- Primary code: `apps/electron/src/renderer/src/components/` for UI, `apps/electron/src/main/` for main process logic.
- Tests: Co-located with the feature file, e.g., `apps/electron/src/renderer/src/components/MyNewFeature.test.tsx`.

**New Feature (Website):**

- Primary code: `apps/website/src/components/` for UI.
- Tests: Co-located with the feature file, e.g., `apps/website/src/components/MyNewFeature.test.tsx`.

**New Shared UI Component:**

- Implementation: `packages/ui/src/`
- Usage: Import into `apps/electron/src/renderer/` or `apps/website/src/`.

**New Utility Function:**

- Shared helpers: `shared/src/utils/` or a new file within `shared/src/`.
- App-specific helpers: `apps/<app>/src/utils/` or `apps/<app>/src/lib/`.

## Special Directories

**`dist/`:**

- Purpose: Contains compiled and packaged output for production builds.
- Generated: Yes.
- Committed: No (typically ignored by `.gitignore`).

**`out/`:**

- Purpose: Contains build outputs, often for development or intermediate stages.
- Generated: Yes.
- Committed: No (typically ignored by `.gitignore`).

---

_Structure analysis: 2026-01-25_

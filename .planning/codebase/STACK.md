# Technology Stack

**Analysis Date:** 2026-01-25

## Languages & Runtime

| Technology | Version | Purpose                           |
| ---------- | ------- | --------------------------------- |
| TypeScript | ^5.9.3  | Primary language for all apps     |
| Node.js    | -       | Runtime for Electron main process |
| React      | ^19.2.3 | UI framework                      |

## Core Frameworks

**Electron** (v40.0.0)

- Desktop application framework
- Build tools: `electron-vite` ^5.0.0, `electron-builder` ^26.4.0
- Utilities: `@electron-toolkit/preload`, `@electron-toolkit/utils`

**React** (^19.2.3)

- UI rendering for both Electron renderer and website
- Router: `@tanstack/react-router` ^1.154.12
- State: `zustand` ^5.0.10
- Tables: `@tanstack/react-table` ^8.21.3
- Virtual scrolling: `@tanstack/react-virtual` ^3.13.18

**Vite** (^7.3.1)

- Build tool for website
- Website uses `rolldown-vite` (experimental)

## UI Libraries

| Library                | Version  | Purpose              |
| ---------------------- | -------- | -------------------- |
| Tailwind CSS           | ^4.1.18  | Utility-first CSS    |
| shadcn/ui              | ^3.7.0   | UI component library |
| lucide-react           | ^0.562.0 | Icons                |
| framer-motion          | ^12.29.0 | Animations           |
| cmdk                   | ^1.1.1   | Command palette      |
| sonner                 | ^2.0.7   | Toast notifications  |
| vaul                   | ^1.1.2   | Drawer component     |
| react-resizable-panels | ^4.4.1   | Resizable layouts    |

## Database & Data

| Library                         | Version | Purpose                |
| ------------------------------- | ------- | ---------------------- |
| better-sqlite3-multiple-ciphers | ^12.6.2 | SQLite with encryption |
| @libsql/client                  | ^0.17.0 | LibSQL/Turso client    |
| pg                              | ^8.17.2 | PostgreSQL client      |
| mysql2                          | ^3.16.1 | MySQL client           |
| @qdrant/js-client-rest          | ^1.16.2 | Qdrant vector database |

## AI & LLM Integration

| Library                        | Version | Purpose            |
| ------------------------------ | ------- | ------------------ |
| ai (Vercel AI SDK)             | ^6.0.48 | AI utilities       |
| @ai-sdk/anthropic              | ^3.0.23 | Anthropic provider |
| @ai-sdk/openai                 | ^3.0.18 | OpenAI provider    |
| openai                         | ^6.16.0 | OpenAI client      |
| @anthropic-ai/claude-agent-sdk | ^0.2.17 | Claude Agent SDK   |

## Code Editor

| Library              | Version | Purpose       |
| -------------------- | ------- | ------------- |
| monaco-editor        | ^0.55.1 | Code editor   |
| @monaco-editor/react | ^4.7.0  | React wrapper |
| monaco-vim           | ^0.4.4  | Vim mode      |

## Monorepo & Build

| Tool     | Version | Purpose          |
| -------- | ------- | ---------------- |
| pnpm     | 10.28.1 | Package manager  |
| Nx       | ^22.4.1 | Monorepo tooling |
| ESLint   | ^9.39.2 | Linting          |
| Prettier | ^3.8.1  | Formatting       |
| Husky    | ^9.1.7  | Git hooks        |

## Testing

| Tool                   | Version | Purpose         |
| ---------------------- | ------- | --------------- |
| Vitest                 | ^4.0.18 | Test runner     |
| @testing-library/react | ^16.3.2 | React testing   |
| Playwright             | ^1.57.0 | E2E testing     |
| happy-dom              | ^20.3.7 | DOM environment |

## Package Structure

```
sql-pro-monorepo/
├── apps/
│   ├── electron/ (@sqlpro/app)     # Desktop app
│   └── website/ (@sqlpro/website)  # Marketing site
├── packages/
│   ├── ui/ (@sqlpro/ui)            # Shared UI components
│   ├── license-api/ (@sqlpro/license-api) # License API (Cloudflare Worker)
│   └── tsconfig/ (@sqlpro/tsconfig) # Shared TypeScript config
```

## Configuration Files

| File                  | Purpose                      |
| --------------------- | ---------------------------- |
| `package.json`        | Root monorepo config         |
| `pnpm-workspace.yaml` | Workspace definition         |
| `nx.json`             | Nx configuration             |
| `eslint.config.mjs`   | ESLint config (antfu preset) |
| `.prettierrc`         | Prettier config              |
| `tsconfig.json`       | TypeScript config            |

---

_Stack analysis: 2026-01-25_

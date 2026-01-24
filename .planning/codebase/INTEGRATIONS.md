# External Integrations

**Analysis Date:** 2026-01-25

## Databases

**SQLite (Primary)**

- Library: `better-sqlite3-multiple-ciphers` ^12.6.2
- Purpose: Local SQLite database management with SQLCipher encryption support
- Location: `apps/electron/src/main/services/database-adapters/sqlite-adapter.ts`

**PostgreSQL**

- Library: `pg` ^8.17.2
- Purpose: PostgreSQL database connections
- Location: `apps/electron/src/main/services/database-adapters/postgresql-adapter.ts`

**MySQL**

- Library: `mysql2` ^3.16.1
- Purpose: MySQL database connections
- Location: `apps/electron/src/main/services/database-adapters/` (inferred)

**LibSQL/Turso**

- Library: `@libsql/client` ^0.17.0
- Purpose: LibSQL and Turso cloud database support
- Location: `apps/electron/src/main/services/database-adapters/` (inferred)

**Qdrant**

- Library: `@qdrant/js-client-rest` ^1.16.2
- Purpose: Vector database for AI/embedding features
- Location: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

## AI Services

**Anthropic Claude**

- Library: `@ai-sdk/anthropic` ^3.0.23, `@anthropic-ai/claude-agent-sdk` ^0.2.17
- Purpose: AI-powered SQL assistance and agent features
- Configuration: API key via environment/settings

**OpenAI**

- Library: `@ai-sdk/openai` ^3.0.18, `openai` ^6.16.0
- Purpose: Alternative AI provider for SQL assistance
- Configuration: API key via environment/settings

**OpenAI-Compatible APIs**

- Library: `@ai-sdk/openai-compatible` ^2.0.18
- Purpose: Support for local LLMs and compatible providers

## Cloud Services

**Cloudflare Workers**

- Package: `packages/license-api/`
- Framework: Hono ^4.11.5
- Runtime: Wrangler ^4.60.0
- Purpose: License validation API

**Stripe**

- Library: `stripe` ^20.2.0
- Location: `packages/license-api/`
- Purpose: Payment processing for license purchases

**Resend**

- Library: `resend` ^6.8.0
- Location: `packages/license-api/`
- Purpose: Transactional email for license delivery

## Media Processing

**FFmpeg**

- Library: `@ffmpeg-installer/ffmpeg` ^1.1.0, `@ffprobe-installer/ffprobe` ^2.1.2
- Purpose: Video/audio processing for media preview features

**Sharp**

- Library: `sharp` ^0.34.5
- Purpose: Image processing and optimization

## Data Export

**ExcelJS**

- Library: `exceljs` ^4.4.0
- Purpose: Excel file generation for data export

**PapaParse**

- Library: `papaparse` ^5.5.3
- Purpose: CSV parsing and generation

## Visualization

**XY Flow (React Flow)**

- Library: `@xyflow/react` ^12.10.0
- Purpose: ER diagram and query builder visualization

**Dagre**

- Library: `dagre` ^0.8.5
- Purpose: Graph layout for ER diagrams

**html-to-image**

- Library: `html-to-image` ^1.11.13
- Purpose: Export diagrams as images

## Internationalization

**i18next**

- Library: `i18next` ^25.8.0, `react-i18next` ^16.5.3
- Purpose: Multi-language support
- Location: `apps/electron/src/renderer/src/locales/`

## Electron Auto-Update

**electron-updater**

- Library: `electron-updater` ^6.7.3
- Purpose: Auto-update functionality for desktop app

## Storage

**electron-store**

- Library: `electron-store` ^11.0.2
- Purpose: Persistent local storage for app settings

## Logging

**electron-log**

- Library: `electron-log` ^5.4.3
- Purpose: Application logging

## Integration Patterns

**IPC Communication**

- Main ↔ Renderer communication via Electron IPC
- Handlers in `apps/electron/src/main/`
- Invoked from `apps/electron/src/renderer/`

**Plugin System**

- Location: `apps/electron/src/main/services/plugin/`
- API: `apps/electron/src/main/plugin-api/`
- Purpose: Extensibility for custom features

---

_Integration analysis: 2026-01-25_

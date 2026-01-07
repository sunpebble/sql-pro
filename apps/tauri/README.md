# SQL Pro - Tauri Edition

This is the Tauri v2 version of SQL Pro, migrated from Electron. It provides a professional SQLite database manager with SQLCipher support, query editor, schema browser, and more.

## Architecture

```
apps/tauri/
├── src/                    # Frontend (React + TypeScript)
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Entry point
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Utilities and API layer
│   │   ├── tauri-api.ts    # Tauri API adapter (replaces Electron IPC)
│   │   └── plugin-system.ts # Frontend plugin system
│   └── shared/             # Shared types
│       └── types.ts        # TypeScript type definitions
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── lib.rs          # Application setup and menu
│   │   ├── commands/       # Tauri command handlers
│   │   │   ├── database.rs # Database operations
│   │   │   ├── ai.rs       # AI/LLM integration
│   │   │   ├── window.rs   # Window management
│   │   │   └── ...
│   │   ├── services/       # Business logic
│   │   │   ├── database.rs # SQLite/SQLCipher service
│   │   │   └── ...
│   │   └── types/          # Rust type definitions
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
└── project.json            # Nx project configuration
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust (latest stable)
- Platform-specific requirements:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools, WebView2
  - **Linux**: Various development libraries (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run in development mode:

   ```bash
   # From workspace root
   pnpm nx run @sqlpro/tauri:dev

   # Or from this directory
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm nx run @sqlpro/tauri:build
   ```

### Testing

```bash
# Run frontend tests
pnpm test

# Run with coverage
pnpm test -- --coverage
```

## Migration from Electron

### Key Differences

| Feature   | Electron                        | Tauri                        |
| --------- | ------------------------------- | ---------------------------- |
| Backend   | Node.js                         | Rust                         |
| SQLite    | better-sqlite3                  | rusqlite                     |
| SQLCipher | better-sqlite3-multiple-ciphers | rusqlite (bundled-sqlcipher) |
| IPC       | ipcMain/ipcRenderer             | Tauri invoke/events          |
| Store     | electron-store                  | tauri-plugin-store           |
| Keychain  | keytar                          | keyring crate                |
| Dialogs   | dialog module                   | tauri-plugin-dialog          |

### API Compatibility Layer

The `src/lib/tauri-api.ts` provides a compatible API that mirrors the Electron preload structure:

```typescript
// Electron (before)
window.sqlPro.db.open({ path: '/path/to/db' });

// Tauri (after)
import { sqlProAPI } from '@/lib/tauri-api';
sqlProAPI.db.open({ path: '/path/to/db' });
```

### Component Migration

1. Replace `window.sqlPro` calls with imports from `tauri-api.ts`
2. Use Tauri's event system for IPC events
3. Update file dialogs to use `@tauri-apps/plugin-dialog`

## Features

### Implemented

- ✅ SQLite database connection with SQLCipher support
- ✅ Schema browsing (tables, views, columns, indexes)
- ✅ Query execution with results display
- ✅ Data pagination and filtering
- ✅ Password storage in system keychain
- ✅ Preferences storage
- ✅ Query history
- ✅ Native menus
- ✅ Multi-window support
- ✅ AI integration (OpenAI/Anthropic)

### Planned

- ⏳ Full UI component migration from Electron version
- ⏳ MySQL/PostgreSQL adapters
- ⏳ Schema comparison
- ⏳ ER diagram visualization
- ⏳ Auto-updater integration

## Plugin System

The Tauri version uses a frontend-only plugin system. Plugins run in the web context and can:

- Register custom menu commands
- Hook into query execution
- Extend UI functionality

```typescript
import { pluginManager } from '@/lib/plugin-system';

// Load a plugin
await pluginManager.loadPlugin(manifest, pluginModule);
await pluginManager.enablePlugin('my-plugin', context);
```

## License

MIT

# SQL Pro

This is the Tauri v2 version of SQL Pro, a professional SQLite database manager with SQLCipher support, query editor, schema browser, and more.

## Architecture

```
apps/tauri/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # React hooks
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Utilities and API layer
│   │   ├── api.ts          # Tauri API adapter
│   │   └── plugin-system.ts # Frontend plugin system
│   └── shared/             # Shared types
└── src-tauri/              # Rust backend
    └── src/
        ├── commands/       # Tauri command handlers
        └── services/       # Business logic (database, encryption, etc.)
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Building

```bash
# Build for current platform
pnpm build

# Build for specific platforms
pnpm build:mac    # macOS Universal (Intel + Apple Silicon)
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

## Features

### Implemented ✅

- SQLite database support with SQLCipher encryption
- Multiple database connections with tab interface
- Schema browser (tables, views, indexes)
- Data grid with inline editing
- Diff preview for changes
- SQL query editor with Monaco
- Query results with export
- Dark/Light theme support
- Keyboard shortcuts (customizable)
- ER diagram visualization
- Command palette
- File watcher for external changes
- Auto-updater

### Architecture Highlights

| Feature   | Implementation                       |
| --------- | ------------------------------------ |
| Backend   | Rust                                 |
| Frontend  | React + TypeScript                   |
| SQLCipher | rusqlite (bundled-sqlcipher feature) |
| IPC       | Tauri invoke/events                  |
| Store     | tauri-plugin-store                   |
| Keychain  | keyring crate                        |
| Dialogs   | tauri-plugin-dialog                  |

## API Layer

The `src/lib/api.ts` provides a type-safe API that wraps Tauri commands:

```typescript
// Open a database
const result = await sqlPro.db.open({ path: '/path/to/db' });

// Execute a query
const queryResult = await sqlPro.db.executeQuery({
  connectionId: 'xxx',
  query: 'SELECT * FROM users',
});

// Listen for events
sqlPro.menu.onAction((action) => {
  console.log('Menu action:', action);
});
```

## Tauri Commands

All database operations are implemented as Tauri commands in `src-tauri/src/commands/`:

- `db_open` - Open a database connection
- `db_close` - Close a connection
- `db_get_schema` - Get database schema
- `db_get_table_data` - Query table data with pagination
- `db_execute_query` - Execute raw SQL
- `db_apply_changes` - Apply data modifications
- And more...

## License

MIT

# Quarry — Native SwiftUI App

A native macOS rebuild of Quarry as a SwiftPM package. It targets the
SQLite/SQLCipher workflow with additional PostgreSQL and MySQL support, and
mirrors the Electron app's feature set without the Chromium runtime.

## Requirements

- macOS 14+
- Swift toolchain (Xcode 15+)
- Homebrew libraries the engines link against:

  ```sh
  brew install sqlcipher postgresql@16 mysql
  ```

  `Package.swift` links `sqlcipher` and adds `/opt/homebrew/lib` to the linker
  search path; `CLibPQ` and `CMySQL` are system-library targets wrapping the
  Homebrew `libpq` and `libmysqlclient` headers.

## Build, test, run

```sh
swift build            # debug build
swift test             # 11 server tests skip without live PG/MySQL
swift run QuarrySwiftUI # or open the packaged app (see Packaging)
```

Server integration tests are environment-gated. To run them, export
connection env vars (see `PostgresEngineTests` / `MySQLEngineTests`). The
encrypted-fixture test is likewise gated on `QUARRY_ENC_DB_PATH` /
`QUARRY_ENC_DB_PASSWORD`.

## Layout

Two targets keep the database logic testable without a UI:

- **`QuarryCore`** — engine + data layer, no SwiftUI.
  - `DatabaseEngine.swift` — the protocol every engine conforms to.
  - `SQLiteDatabase.swift` — SQLite/SQLCipher via the system `sqlite3` binding.
  - `PostgresEngine.swift` / `MySQLEngine.swift` — remote engines.
  - `SSHTunnel.swift` — optional local port-forward for server connections.
  - Import/export (`CSV*`, `JSON*`), `SchemaDiff`, `MockDataGenerator`,
    `DemoDatabase`, `QueryLibrary`, `PluginRegistry`, `AIAssistant`.
- **`QuarrySwiftUI`** — the app.
  - `AppState.swift` — the `@MainActor` observable holding all view state.
  - `RootView.swift` + `*Workspace.swift` — one view file per workspace mode
    (Data, SQL, Search, Diagram, AI, Maintenance, Plugins).
  - `DataTableView.swift` — `NSTableView`-backed grid (native row reuse); the
    perf-critical piece SwiftUI lazy stacks could not deliver.
  - `Commands.swift` — menu bar + keyboard shortcuts.
  - `Theme.swift` — Sunpebble brand tokens (see `../../BRAND.md`).
  - `Resources/*.lproj` — EN / zh-Hans localizations (`L(_:)` in `L10n.swift`).

## Packaging & release

`scripts/package-app.sh <version>` builds a release binary, assembles
`Quarry.app`, recursively bundles the Homebrew dylibs it links (rewriting
install names to `@executable_path/../Frameworks`), and code-signs it. It uses
a Developer ID identity when present and falls back to ad-hoc signing for local
dev (ad-hoc skips hardened runtime, which would otherwise reject the
non-Team-ID dylibs).

Releases are driven by release-please: `apps/swiftui` is registered as the
`quarry-swiftui` component. Merging a release PR triggers the `build-swiftui`
job in `.github/workflows/release.yml`, which signs, notarizes, staples, and
attaches the zip to the GitHub Release.

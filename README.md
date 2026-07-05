# Quarry

<p align="center">
  <img src="packages/docs/public/logo.svg" width="128" height="128" alt="Quarry Logo">
</p>

<p align="center">
  <strong>Professional database manager for macOS — native, fast, and encrypted-database ready</strong>
</p>

<p align="center">
  <a href="https://github.com/sunpebble/quarry/releases"><img src="https://img.shields.io/github/v/release/sunpebble/quarry" alt="Release"></a>
  <a href="https://github.com/sunpebble/quarry/blob/main/LICENSE"><img src="https://img.shields.io/github/license/sunpebble/quarry" alt="License"></a>
  <a href="https://github.com/sunpebble/quarry/actions"><img src="https://img.shields.io/github/actions/workflow/status/sunpebble/quarry/release.yml" alt="Build Status"></a>
  <a href="https://sunpebble.github.io/quarry/"><img src="https://img.shields.io/badge/docs-blue?style=flat&logo=readthedocs&logoColor=white" alt="Documentation"></a>
</p>

> 🚀 A native macOS database manager built with SwiftUI. Supports SQLite (including SQLCipher-encrypted databases), PostgreSQL, and MySQL — with schema/data comparison, diff-previewed editing, SSH tunnels, and full English/Chinese localization.

## ✨ Features

### 🗄️ Database Management

- **SQLite & SQLCipher** — open encrypted databases; passwords live in the macOS Keychain
- **PostgreSQL & MySQL** — direct connections or through an SSH tunnel
- **Multiple sessions** — several databases open side by side
- **Connection profiles** — saved connections with one-click reconnect

### ✏️ Data Operations

- **Inline editing** with pending-changes review before anything is written
- **Bulk edit / delete** across selected rows
- **CSV / JSON import**, **CSV / JSON / SQL export**
- **Mock data generator** and demo database
- **Column statistics** — top-value distribution for any column

### 📝 Query Tools

- **SQL editor** with query plan (EXPLAIN) view
- **Query library** — history and saved queries, searchable
- **SQL log** — every executed statement with timing
- **Full-database search** across all tables

### 🔍 Comparison

- **Schema compare** between any two open sessions, with migration SQL
- **Data compare** by primary key, with generated sync SQL (INSERT/UPDATE/DELETE)
- **Schema snapshots** for point-in-time comparison

### 🖼️ Visualization & UX

- **ER diagram** of tables and foreign-key relationships
- **Maintenance tools** — integrity check, optimize, vacuum, backup/restore
- **English & Chinese** localization; native menus and keyboard shortcuts

## 📦 Installation

Download the latest `Quarry-*.zip` from [Releases](https://github.com/sunpebble/quarry/releases) (Apple Silicon, notarized), unzip, and drop `Quarry.app` into `/Applications`.

### Build from Source

Requirements: macOS 14+, Xcode command line tools, [Homebrew](https://brew.sh).

```bash
git clone https://github.com/sunpebble/quarry.git
cd quarry
brew install sqlcipher postgresql@16 mysql

swift run --package-path apps/swiftui   # development
swift test --package-path apps/swiftui  # tests
```

## 🛠️ Development

### Project Structure

```
├── apps/
│   ├── swiftui/            # Native macOS app (SwiftPM)
│   │   ├── Sources/QuarryCore/     # Engines & pure logic (unit-tested)
│   │   ├── Sources/QuarrySwiftUI/  # SwiftUI interface
│   │   └── Tests/
│   └── video/              # Remotion promo video
├── packages/
│   ├── docs/               # VitePress documentation
│   ├── cloudflare/         # Cloudflare Workers backend
│   ├── license-api/        # Pro license API (Stripe)
│   └── tsconfig/           # Shared TypeScript configs
└── nx.json                 # Nx monorepo configuration
```

### Available Scripts

```bash
pnpm dev          # swift run (the macOS app)
pnpm build        # swift build
pnpm test         # swift test
pnpm lint         # eslint (workers & docs code)
pnpm typecheck    # cloudflare + license-api
pnpm docs:dev     # docs site
```

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, testing, commit format, and the PR process.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Found a vulnerability? Please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

---

<p align="center">
  <strong>Built with ❤️ by the Quarry team</strong><br>
  <a href="https://sunpebble.github.io/quarry/">Documentation</a> •
  <a href="https://github.com/sunpebble/quarry/issues">Issues</a> •
  <a href="https://github.com/sunpebble/quarry/discussions">Discussions</a> •
  <a href="https://github.com/sunpebble/quarry/releases">Releases</a>
</p>

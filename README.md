# SQL Pro

<p align="center">
  <img src="apps/electron/resources/icon.svg" width="128" height="128" alt="SQL Pro Logo">
</p>

<p align="center">
  <strong>Professional SQLite database manager with SQLCipher support and diff preview</strong>
</p>

<p align="center">
  <a href="https://github.com/kunish-homelab/sql-pro/releases"><img src="https://img.shields.io/github/v/release/kunish-homelab/sql-pro" alt="Release"></a>
  <a href="https://github.com/kunish-homelab/sql-pro/blob/main/LICENSE"><img src="https://img.shields.io/github/license/kunish-homelab/sql-pro" alt="License"></a>
  <a href="https://github.com/kunish-homelab/sql-pro/actions"><img src="https://img.shields.io/github/actions/workflow/status/kunish-homelab/sql-pro/release.yml" alt="Build Status"></a>
  <a href="https://kunish-homelab.github.io/sql-pro/"><img src="https://img.shields.io/badge/docs-blue?style=flat&logo=readthedocs&logoColor=white" alt="Documentation"></a>
</p>

> 🚀 A modern, cross-platform SQLite database manager built with Electron, React, and TypeScript. Features include encrypted database support, visual diff preview for changes, AI-powered query tools, and comprehensive internationalization.

## ✨ Features

<table>
<tr>
<td width="50%">

### 🗄️ Database Management

- **SQLite & SQLCipher** support
- **Encrypted databases** with secure password storage
- **Multiple connections** with tab-based interface
- **Connection profiles** for quick access

### 📝 Query Tools

- **Monaco editor** with syntax highlighting
- **Intelligent autocomplete** for tables and columns
- **Vim mode** for power users
- **Query history** with search and rerun

</td>
<td width="50%">

### ✏️ Data Operations

- **Inline editing** in data grid
- **Diff preview** before applying changes
- **Bulk operations** for multiple rows
- **Advanced filtering** across all columns

### 🤖 AI Integration

- **Natural Language to SQL** conversion
- **Multiple AI providers** (Anthropic, OpenAI, Custom)
- **Claude Code** integration for advanced queries
- **Per-provider settings** with independent configuration

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Visualization

- **ER diagrams** with relationships
- **Schema browser** with structure view
- **Dark/Light theme** auto-switching
- **Customizable keyboard shortcuts**

</td>
<td width="50%">

### 🌍 Internationalization

- **Multi-language support** (English, Chinese)
- **Full UI translation** coverage
- **Locale-aware formatting**

</td>
</tr>
</table>

> 📚 **[View full documentation →](https://kunish-homelab.github.io/sql-pro/)**

## 📦 Installation

### Quick Start

Download the latest release for your platform:

| Platform             | Download                                                                      | Architecture        |
| -------------------- | ----------------------------------------------------------------------------- | ------------------- |
| 🍎 macOS (Universal) | [sql-pro-x.x.x.dmg](https://github.com/kunish-homelab/sql-pro/releases)       | M1/M2/M3/M4 + Intel |
| 🪟 Windows           | [sql-pro-x.x.x-setup.exe](https://github.com/kunish-homelab/sql-pro/releases) | x64                 |
| 🐧 Linux (AppImage)  | [sql-pro-x.x.x.AppImage](https://github.com/kunish-homelab/sql-pro/releases)  | x64                 |
| 🐧 Linux (deb)       | [sql-pro-x.x.x.deb](https://github.com/kunish-homelab/sql-pro/releases)       | x64                 |

> 💡 **New to SQL Pro?** Check out our [Getting Started Guide](https://kunish-homelab.github.io/sql-pro/getting-started/) for detailed installation instructions and first-time setup.

### Build from Source

**Prerequisites:** Node.js 24+, pnpm 10+

```bash
# Clone the repository
git clone https://github.com/kunish-homelab/sql-pro.git
cd sql-pro

# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for your platform
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

> 🔧 For development setup and contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

## 🚀 Quick Usage

1. **Open a Database** → Click "Open Database" or press `Cmd/Ctrl + O`
2. **Browse Schema** → Navigate tables and views in the sidebar
3. **Query Data** → Write SQL in the editor and press `Cmd/Ctrl + Enter`
4. **Edit Data** → Double-click cells to edit, review changes in diff preview
5. **Apply Changes** → Click "Apply Changes" or press `Cmd/Ctrl + S`

### Essential Keyboard Shortcuts

| Action          | macOS         | Windows/Linux  |
| --------------- | ------------- | -------------- |
| Execute query   | `Cmd + Enter` | `Ctrl + Enter` |
| Apply changes   | `Cmd + S`     | `Ctrl + S`     |
| Open database   | `Cmd + O`     | `Ctrl + O`     |
| Command palette | `Cmd + K`     | `Ctrl + K`     |
| Toggle sidebar  | `Cmd + B`     | `Ctrl + B`     |

> ⌨️ **[See all shortcuts →](https://kunish-homelab.github.io/sql-pro/shortcuts)**

## 🛠️ Development

### Project Structure

```
sql-pro/
├── apps/
│   ├── electron/           # Electron application
│   │   ├── src/
│   │   │   ├── main/       # Main process (Node.js)
│   │   │   ├── preload/    # Preload scripts
│   │   │   ├── renderer/   # React frontend
│   │   │   └── shared/     # Shared types
│   │   └── resources/      # App icons and assets
│   └── website/            # Official website
├── packages/
│   ├── docs/               # VitePress documentation
│   ├── plugin-sdk/         # Plugin development SDK
│   ├── tsconfig/           # Shared TypeScript configs
│   └── ui/                 # Shared UI components
└── nx.json                 # Nx monorepo configuration
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server

# Building
pnpm build            # Build application
pnpm build:mac        # Build for macOS
pnpm build:win        # Build for Windows
pnpm build:linux      # Build for Linux

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type checking

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Generate coverage report

# Documentation
pnpm docs:dev         # Start docs dev server
pnpm docs:build       # Build documentation
```

> 📖 **For detailed development guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)**

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/sql-pro.git
cd sql-pro
pnpm install
pnpm dev
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines, including:

- Code style and conventions
- Testing requirements
- Commit message format
- Pull request process

## 🗺️ Roadmap

We're actively developing SQL Pro with exciting features planned. See our [detailed roadmap](https://github.com/kunish-homelab/sql-pro/issues) for the full list.

### Current Focus (Q1 2025)

- 🔌 **Plugin System** - Extensible architecture for custom functionality
- 📊 **Query Optimizer** - AI-powered query analysis and suggestions
- 🔄 **Schema Comparison** - Compare and sync database schemas
- 📥 **Data Import/Export** - Enhanced CSV, JSON, and Excel support
- 🔍 **Full-text Search** - Fast search across all database content

### Completed ✓

- ✅ Vim mode support (Editor & App navigation)
- ✅ Customizable keyboard shortcuts
- ✅ Bulk edit operations
- ✅ Query history with search
- ✅ ER diagram visualization
- ✅ AI-powered Natural Language to SQL
- ✅ Multi-language support (i18n)
- ✅ Per-provider AI settings

> 💡 **Have a feature idea?** [Open a feature request](https://github.com/kunish-homelab/sql-pro/issues/new?template=feature_request.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Found a vulnerability? Please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

## 🙏 Acknowledgments

SQL Pro is built with amazing open-source technologies:

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** - VS Code's editor
- **[TanStack Table](https://tanstack.com/table)** - Headless table library
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** - SQLite bindings for Node.js
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[Nx](https://nx.dev/)** - Monorepo build system

Special thanks to all [contributors](https://github.com/kunish-homelab/sql-pro/graphs/contributors) who have helped make SQL Pro better!

---

<p align="center">
  <strong>Built with ❤️ by the SQL Pro team</strong><br>
  <a href="https://kunish-homelab.github.io/sql-pro/">Documentation</a> •
  <a href="https://github.com/kunish-homelab/sql-pro/issues">Issues</a> •
  <a href="https://github.com/kunish-homelab/sql-pro/discussions">Discussions</a> •
  <a href="https://github.com/kunish-homelab/sql-pro/releases">Releases</a>
</p>

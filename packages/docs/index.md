---
layout: home

hero:
  name: Quarry
  text: Native macOS Database Manager
  tagline: Open-source database management for SQLite, PostgreSQL, and MySQL — with SQLCipher support, diff preview, and powerful query tools
  image:
    src: /logo.svg
    alt: Quarry Logo
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View Features
      link: /features/
    - theme: alt
      text: GitHub
      link: https://github.com/sunpebble/quarry

features:
  - icon: 🗄️
    title: SQLite, PostgreSQL & MySQL
    details: Open regular SQLite and encrypted SQLCipher databases, or connect to PostgreSQL and MySQL servers — optionally through an SSH tunnel.

  - icon: 📝
    title: Native SQL Editor
    details: A fast native editor with an EXPLAIN query plan view, a query library of history and favorites, and a full SQL log.

  - icon: 🔍
    title: Schema Browser & Search
    details: Browse tables with filtering, sorting, and pagination. Search across every table in the database with one shortcut.

  - icon: ✏️
    title: Inline Data Editing
    details: Edit data directly in the table view with cell-level editing and batch edits. Review all pending changes before applying them.

  - icon: 🎯
    title: Diagrams & Comparison
    details: Interactive ER diagrams, column distribution statistics, schema snapshots with migration SQL, and cross-session data comparison with sync SQL.

  - icon: 🍎
    title: Built for macOS
    details: A native SwiftUI app for macOS 14+ with Keychain-backed connection profiles, maintenance tools, and English/Chinese localization.
---

## Quick Start

Get up and running with Quarry in minutes:

1. **Download** the latest `Quarry-*.zip` from [GitHub Releases](https://github.com/sunpebble/quarry/releases)
2. **Unzip** and drag **Quarry.app** into your **Applications** folder
3. **Open** a SQLite or SQLCipher database file, or connect to a PostgreSQL/MySQL server
4. **Start** browsing and querying your data

Ready to dive deeper? Check out our [Getting Started guide](/getting-started/) for detailed instructions.

## Screenshots

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 2rem;">
  <div>
    <img src="/screenshots/welcome-dark.png" alt="Quarry Welcome Screen showing recent databases and quick actions" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <p style="text-align: center; margin-top: 0.5rem; color: var(--vp-c-text-2);">Welcome Screen</p>
  </div>
  <div>
    <img src="/screenshots/database-dark.png" alt="Quarry Database View showing schema browser and data grid" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <p style="text-align: center; margin-top: 0.5rem; color: var(--vp-c-text-2);">Database View</p>
  </div>
  <div>
    <img src="/screenshots/query-dark.png" alt="Quarry Query Editor with results" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <p style="text-align: center; margin-top: 0.5rem; color: var(--vp-c-text-2);">Query Editor</p>
  </div>
  <div>
    <img src="/screenshots/table-dark.png" alt="Quarry Table View with inline editing capabilities" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <p style="text-align: center; margin-top: 0.5rem; color: var(--vp-c-text-2);">Table View</p>
  </div>
</div>

## Why Quarry?

| Feature                 | Quarry                     | Other Tools          |
| ----------------------- | -------------------------- | -------------------- |
| **Open Source**         | ✅ MIT Licensed            | Often proprietary    |
| **SQLCipher Support**   | ✅ Built-in                | Requires plugins     |
| **Diff Preview**        | ✅ Review before save      | Direct modifications |
| **Native App**          | ✅ SwiftUI, no web runtime | Electron wrappers    |
| **Secure Storage**      | ✅ macOS Keychain          | Plain text files     |
| **No Account Required** | ✅ Fully offline           | Cloud dependencies   |

## Keyboard-First Design

Quarry is designed for power users who prefer keyboard navigation:

- **`⌘R`** — Run SQL query
- **`⇧⌘E`** — Explain query
- **`⌘S`** — Save query to the library
- **`⇧⌘F`** — Search all tables

See the complete [Keyboard Shortcuts Reference](/shortcuts) for all available shortcuts.

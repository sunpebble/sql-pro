# Features Overview

Quarry is a native macOS database manager packed with powerful features designed for developers, data analysts, and database administrators. This guide provides an overview of all major features and links to detailed documentation for each.

::: info Quick Navigation
Jump to: [Query Editor](#query-editor) • [Schema Browser](#schema-browser) • [Data Editing](#data-editing) • [ER Diagram](#er-diagram) • [Query Library](#query-library) • [SQLCipher](#sqlcipher-support)
:::

## Core Features

Quarry combines essential database management tools with advanced features that set it apart from other database tools.

### Query Editor

Write, execute, and inspect SQL queries with a fast native editor.

| Capability        | Description                                        |
| ----------------- | -------------------------------------------------- |
| **Native Editor** | A responsive SQL editor built with native macOS UI |
| **EXPLAIN View**  | Inspect the query execution plan with one shortcut |
| **Query Library** | Save queries and browse execution history          |
| **SQL Log**       | Every statement the app runs, in one place         |

::: tip Keyboard Shortcut
Run queries instantly with <kbd>⌘</kbd> + <kbd>R</kbd>, or explain them with <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd>
:::

[**Learn more about the Query Editor →**](./query-editor)

---

### Schema Browser

Navigate your database structure with an intuitive sidebar, and dig deeper with search and statistics.

| Capability            | Description                                         |
| --------------------- | --------------------------------------------------- |
| **Table List**        | Browse all tables and views in the database         |
| **Search All Tables** | Full-database search across every table             |
| **Column Statistics** | Distribution statistics for any column              |
| **Schema Snapshots**  | Save snapshots and compare them, with migration SQL |

[**Learn more about the Schema Browser →**](./schema-browser)

---

### Data Editing

Edit data directly in the table view with a pending-changes preview before committing. This approach prevents accidental data modifications.

| Capability              | Description                           |
| ----------------------- | ------------------------------------- |
| **Inline Editing**      | Edit cells directly in the data grid  |
| **Pending Changes**     | Review all changes before applying    |
| **Batch Editing**       | Update many rows in one operation     |
| **Filtering & Sorting** | Filter, sort, and paginate table data |

::: warning Safe Editing
All changes are staged until you explicitly apply them. This prevents accidental data loss.
:::

[**Learn more about Data Editing →**](./data-editing)

---

### ER Diagram

Visualize your database structure with an entity-relationship diagram. Understand table relationships at a glance.

| Capability                     | Description                                |
| ------------------------------ | ------------------------------------------ |
| **Relationship Visualization** | See foreign key connections between tables |
| **Table Details**              | Columns and key indicators per table       |

::: tip Quick Access
Open the ER Diagram with <kbd>⌘</kbd> + <kbd>D</kbd>
:::

[**Learn more about ER Diagrams →**](./er-diagram)

---

### Query Library

Never lose a query again. Quarry keeps a history of executed queries and lets you save favorites for reuse.

| Capability    | Description                                   |
| ------------- | --------------------------------------------- |
| **History**   | Recently executed queries                     |
| **Favorites** | Save queries with <kbd>⌘</kbd> + <kbd>S</kbd> |
| **SQL Log**   | Full log of statements the app ran            |

[**Learn more about the Query Library →**](./query-history)

---

### SQLCipher Support

Work with encrypted SQLite databases using industry-standard SQLCipher encryption. Quarry handles password management securely.

| Capability                  | Description                                  |
| --------------------------- | -------------------------------------------- |
| **Encrypted Databases**     | Open SQLCipher-encrypted SQLite files        |
| **Secure Password Storage** | Passwords stored in the macOS Keychain       |
| **Seamless Workflow**       | Work with encrypted databases like any other |

[**Learn more about SQLCipher Support →**](./sqlcipher)

---

## More Features

Beyond the core features above, Quarry includes:

| Feature                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| **Multiple Sessions**    | Work with several databases at once                           |
| **Connection Profiles**  | Save server connections; credentials go to the macOS Keychain |
| **SSH Tunnel**           | Reach remote PostgreSQL/MySQL servers securely                |
| **Data Comparison**      | Compare data across sessions and generate sync SQL            |
| **Maintenance Tools**    | Integrity check, optimize, vacuum, backup, and restore        |
| **Import**               | Import CSV and JSON files into tables                         |
| **Export**               | Export to CSV, JSON, or SQL                                   |
| **Mock Data Generation** | Generate realistic test data                                  |
| **Demo Database**        | Create a sample database to explore the app                   |
| **Localization**         | English and Chinese interfaces                                |

## Feature Comparison

See how Quarry compares to other database tools:

| Feature                | Quarry                    | Typical Tools       |
| ---------------------- | ------------------------- | ------------------- |
| **SQLite Support**     | ✅ Full                   | ✅ Full             |
| **SQLCipher Support**  | ✅ Built-in               | ❌ Requires plugins |
| **PostgreSQL / MySQL** | ✅ With SSH tunnel        | ⚠️ Varies           |
| **Diff Preview**       | ✅ Pending-changes review | ❌ Direct edits     |
| **Schema Compare**     | ✅ With migration SQL     | ⚠️ Limited          |
| **Native macOS App**   | ✅ SwiftUI                | ❌ Electron/web     |
| **Open Source**        | ✅ MIT License            | ❌ Proprietary      |

## Quick Start by Use Case

### For Data Analysis

1. [Open your database](/getting-started/first-connection)
2. [Browse the schema](/features/schema-browser) to understand the data structure
3. [Write queries](/features/query-editor) to extract insights
4. Export results as CSV or JSON for further analysis

### For Database Development

1. [Create your database](/getting-started/first-connection)
2. [Define tables](/features/query-editor) using CREATE statements
3. [Visualize relationships](/features/er-diagram) with ER diagrams
4. [Edit test data](/features/data-editing) directly in the grid, or generate mock data

### For Secure Data Management

1. [Connect to an encrypted database](/features/sqlcipher)
2. [Review data](/features/schema-browser) with secure access
3. [Make changes](/features/data-editing) with pending-changes preview
4. Passwords securely stored in the macOS Keychain

## Keyboard-First Design

Quarry is designed for power users who prefer keyboard navigation. Every major feature is accessible via keyboard shortcuts.

| Action            | Shortcut                                   |
| ----------------- | ------------------------------------------ |
| Run Query         | <kbd>⌘</kbd> + <kbd>R</kbd>                |
| Explain Query     | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd> |
| Search All Tables | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd> |
| ER Diagram        | <kbd>⌘</kbd> + <kbd>D</kbd>                |
| Compare           | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>D</kbd> |

[**See all keyboard shortcuts →**](/shortcuts)

## Next Steps

Ready to dive deeper into Quarry?

### Learn More

- 📚 [Getting Started Guide](/getting-started/) - New user setup and first connection
- ⌨️ [Keyboard Shortcuts](/shortcuts) - Master keyboard navigation for faster workflows
- 🛠️ [Troubleshooting](/troubleshooting) - Solutions for common issues

### Get Involved

- 💬 [GitHub Discussions](https://github.com/sunpebble/quarry/discussions) - Ask questions and share ideas
- 🐛 [Report an Issue](https://github.com/sunpebble/quarry/issues) - Found a bug? Let us know
- 🤝 [Contributing Guide](https://github.com/sunpebble/quarry/blob/main/CONTRIBUTING.md) - Help improve Quarry

### Stay Updated

- ⭐ [Star on GitHub](https://github.com/sunpebble/quarry) - Show your support
- 📦 [Latest Releases](https://github.com/sunpebble/quarry/releases) - Download the newest version
- 📝 [Changelog](https://github.com/sunpebble/quarry/blob/main/CHANGELOG.md) - See what's new

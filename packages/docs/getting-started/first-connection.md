# Your First Database Connection

This guide walks you through opening your first database in Quarry, understanding the interface, and running your first SQL query.

## Opening Quarry

After [installing Quarry](/getting-started/installation), launch the application from your Applications folder or Spotlight search.

You'll see the welcome screen:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/welcome-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/welcome.png">
  <img alt="Quarry Welcome Screen - showing the main interface with Open Database button" src="/screenshots/welcome-dark.png">
</picture>

## Opening a Database

Quarry supports SQLite databases (including encrypted SQLCipher databases) as well as PostgreSQL and MySQL servers.

### Opening an Existing SQLite Database

1. Choose **File → Open Database…**, or use the keyboard shortcut <kbd>⌘</kbd> + <kbd>O</kbd>

2. Navigate to your SQLite database file (`.db`, `.sqlite`, `.sqlite3`, or `.db3` extensions)

3. Click **Open**

::: tip Creating a Test Database
If you don't have a database to test with, use **File → Create Demo Database…** to generate a sample database, or create one from the terminal:

```bash
sqlite3 test.db "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT); INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com'), ('Bob', 'bob@example.com');"
```

This creates a simple database with a `users` table.
:::

### Opening an Encrypted Database (SQLCipher)

If your database is encrypted with SQLCipher:

1. Choose **File → Open Encrypted Database…** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>O</kbd>)

2. Select the encrypted file and enter your password in the dialog

3. Optionally save the password securely in the macOS Keychain via a connection profile

::: info Secure Password Storage
Quarry stores passwords in the macOS Keychain. Your passwords are never stored in plain text.
:::

### Connecting to a Server (PostgreSQL / MySQL)

1. Choose **File → Connect to Server…** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>K</kbd>)

2. Enter the host, port, database, username, and password

3. Optionally enable an **SSH tunnel** for remote servers

4. Save the connection as a profile to reuse it later — credentials go to the macOS Keychain

## Understanding the Interface

Once your database is open, you'll see the main workspace:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/database-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/database.png">
  <img alt="Quarry Database View - showing the schema browser, data grid, and query editor" src="/screenshots/database-dark.png">
</picture>

### Main Areas

| Area             | Description                                |
| ---------------- | ------------------------------------------ |
| **Sidebar**      | Browse tables and views in your database   |
| **Data Grid**    | View and edit data from the selected table |
| **Query Editor** | Write and execute SQL queries              |

### Sidebar Navigation

The sidebar shows your database schema:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/07-sidebar-tables-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/07-sidebar-tables.png">
  <img alt="Quarry sidebar showing tables list" src="/screenshots/07-sidebar-tables-dark.png">
</picture>

Click any table name to view its data in the data grid.

## Viewing Table Data

Click on a table in the sidebar to view its contents:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/table-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/table.png">
  <img alt="Quarry table view showing data grid with rows and columns for editing and browsing" src="/screenshots/table-dark.png">
</picture>

### Data Grid Features

- **Sortable columns** - Click column headers to sort
- **Filtering** - Narrow down rows with the filter bar
- **Pagination** - Navigate large tables page by page
- **Inline editing** - Change values directly in the grid, with a pending-changes preview before anything is written

## Running Your First Query

Switch to the SQL workspace to write and execute custom SQL queries.

Try this simple query:

```sql
SELECT * FROM users LIMIT 10;
```

Execute it with <kbd>⌘</kbd> + <kbd>R</kbd> or the **Run Query** menu item. Results appear below the editor.

To see how the database will execute a query, use **Query → Explain Query** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd>) to open the query plan view.

## Quick Reference: Essential Shortcuts

| Action                  | Shortcut                                   |
| ----------------------- | ------------------------------------------ |
| New database            | <kbd>⌘</kbd> + <kbd>N</kbd>                |
| Open database           | <kbd>⌘</kbd> + <kbd>O</kbd>                |
| Open encrypted database | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>O</kbd> |
| Connect to server       | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>K</kbd> |
| Run query               | <kbd>⌘</kbd> + <kbd>R</kbd>                |
| Explain query           | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd> |
| Search all tables       | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd> |

See the complete [Keyboard Shortcuts](/shortcuts) reference for all available shortcuts.

## Recent Connections

Quarry remembers your recently opened databases. Access them from:

- The welcome screen's **Recent** list
- The **File → Open Recent** menu

## Troubleshooting Connection Issues

### Database Won't Open

**Symptoms**: Error message when opening a file

**Solutions**:

1. Verify the file is a valid SQLite database
2. Check file permissions - you need read access
3. Ensure the file isn't locked by another application

### Encrypted Database Errors

**Symptoms**: "Database is encrypted" or wrong password errors

**Solutions**:

1. Verify you're using the correct password
2. Ensure the database was created with SQLCipher (not another encryption)
3. Remove any stale saved credential from the Keychain and enter the password again

For more solutions, see the [Troubleshooting Guide](/troubleshooting).

## Next Steps

Now that you've connected to your first database:

- [Explore the Query Editor](/features/query-editor) - Run queries and inspect query plans
- [Browse Schema Details](/features/schema-browser) - Understand your database structure
- [Edit Data Inline](/features/data-editing) - Make changes directly in the data grid
- [View ER Diagrams](/features/er-diagram) - Visualize table relationships
- [Learn All Shortcuts](/shortcuts) - Master the keyboard for faster workflows

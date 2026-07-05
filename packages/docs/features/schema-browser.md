# Schema Browser

The Schema Browser provides a comprehensive view of your database structure, allowing you to explore tables and views and navigate your data quickly.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/database-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/database.png">
  <img alt="Quarry Schema Browser showing database tables in the sidebar" src="/screenshots/database-dark.png">
</picture>

## Key Features

| Feature               | Description                                           |
| --------------------- | ----------------------------------------------------- |
| **Table List**        | All tables and views in your database                 |
| **Table Browsing**    | Filtering, sorting, and pagination on any table       |
| **Search All Tables** | Full-database search across every table               |
| **Column Statistics** | Distribution statistics for column values             |
| **Schema Snapshots**  | Save and compare schema snapshots, with migration SQL |

## Sidebar Navigation

The sidebar on the left side of Quarry lists the tables and views in your database. Click on any table or view to load its data in the data grid.

## Browsing Table Data

Once a table is selected you can:

- **Filter** rows to narrow down the data
- **Sort** by clicking column headers
- **Paginate** through large tables
- **Refresh** the table with <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>R</kbd>

For editing, see the [Data Editing guide](/features/data-editing).

## Search All Tables

Search the entire database at once:

1. Choose **Database → Search All Tables** or press <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd>
2. Enter your search term
3. Quarry searches every table and lists the matching rows grouped by table

This is the fastest way to find a value when you don't know which table it lives in.

## Column Statistics

Quarry can compute distribution statistics for a column — value frequencies and distributions — helping you understand the shape of your data before writing queries.

## Schema Snapshots and Comparison

Track how your schema evolves:

- **Save a snapshot** - **Database → Save Schema Snapshot…** stores the current schema
- **Compare a snapshot** - **Database → Compare Schema Snapshot…** diffs the current schema against a saved snapshot and can generate **migration SQL** for the differences

You can also compare data across sessions — see **Database → Compare…** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>D</kbd>), which can generate sync SQL to reconcile two databases.

## Keyboard Shortcuts

| Action            | Shortcut                                   |
| ----------------- | ------------------------------------------ |
| Search All Tables | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd> |
| Refresh Table     | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>R</kbd> |
| Diagram           | <kbd>⌘</kbd> + <kbd>D</kbd>                |
| Compare           | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>D</kbd> |

## Tips and Best Practices

### Understanding Your Database

1. **Start with the table list** - Get an overview of all tables in your database
2. **Use column statistics** - Understand data distributions before writing queries
3. **Check the ER diagram** - Understand table relationships before writing JOINs

### Efficient Navigation

1. **Use Search All Tables** when you know a value but not its table
2. **Use filters and pagination** to work with large tables
3. **Snapshot the schema** before making structural changes

## Troubleshooting

### Missing Tables

If expected tables don't appear:

1. Verify the table exists in the database
2. Refresh the table list (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>R</kbd>)
3. For server connections, check you're connected to the right database

## Next Steps

- [Write SQL Queries](/features/query-editor) - Use schema information to write better queries
- [Edit Data Inline](/features/data-editing) - Make changes directly in the data grid
- [View ER Diagrams](/features/er-diagram) - Visualize table relationships graphically
- [Learn All Shortcuts](/shortcuts) - Master keyboard navigation

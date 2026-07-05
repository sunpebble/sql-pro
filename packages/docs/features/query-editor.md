# SQL Query Editor

The SQL Query Editor is the heart of Quarry, providing a fast native environment for writing, executing, and inspecting SQL queries.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/query-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/query.png">
  <img alt="Quarry Query Editor with a SQL query and results" src="/screenshots/query-dark.png">
</picture>

## Key Features

| Feature           | Description                                       |
| ----------------- | ------------------------------------------------- |
| **Native Editor** | Responsive SQL editing built with native macOS UI |
| **EXPLAIN View**  | Inspect the query execution plan for any query    |
| **Query Library** | History of executed queries plus saved favorites  |
| **SQL Log**       | A complete log of statements the app has executed |

## Writing SQL Queries

Switch to the SQL workspace and type your query:

```sql
SELECT
    u.name,
    u.email,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
HAVING order_count > 5
ORDER BY order_count DESC;
```

## Executing Queries

### Running a Query

Execute your query using one of these methods:

1. **Menu** - Choose **Query → Run Query**
2. **Keyboard shortcut** - Press <kbd>⌘</kbd> + <kbd>R</kbd>

### Query Results

After execution, results appear below the editor with the returned rows in a data grid.

::: warning Large Result Sets
For queries returning many rows, consider using `LIMIT` to control result size:

```sql
SELECT * FROM large_table LIMIT 1000;
```

:::

### Error Handling

When a query fails, Quarry displays the error message from the database engine so you can quickly identify and fix issues.

## EXPLAIN Query Plan

Understand how the database will execute your query:

1. Write or select a query in the editor
2. Choose **Query → Explain Query** or press <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd>
3. The query plan view shows how the engine resolves the query — table scans, index usage, and join order

::: tip Optimization Tips
Common improvements the query plan can reveal:

- Creating indexes on frequently filtered columns
- Avoiding `SELECT *` when you only need specific columns
- Using LIMIT for large result sets
  :::

## Saving Queries

Save the current query to the [Query Library](/features/query-history) with <kbd>⌘</kbd> + <kbd>S</kbd>. Saved queries and execution history are available in the library panel.

## Keyboard Shortcuts

| Action        | Shortcut                                   |
| ------------- | ------------------------------------------ |
| Run query     | <kbd>⌘</kbd> + <kbd>R</kbd>                |
| Explain query | <kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd> |
| Save query    | <kbd>⌘</kbd> + <kbd>S</kbd>                |

See the complete [Keyboard Shortcuts](/shortcuts) reference for all available shortcuts.

## Tips and Best Practices

### Writing Efficient Queries

1. **Use LIMIT** for large tables during exploration
2. **Select specific columns** instead of `SELECT *`
3. **Add indexes** on frequently queried columns
4. **Use EXPLAIN** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd>) to understand query execution

### Debugging Queries

1. **Start simple** and build complexity gradually
2. **Check error messages** for specific issues
3. **Use the EXPLAIN view** to identify performance problems
4. **Test with LIMIT 1** before running on the full dataset

## Next Steps

- [Browse Schema Details](/features/schema-browser) - Explore your database structure
- [Edit Data Inline](/features/data-editing) - Make changes directly in the data grid
- [View ER Diagrams](/features/er-diagram) - Visualize table relationships
- [Learn All Shortcuts](/shortcuts) - Master keyboard navigation

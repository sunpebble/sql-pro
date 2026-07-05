# Data Editing

Quarry provides powerful inline data editing capabilities, allowing you to modify your database directly from the data grid. All changes are tracked as pending changes that you review before applying.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/table-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/table.png">
  <img alt="Quarry data grid with inline editing capabilities showing cell values and edit controls" src="/screenshots/table-dark.png">
</picture>

## Key Features

| Feature                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **Inline Editing**      | Edit cell values directly in the data grid          |
| **Pending Changes**     | Review all pending changes before applying          |
| **Batch Editing**       | Update many rows in one operation                   |
| **Filtering & Sorting** | Filter, sort, and paginate to find the rows to edit |

## Editing Cells

Edit a cell directly in the data grid — the change is recorded as a pending change rather than written immediately.

## Batch Editing

To change many rows at once, use batch editing: select the rows you want to modify and apply the same change to all of them in a single pending operation.

## Pending Changes

All edits are tracked as "pending changes" until you explicitly apply them to the database. This provides a safety net and allows you to review all modifications before they're committed.

### Reviewing Pending Changes

Open the pending-changes preview to see every modification:

- Each change shows the affected table, row, and the old and new values
- You can discard changes you don't want before applying

### Applying Changes

When you're ready to commit your changes to the database:

1. Open the pending-changes preview
2. Review all pending changes
3. Apply them

::: warning Safe Editing
Nothing is written to the database until you apply the pending changes. If you're unsure, discard them and start over.
:::

## Working with Views

Database views are read-only in Quarry. To modify data shown in a view, edit the underlying base tables directly.

## Tips and Best Practices

### Safe Editing Workflow

1. **Make small batches** - apply changes frequently rather than accumulating many
2. **Review before applying** - always check the pending-changes preview
3. **Filter first** - narrow the grid down to the rows you actually want to change
4. **Back up first** - for risky bulk edits, take a backup via **Database → Backup Database…**

### Common Workflows

**Bulk updates:**

1. Filter to find the rows you want to update
2. Use batch editing to apply the change
3. Review the pending changes
4. Apply when ready

**Data correction:**

1. Find the incorrect value (try [Search All Tables](/features/schema-browser#search-all-tables))
2. Edit the cell
3. Apply the change

## Troubleshooting

### Changes Not Saving

If your edits aren't being applied:

1. Ensure you're not editing a view (views are read-only)
2. Check that you applied the pending changes
3. Verify the table has a primary key (required for updates/deletes)

### Constraint Errors

Common errors when applying changes:

- **NOT NULL constraint** - A required column has a null value
- **UNIQUE constraint** - The value already exists in a unique column
- **Foreign key constraint** - Referenced record doesn't exist
- **Type mismatch** - Value doesn't match the column type

Fix the offending change in the pending-changes preview and apply again.

## Next Steps

- [Browse Schema Details](/features/schema-browser) - Understand table structure before editing
- [Write SQL Queries](/features/query-editor) - Use UPDATE/INSERT/DELETE statements for bulk operations
- [View ER Diagrams](/features/er-diagram) - Understand relationships between tables
- [Learn All Shortcuts](/shortcuts) - Master keyboard navigation

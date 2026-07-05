# ER Diagram

The ER (Entity-Relationship) Diagram provides a visual representation of your database schema, showing tables and their relationships. It's a powerful way to explore and understand your database structure at a glance.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/database-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/database.png">
  <img alt="Quarry ER Diagram showing database tables, columns, and foreign key relationships" src="/screenshots/database-dark.png">
</picture>

## Key Features

| Feature                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| **Table Nodes**        | Visual cards showing table structure with columns and types |
| **Relationship Lines** | Foreign key connections between tables                      |
| **Key Indicators**     | Primary key and foreign key columns are highlighted         |

## Accessing the ER Diagram

To view the ER Diagram for your database:

1. Connect to a database
2. Choose **Database → Diagram** or press <kbd>⌘</kbd> + <kbd>D</kbd>

The diagram loads showing the tables in your database with their relationships.

## Understanding the Diagram

### Table Nodes

Each table in your database is represented as a card showing:

- **Header** - The table name
- **Columns** - All columns with their data types
- **Key indicators** - Visual markers for primary keys and foreign keys

### Relationship Lines

Foreign key relationships are displayed as lines connecting tables:

- **Source** - The table containing the foreign key
- **Target** - The referenced table (usually via its primary key)

## Tips and Best Practices

### Understanding Your Schema

1. **Identify hub tables** - Look for tables with many connections
2. **Follow relationships** - Trace foreign keys to understand data flow
3. **Review before writing queries** - Visualize the JOINs you'll need

### Workflow Integration

1. **Validate foreign keys** - Ensure relationships are correctly defined
2. **Plan migrations** - See the impact of schema changes visually; pair with [schema snapshots](/features/schema-browser#schema-snapshots-and-comparison)
3. **Onboard team members** - Use the diagram for database orientation

## Troubleshooting

### No Tables Displayed

If the diagram is empty:

1. The database may be empty — check the sidebar for tables
2. Verify you're connected to the right database
3. Refresh the schema and reopen the diagram

## Next Steps

- [Browse Schema Details](/features/schema-browser) - See detailed column information
- [Write SQL Queries](/features/query-editor) - Use relationships to write JOIN queries
- [Edit Data Inline](/features/data-editing) - Modify data in related tables
- [Learn All Shortcuts](/shortcuts) - Master keyboard navigation

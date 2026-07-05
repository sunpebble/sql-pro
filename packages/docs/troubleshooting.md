# Troubleshooting

This guide covers common issues you might encounter when using Quarry and provides step-by-step solutions to resolve them.

[[toc]]

## Installation Issues

### Application Won't Start on macOS

**Symptom:** Double-clicking Quarry shows a security warning, or the app never opens.

**Cause:** macOS Gatekeeper is blocking the application (this shouldn't happen with notarized release builds, but can occur with local builds).

**Solution:**

1. Right-click the app in your Applications folder and select **Open** from the context menu
2. Or open **System Settings** → **Privacy & Security**, find the message about Quarry, and click **Open Anyway**

::: tip First Launch
This security prompt only appears on first launch. After allowing it once, Quarry will open normally in the future.
:::

### "Quarry is damaged and can't be opened"

**Symptom:** macOS reports the app is damaged.

**Cause:** Extended attribute quarantine flag on the downloaded file.

**Solution:**

```bash
# Remove quarantine attribute
xattr -cr /Applications/Quarry.app
```

---

## Database Connection Issues

### Cannot Open Database File

**Symptom:** Error message "Unable to open database" or "Database file not found."

**Causes:**

- File doesn't exist at the specified path
- File is locked by another application
- Insufficient file permissions

**Solutions:**

1. **Verify the file exists:**

   ```bash
   ls -la /path/to/your/database.db
   ```

2. **Check if another process is using the file:**

   ```bash
   lsof /path/to/your/database.db
   ```

3. **Verify file permissions:**

   ```bash
   # Grant read/write access
   chmod 644 /path/to/your/database.db
   ```

4. **If the file is on a network drive**, try copying it locally first

::: info
Quarry requires read/write access to the database file for editing operations. For read-only access, ensure the file has at least read permissions.
:::

### Database Is Locked

**Symptom:** Error message "Database is locked" when trying to execute queries or save changes.

**Cause:** Another process (including another Quarry session) has an exclusive lock on the database.

**Solutions:**

1. **Close other applications** that might be using the database
2. **Close other Quarry sessions** connected to the same database
3. **Wait a few seconds** - some locks are temporary
4. **Restart the application** if the lock persists

::: tip WAL Mode
Databases using Write-Ahead Logging (WAL) mode allow concurrent reads but may still lock on writes. Check if you have `-wal` and `-shm` files alongside your database.
:::

### Cannot Connect to PostgreSQL/MySQL Server

**Symptom:** Connection errors or timeouts when connecting to a server.

**Solutions:**

1. **Verify host, port, and credentials** in the connection dialog
2. **Check the server accepts remote connections** (`pg_hba.conf` for PostgreSQL, `bind-address` for MySQL)
3. **Use the SSH tunnel option** if the server is only reachable through a bastion host
4. **Test from the terminal** to isolate the problem:

   ```bash
   psql -h host -p 5432 -U user dbname     # PostgreSQL
   mysql -h host -P 3306 -u user -p dbname # MySQL
   ```

### Network Drive Connection Issues

**Symptom:** Slow performance or connection drops when using SQLite databases on network drives.

**Cause:** SQLite isn't designed for network file systems due to locking mechanism limitations.

**Solutions:**

1. **Copy the database locally** for best performance
2. **Use a database server** (PostgreSQL, MySQL) for shared access needs

---

## Encrypted Database Issues

### Invalid Password

**Symptom:** Password error after entering the password for an encrypted database.

**Solutions:**

1. **Verify the password:**
   - Check for typos
   - Passwords are case-sensitive
   - Ensure no extra spaces before/after

2. **Test with the command line:**

   ```bash
   sqlcipher /path/to/database.db
   > .tables
   ```

3. **Check database integrity:**

   ```bash
   sqlite3 /path/to/database.db "PRAGMA integrity_check;"
   ```

### Saved Password Not Working

**Symptom:** Database won't open automatically even though the password was saved.

**Causes:**

- Database password was changed externally
- Keychain entry was removed
- Database file was replaced

**Solution:**

1. Remove the stale credential (in the connection profile, or via Keychain Access)
2. Enter the current correct password
3. Optionally save the new password

---

## Query Execution Issues

### Query Timeout or Slow Performance

**Symptom:** Queries take a very long time.

**Causes:**

- Large dataset without proper indexing
- Complex joins or subqueries
- Database file fragmentation

**Solutions:**

1. **Add indexes** to frequently queried columns:

   ```sql
   CREATE INDEX idx_table_column ON table_name(column_name);
   ```

2. **Analyze your query** with the EXPLAIN view (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>E</kbd>)

3. **Limit result sets:**

   ```sql
   SELECT * FROM large_table LIMIT 1000;
   ```

4. **Vacuum the database** to defragment — use **Database → Maintenance** or run:

   ```sql
   VACUUM;
   ```

### Syntax Error in Query

**Symptom:** "Syntax error" message when executing a query.

**Common Causes and Fixes:**

| Issue                   | Example                   | Fix                                                           |
| ----------------------- | ------------------------- | ------------------------------------------------------------- |
| Missing quotes          | `WHERE name = John`       | `WHERE name = 'John'`                                         |
| Wrong quotes            | `WHERE name = "John"`     | `WHERE name = 'John'` (SQLite uses single quotes for strings) |
| Reserved word as column | `SELECT order FROM table` | `SELECT "order" FROM table`                                   |
| Missing comma           | `SELECT a b FROM`         | `SELECT a, b FROM`                                            |
| Typo in keyword         | `SELEC * FROM`            | `SELECT * FROM`                                               |

### Query Returns No Results

**Symptom:** Query executes successfully but returns empty results.

**Solutions:**

1. **Verify your conditions:**

   ```sql
   -- Check what data exists
   SELECT DISTINCT column_name FROM table_name LIMIT 10;
   ```

2. **Check case sensitivity:**

   ```sql
   -- Case-insensitive search
   SELECT * FROM users WHERE LOWER(name) = LOWER('John');
   -- Or use LIKE
   SELECT * FROM users WHERE name LIKE '%john%';
   ```

3. **Check data types:**
   ```sql
   -- If column is TEXT but you're comparing to number
   SELECT * FROM items WHERE id = '123';  -- Not: id = 123
   ```

---

## Data Editing Issues

### Cannot Edit Read-Only Database

**Symptom:** Edit operations are disabled or show "Database is read-only."

**Solutions:**

1. **Check file permissions:**

   ```bash
   ls -la database.db
   # Should show rw- permissions
   ```

2. **Grant write access:**

   ```bash
   chmod 644 database.db
   ```

3. **Copy to a writable location** if on read-only media

### Changes Not Saving

**Symptom:** Edited data reverts or doesn't persist after closing.

**Solutions:**

1. **Check for pending changes** - open the pending-changes preview and apply them
2. **Look for constraint errors** - failed changes are highlighted with their error messages
3. **Verify constraints before editing:**

   ```sql
   -- Check table constraints (SQLite)
   SELECT sql FROM sqlite_master WHERE name = 'your_table';
   ```

### Foreign Key Constraint Violations

**Symptom:** "FOREIGN KEY constraint failed" when inserting or updating data.

**Cause:** The value you're inserting doesn't exist in the referenced table.

**Solutions:**

1. **Check what values exist in the parent table:**

   ```sql
   SELECT id FROM parent_table;
   ```

2. **Insert the parent record first**, then the child record

3. **View foreign key relationships** in the ER Diagram (<kbd>⌘</kbd> + <kbd>D</kbd>)

---

## Performance Issues

### High Memory Usage

**Symptom:** Quarry using excessive RAM.

**Solutions:**

1. **Limit query results:**

   ```sql
   SELECT * FROM large_table LIMIT 10000;
   ```

2. **Close unused sessions** - close databases you're not actively using

3. **Use pagination** - the data grid paginates; avoid `SELECT *` on very large tables

### Slow Startup

**Symptom:** Application takes a long time to start.

**Solutions:**

1. **Clear recent connections** you no longer need
2. **Check disk speed** - move database files to fast local storage
3. **Close other applications** to free system resources

---

## Export and Import Issues

### Export Fails with Large Tables

**Symptom:** Export operation is very slow or fails with large datasets.

**Solutions:**

1. **Export in batches:**

   ```sql
   -- Export in chunks
   SELECT * FROM large_table LIMIT 100000 OFFSET 0;
   SELECT * FROM large_table LIMIT 100000 OFFSET 100000;
   -- etc.
   ```

2. **Use the command line for very large exports:**

   ```bash
   sqlite3 database.db ".mode csv" ".output data.csv" "SELECT * FROM table;"
   ```

3. **Ensure sufficient disk space** for the output file

### CSV Import Character Encoding Issues

**Symptom:** Special characters appear garbled after import.

**Cause:** Character encoding mismatch between file and database.

**Solutions:**

1. **Ensure UTF-8 encoding:**
   - Save your CSV file as UTF-8 before importing

2. **Check file encoding:**

   ```bash
   file -I your_file.csv
   ```

3. **Convert encoding if needed:**
   ```bash
   iconv -f ISO-8859-1 -t UTF-8 input.csv > output.csv
   ```

---

## Getting More Help

### Reporting Issues

If you can't resolve an issue using this guide:

1. **Search existing issues** on [GitHub Issues](https://github.com/sunpebble/quarry/issues)
2. **Create a new issue** with:
   - Quarry version
   - macOS version
   - Steps to reproduce
   - Error messages (screenshots if helpful)
   - Database type (SQLite, SQLCipher, PostgreSQL, or MySQL)

::: info
When reporting issues, never share actual database content or passwords. Use dummy data to reproduce issues if needed.
:::

## Next Steps

- [Getting Started Guide](/getting-started/) - Setup and first connection
- [Feature Documentation](/features/) - Learn about all features
- [Keyboard Shortcuts](/shortcuts) - Complete shortcuts reference
- [GitHub Issues](https://github.com/sunpebble/quarry/issues) - Report bugs and request features

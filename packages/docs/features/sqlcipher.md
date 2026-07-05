# SQLCipher Encrypted Databases

Quarry provides full support for SQLCipher encrypted databases, allowing you to work with password-protected SQLite files securely.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/screenshots/database-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/screenshots/database.png">
  <img alt="Quarry working with an encrypted SQLCipher database showing the main interface" src="/screenshots/database-dark.png">
</picture>

## Key Features

| Feature                     | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| **SQLCipher Support**       | Open and edit SQLCipher-encrypted SQLite databases                          |
| **Secure Password Storage** | Passwords stored in the macOS Keychain via connection profiles              |
| **Seamless Workflow**       | Once unlocked, work with encrypted databases exactly like regular databases |

## Opening Encrypted Databases

### Step 1: Open the Database File

1. Choose **File → Open Encrypted Database…** (<kbd>⇧</kbd> + <kbd>⌘</kbd> + <kbd>O</kbd>)
2. Select the encrypted database file

### Step 2: Enter the Password

Enter the database password in the dialog and confirm. To avoid retyping it, save the connection as a profile — the password is stored securely in the macOS Keychain.

### Step 3: Work with Your Database

Once the correct password is entered, the database opens and you can:

- Browse tables and views in the sidebar
- Query data with the SQL editor
- Edit data inline
- Export data in various formats
- View the ER diagram

The encrypted database works exactly like a regular SQLite database.

## Password Storage

Quarry stores database passwords in the **macOS Keychain** as part of connection profiles. The actual password is never stored in plain text.

If a saved password no longer works (for example, the database password was changed with another tool), remove the stale credential and enter the new password.

## Creating Encrypted Databases

To create a new encrypted database outside of Quarry, use the SQLCipher CLI:

```bash
# Install sqlcipher (macOS)
brew install sqlcipher

# Create new encrypted database
sqlcipher new-encrypted.db
SQLCipher version 4.5.0
Enter password:
sqlite> CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
sqlite> .exit
```

### Converting Existing Databases

To encrypt an existing unencrypted database:

```bash
# Using sqlcipher command line
sqlcipher plaintext.db
sqlite> ATTACH DATABASE 'encrypted.db' AS encrypted KEY 'your-password';
sqlite> SELECT sqlcipher_export('encrypted');
sqlite> DETACH DATABASE encrypted;
```

## Troubleshooting

### "Invalid password" Errors

This error appears when:

1. **Wrong password**: Double-check the password for typos (passwords are case-sensitive)
2. **Non-SQLCipher encryption**: The file was encrypted with a different tool or format
3. **Corrupted database**: The file may be damaged

**Solutions:**

- Verify the password is correct
- Check if the database opens with the sqlcipher CLI:

  ```bash
  sqlcipher /path/to/database.db
  > .tables
  ```

### Saved Password No Longer Works

If a previously working saved password stops working:

1. The database password was changed externally, or the file was replaced
2. Remove the saved credential (in the connection profile or Keychain Access)
3. Enter the current correct password

## Security Best Practices

### Password Selection

- Use strong, unique passwords for each encrypted database
- Consider using a password manager
- Avoid passwords that are easy to guess

### Sharing Databases

When sharing encrypted databases:

- Share the password through a separate, secure channel
- Never include passwords in file names or nearby text files

### Backup Considerations

- Encrypted databases can be backed up like regular files
- The backup remains encrypted with the same password
- Store password recovery information securely

## Next Steps

- [Write SQL Queries](/features/query-editor) - Query your encrypted databases
- [Browse Schema Details](/features/schema-browser) - Explore database structure
- [Edit Data Inline](/features/data-editing) - Modify data directly
- [View ER Diagrams](/features/er-diagram) - Visualize relationships
- [Learn All Shortcuts](/shortcuts) - Keyboard navigation reference

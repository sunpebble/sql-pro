import type {
  BackupFormat,
  BackupMetadata,
  CreateBackupRequest,
  CreateBackupResponse,
  DeleteBackupRequest,
  DeleteBackupResponse,
  ListBackupsRequest,
  ListBackupsResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
  TableInfo,
} from '@shared/types';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { app } from 'electron';
import { databaseService } from './database';

// Default backup directory
const getBackupDir = (): string => {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

// Backup metadata store file
const getMetadataPath = (): string => {
  return path.join(getBackupDir(), 'backups.json');
};

// Load backup metadata
const loadBackupMetadata = (): BackupMetadata[] => {
  const metadataPath = getMetadataPath();
  if (fs.existsSync(metadataPath)) {
    try {
      const data = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
};

// Save backup metadata
const saveBackupMetadata = (backups: BackupMetadata[]): void => {
  const metadataPath = getMetadataPath();
  fs.writeFileSync(metadataPath, JSON.stringify(backups, null, 2), 'utf-8');
};

// Generate unique backup ID
const generateBackupId = (): string => {
  return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Generate backup filename
const generateBackupFilename = (name: string, format: BackupFormat): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = name.replace(/[^\w-]/g, '_');
  const ext = format === 'sqlite' ? 'db' : 'sql';
  return `${safeName}_${timestamp}.${ext}`;
};

/**
 * Create a backup of the database
 */
export async function createBackup(
  request: CreateBackupRequest
): Promise<CreateBackupResponse> {
  try {
    const connection = databaseService.getConnection(request.connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    const outputDir = request.outputDir || getBackupDir();
    const filename = generateBackupFilename(request.name, request.format);
    const filePath = path.join(outputDir, filename);

    // Get schema for table count and row count estimation
    const schemaResult = databaseService.getSchema(request.connectionId);
    if (!schemaResult.success || !schemaResult.tables) {
      return { success: false, error: 'Failed to get database schema' };
    }

    const tables =
      request.tables || schemaResult.tables.map((t: TableInfo) => t.name);
    let totalRows = 0;

    if (request.format === 'sqlite') {
      // Use VACUUM INTO to create a clean backup
      const vacuumResult = databaseService.execute(
        request.connectionId,
        `VACUUM INTO '${filePath.replace(/'/g, "''")}'`
      );

      if (!vacuumResult.success) {
        // Fallback to file copy if VACUUM INTO is not supported
        const sourcePath = connection.path;
        if (sourcePath && fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, filePath);
        } else {
          return { success: false, error: 'Database file not found' };
        }
      }

      // Count rows in source database
      for (const tableName of tables) {
        const countResult = databaseService.query(
          request.connectionId,
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        if (countResult.success && countResult.rows?.[0]) {
          totalRows += Number(countResult.rows[0][0]) || 0;
        }
      }
    } else {
      // For SQL dump format
      let sqlContent = '';

      // Add header comment
      sqlContent += `-- SQL Pro Backup\n`;
      sqlContent += `-- Database: ${connection.filename || connection.path || 'Unknown'}\n`;
      sqlContent += `-- Created: ${new Date().toISOString()}\n`;
      sqlContent += `-- Tables: ${tables.join(', ')}\n\n`;

      // Begin transaction
      sqlContent += 'BEGIN TRANSACTION;\n\n';

      for (const tableName of tables) {
        // Get CREATE TABLE statement
        const createResult = databaseService.query(
          request.connectionId,
          `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName.replace(/'/g, "''")}'`
        );

        if (createResult.success && createResult.rows?.[0]) {
          const createSql = createResult.rows[0][0] as string | null;
          if (createSql) {
            sqlContent += `-- Table: ${tableName}\n`;
            sqlContent += `DROP TABLE IF EXISTS "${tableName}";\n`;
            sqlContent += `${createSql};\n\n`;
          }
        }

        // Get table data (unless schema-only)
        if (!request.schemaOnly) {
          const dataResult = databaseService.query(
            request.connectionId,
            `SELECT * FROM "${tableName}"`
          );

          if (
            dataResult.success &&
            dataResult.rows &&
            dataResult.rows.length > 0
          ) {
            const columns = dataResult.columns;
            totalRows += dataResult.rows.length;

            // Generate INSERT statements
            for (const row of dataResult.rows) {
              const values = columns.map((col, idx) => {
                const value = row[idx];
                if (value === null) return 'NULL';
                if (typeof value === 'number') return String(value);
                if (typeof value === 'boolean') return value ? '1' : '0';
                // Escape single quotes
                return `'${String(value).replace(/'/g, "''")}'`;
              });

              sqlContent += `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            sqlContent += '\n';
          }
        }

        // Get indexes for this table
        const indexResult = databaseService.query(
          request.connectionId,
          `SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='${tableName.replace(/'/g, "''")}' AND sql IS NOT NULL`
        );

        if (indexResult.success && indexResult.rows) {
          for (const idx of indexResult.rows) {
            const sql = idx[0] as string | null;
            if (sql) {
              sqlContent += `${sql};\n`;
            }
          }
        }
      }

      // Get triggers
      const triggerResult = databaseService.query(
        request.connectionId,
        `SELECT sql FROM sqlite_master WHERE type='trigger' AND sql IS NOT NULL`
      );

      if (triggerResult.success && triggerResult.rows) {
        sqlContent += '\n-- Triggers\n';
        for (const trigger of triggerResult.rows) {
          const sql = trigger[0] as string | null;
          if (sql) {
            sqlContent += `${sql};\n`;
          }
        }
      }

      // End transaction
      sqlContent += '\nCOMMIT;\n';

      // Write SQL file
      fs.writeFileSync(filePath, sqlContent, 'utf-8');
    }

    // Get file size
    const stats = fs.statSync(filePath);

    // Create backup metadata
    const backup: BackupMetadata = {
      id: generateBackupId(),
      name: request.name,
      createdAt: new Date().toISOString(),
      databaseType: 'sqlite', // Currently only SQLite is supported via databaseService
      databaseName: connection.filename || connection.path || 'Unknown',
      format: request.format,
      filePath,
      fileSize: stats.size,
      tableCount: tables.length,
      totalRows,
      description: request.description,
    };

    // Save metadata
    const backups = loadBackupMetadata();
    backups.unshift(backup);
    saveBackupMetadata(backups);

    return { success: true, backup };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Restore a database from backup
 */
export async function restoreBackup(
  request: RestoreBackupRequest
): Promise<RestoreBackupResponse> {
  try {
    if (!fs.existsSync(request.backupPath)) {
      return { success: false, error: 'Backup file not found' };
    }

    const ext = path.extname(request.backupPath).toLowerCase();

    if (ext === '.db' || ext === '.sqlite' || ext === '.sqlite3') {
      // SQLite file restore
      if (!request.targetPath) {
        return {
          success: false,
          error: 'Target path is required for SQLite restore',
        };
      }

      // Copy the backup file to target path
      fs.copyFileSync(request.backupPath, request.targetPath);

      return {
        success: true,
        tablesRestored: 0, // Unknown without opening
        rowsRestored: 0,
      };
    } else if (ext === '.sql') {
      // SQL file restore
      if (!request.connectionId) {
        return {
          success: false,
          error: 'Connection ID is required for SQL restore',
        };
      }

      const connection = databaseService.getConnection(request.connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      // Read SQL file
      const sqlContent = fs.readFileSync(request.backupPath, 'utf-8');

      // Split into statements and execute
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('--'));

      let tablesRestored = 0;
      let rowsRestored = 0;

      // Start transaction for better performance
      databaseService.execute(request.connectionId, 'BEGIN TRANSACTION');

      try {
        for (const statement of statements) {
          if (!statement) continue;

          // Skip transaction control if we're managing our own
          if (
            statement.toUpperCase() === 'BEGIN TRANSACTION' ||
            statement.toUpperCase() === 'COMMIT'
          ) {
            continue;
          }

          // Check if this is a DROP statement and dropExisting is false
          if (
            !request.dropExisting &&
            statement.toUpperCase().startsWith('DROP TABLE')
          ) {
            continue;
          }

          // Filter by table if specified
          if (request.tables && request.tables.length > 0) {
            const tableMatch = statement.match(
              /(?:CREATE TABLE|INSERT INTO|DROP TABLE IF EXISTS)\s+"?(\w+)"?/i
            );
            if (tableMatch && !request.tables.includes(tableMatch[1])) {
              continue;
            }
          }

          const result = databaseService.execute(
            request.connectionId,
            statement
          );

          if (!result.success) {
            // Log error but continue with other statements
            console.error(`Failed to execute: ${statement}`, result.error);
          } else {
            if (statement.toUpperCase().startsWith('CREATE TABLE')) {
              tablesRestored++;
            } else if (statement.toUpperCase().startsWith('INSERT')) {
              rowsRestored++;
            }
          }
        }

        // Commit transaction
        databaseService.execute(request.connectionId, 'COMMIT');
      } catch (error) {
        // Rollback on unexpected error
        try {
          databaseService.execute(request.connectionId, 'ROLLBACK');
        } catch {
          // Ignore rollback error
        }
        throw error;
      }

      return { success: true, tablesRestored, rowsRestored };
    } else {
      return { success: false, error: 'Unsupported backup format' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * List all backups
 */
export async function listBackups(
  request: ListBackupsRequest
): Promise<ListBackupsResponse> {
  try {
    let backups = loadBackupMetadata();

    // Filter by database type if specified
    if (request.databaseType) {
      backups = backups.filter((b) => b.databaseType === request.databaseType);
    }

    // Filter by database name if specified
    if (request.databaseName) {
      backups = backups.filter((b) =>
        b.databaseName
          .toLowerCase()
          .includes(request.databaseName!.toLowerCase())
      );
    }

    // Verify files still exist
    backups = backups.filter((b) => fs.existsSync(b.filePath));

    return { success: true, backups };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(
  request: DeleteBackupRequest
): Promise<DeleteBackupResponse> {
  try {
    const backups = loadBackupMetadata();
    const index = backups.findIndex((b) => b.id === request.backupId);

    if (index === -1) {
      return { success: false, error: 'Backup not found' };
    }

    const backup = backups[index];

    // Delete the file
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Remove from metadata
    backups.splice(index, 1);
    saveBackupMetadata(backups);

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

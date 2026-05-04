import type { DatabaseConnectionConfig, DatabaseType } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { databaseManager } from './database-manager';

describe('databaseManager DB Pro-compatible provider aliases', () => {
  it.each([
    ['mariadb', 'MySQL host is required'],
    ['mongodb', 'MongoDB host is required'],
    ['neon', 'PostgreSQL host is required'],
    ['planetscale', 'PostgreSQL host is required'],
    ['sqlserver', 'SQL Server host is required'],
  ])(
    'routes %s through an existing compatible adapter',
    async (type, error) => {
      const config: DatabaseConnectionConfig = {
        type: type as DatabaseType,
      };

      await expect(
        databaseManager.testConnection(config)
      ).resolves.toMatchObject({
        success: false,
        error,
      });
    }
  );
});

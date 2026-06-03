import type { DatabaseConnectionConfig, DatabaseType } from '@shared/types';
import { describe, expect, it, vi } from 'vitest';
import { databaseManager } from './database-manager';

// Mock Electron so the service import chain (sql-logger / ssh-credential-store →
// electron) resolves without the real Electron binary, which is unavailable in the
// headless CI test runner.
vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/tmp'),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => false),
    encryptString: vi.fn((value: string) => value),
    decryptString: vi.fn((value: string) => value),
  },
}));

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

/**
 * Mock API definitions for the export/backup domain.
 * Types mirror the real API interface; implementations live in renderer/src/lib/mock-api.ts
 * and are validated via `satisfies ExportMockApi`.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  CreateBackupRequest,
  CreateBackupResponse,
  DeleteBackupRequest,
  DeleteBackupResponse,
  ExportRequest,
  ExportResponse,
  ListBackupsRequest,
  ListBackupsResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
} from './types';

export interface ExportMockApi {
  data: (request: ExportRequest) => Promise<ExportResponse>;
  createBackup: (request: CreateBackupRequest) => Promise<CreateBackupResponse>;
  restoreBackup: (request: RestoreBackupRequest) => Promise<RestoreBackupResponse>;
  listBackups: (request: ListBackupsRequest) => Promise<ListBackupsResponse>;
  deleteBackup: (request: DeleteBackupRequest) => Promise<DeleteBackupResponse>;
}

export function createExportMock(_deps: SqlProApiDeps): ExportMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

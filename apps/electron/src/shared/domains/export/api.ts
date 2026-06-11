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
import { backupChannels, exportChannels } from './channels';

export interface ExportApi {
  data: (request: ExportRequest) => Promise<ExportResponse>;
  createBackup: (request: CreateBackupRequest) => Promise<CreateBackupResponse>;
  restoreBackup: (request: RestoreBackupRequest) => Promise<RestoreBackupResponse>;
  listBackups: (request: ListBackupsRequest) => Promise<ListBackupsResponse>;
  deleteBackup: (request: DeleteBackupRequest) => Promise<DeleteBackupResponse>;
}

export function createExportApi({ invoke }: SqlProApiDeps): ExportApi {
  return {
    data: (request) => invoke(exportChannels.data.name, request),
    createBackup: (request) => invoke(backupChannels.create.name, request),
    restoreBackup: (request) => invoke(backupChannels.restore.name, request),
    listBackups: (request) => invoke(backupChannels.list.name, request),
    deleteBackup: (request) => invoke(backupChannels.delete.name, request),
  };
}

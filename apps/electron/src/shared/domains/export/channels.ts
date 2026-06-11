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
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const exportChannels = {
  data: channel<ExportRequest, ExportResponse>('export:data'),
} as const;

export const backupChannels = {
  create: channel<CreateBackupRequest, CreateBackupResponse>('backup:create'),
  restore: channel<RestoreBackupRequest, RestoreBackupResponse>(
    'backup:restore'
  ),
  list: channel<ListBackupsRequest, ListBackupsResponse>('backup:list'),
  delete: channel<DeleteBackupRequest, DeleteBackupResponse>('backup:delete'),
} as const;

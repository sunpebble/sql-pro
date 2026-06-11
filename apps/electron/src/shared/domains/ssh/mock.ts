/**
 * Mock API definitions for the SSH domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  SSHCredentialsInput,
  SSHTunnelIpcConfig,
  SSHTunnelStatusChangeEvent,
} from './types';

export interface SshMockApi {
  saveCredentials: (
    profileId: string,
    credentials: SSHCredentialsInput
  ) => Promise<unknown>;
  getCredentials: (profileId: string) => Promise<unknown>;
  hasCredentials: (profileId: string) => Promise<unknown>;
  removeCredentials: (profileId: string) => Promise<unknown>;
  getTunnelStatus: (connectionId: string) => Promise<unknown>;
  closeTunnel: (connectionId: string) => Promise<unknown>;
  hasTunnel: (connectionId: string) => Promise<unknown>;
  testConnection: (
    config: SSHTunnelIpcConfig,
    credentials: SSHCredentialsInput
  ) => Promise<unknown>;
  onTunnelStatusChange: (cb: (e: SSHTunnelStatusChangeEvent) => void) => () => void;
}

export function createSshMock(_deps: SqlProApiDeps): SshMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

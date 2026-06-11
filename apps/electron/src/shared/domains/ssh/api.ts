import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  SSHCloseTunnelResponse,
  SSHCredentialsInput,
  SSHGetCredentialsResponse,
  SSHGetTunnelStatusResponse,
  SSHHasCredentialsResponse,
  SSHHasTunnelResponse,
  SSHRemoveCredentialsResponse,
  SSHSaveCredentialsResponse,
  SSHTestConnectionResponse,
  SSHTunnelIpcConfig,
  SSHTunnelStatusChangeEvent,
} from './types';
import { sshChannels } from './channels';

export interface SshApi {
  saveCredentials: (
    profileId: string,
    credentials: SSHCredentialsInput
  ) => Promise<SSHSaveCredentialsResponse>;
  getCredentials: (profileId: string) => Promise<SSHGetCredentialsResponse>;
  hasCredentials: (profileId: string) => Promise<SSHHasCredentialsResponse>;
  removeCredentials: (profileId: string) => Promise<SSHRemoveCredentialsResponse>;
  getTunnelStatus: (connectionId: string) => Promise<SSHGetTunnelStatusResponse>;
  closeTunnel: (connectionId: string) => Promise<SSHCloseTunnelResponse>;
  hasTunnel: (connectionId: string) => Promise<SSHHasTunnelResponse>;
  testConnection: (
    config: SSHTunnelIpcConfig,
    credentials: SSHCredentialsInput
  ) => Promise<SSHTestConnectionResponse>;
  onTunnelStatusChange: (
    callback: (event: SSHTunnelStatusChangeEvent) => void
  ) => () => void;
}

export function createSshApi({ invoke, on, off }: SqlProApiDeps): SshApi {
  return {
    saveCredentials: (profileId, credentials) =>
      invoke(sshChannels.saveCredentials.name, { profileId, credentials }),
    getCredentials: (profileId) =>
      invoke(sshChannels.getCredentials.name, { profileId }),
    hasCredentials: (profileId) =>
      invoke(sshChannels.hasCredentials.name, { profileId }),
    removeCredentials: (profileId) =>
      invoke(sshChannels.removeCredentials.name, { profileId }),
    getTunnelStatus: (connectionId) =>
      invoke(sshChannels.getTunnelStatus.name, { connectionId }),
    closeTunnel: (connectionId) =>
      invoke(sshChannels.closeTunnel.name, { connectionId }),
    hasTunnel: (connectionId) =>
      invoke(sshChannels.hasTunnel.name, { connectionId }),
    testConnection: (config, credentials) =>
      invoke(sshChannels.testConnection.name, { config, credentials }),
    onTunnelStatusChange: (callback) => {
      const handler = (_event: unknown, payload: SSHTunnelStatusChangeEvent) =>
        callback(payload);
      on(sshChannels.tunnelStatusChanged.name, handler);
      return () => off(sshChannels.tunnelStatusChanged.name, handler);
    },
  };
}

import type {
  SSHCloseTunnelResponse,
  SSHConnectionRequest,
  SSHGetCredentialsResponse,
  SSHGetTunnelStatusResponse,
  SSHHasCredentialsResponse,
  SSHHasTunnelResponse,
  SSHProfileRequest,
  SSHRemoveCredentialsResponse,
  SSHSaveCredentialsRequest,
  SSHSaveCredentialsResponse,
  SSHTestConnectionRequest,
  SSHTestConnectionResponse,
  SSHTunnelStatusChangeEvent,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const sshChannels = {
  saveCredentials: channel<
    SSHSaveCredentialsRequest,
    SSHSaveCredentialsResponse
  >('ssh:save-credentials'),
  getCredentials: channel<SSHProfileRequest, SSHGetCredentialsResponse>(
    'ssh:get-credentials'
  ),
  hasCredentials: channel<SSHProfileRequest, SSHHasCredentialsResponse>(
    'ssh:has-credentials'
  ),
  removeCredentials: channel<SSHProfileRequest, SSHRemoveCredentialsResponse>(
    'ssh:remove-credentials'
  ),
  getTunnelStatus: channel<SSHConnectionRequest, SSHGetTunnelStatusResponse>(
    'ssh:get-tunnel-status'
  ),
  closeTunnel: channel<SSHConnectionRequest, SSHCloseTunnelResponse>(
    'ssh:close-tunnel'
  ),
  hasTunnel: channel<SSHConnectionRequest, SSHHasTunnelResponse>(
    'ssh:has-tunnel'
  ),
  testConnection: channel<SSHTestConnectionRequest, SSHTestConnectionResponse>(
    'ssh:test-connection'
  ),
  tunnelStatusChanged: channel<SSHTunnelStatusChangeEvent, void>(
    'ssh:tunnel-status-changed'
  ),
} as const;

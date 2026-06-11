/**
 * SSH domain types — SSH tunnel management and credential storage
 */

export interface SSHCredentialsInput {
  password?: string;
  privateKey?: string;
  passphrase?: string;
  jumpHostPassword?: string;
  jumpHostPrivateKey?: string;
  jumpHostPassphrase?: string;
}

export interface SSHProfileRequest {
  profileId: string;
}

export interface SSHConnectionRequest {
  connectionId: string;
}

export interface SSHSaveCredentialsRequest extends SSHProfileRequest {
  credentials: SSHCredentialsInput;
}

export interface SSHTunnelIpcConfig {
  ssh: {
    enabled: boolean;
    host: string;
    port?: number;
    username: string;
    authMethod: 'password' | 'privateKey';
  };
  jumpHost?: {
    enabled: boolean;
    host: string;
    port?: number;
    username: string;
    authMethod: 'password' | 'privateKey';
  };
  remoteHost: string;
  remotePort: number;
  localPort?: number;
}

export interface SSHTestConnectionRequest {
  config: SSHTunnelIpcConfig;
  credentials: SSHCredentialsInput;
}

export interface SSHSaveCredentialsResponse {
  success: boolean;
  error?: string;
}

export interface SSHHasCredentialsResponse {
  hasCredentials: boolean;
}

export interface SSHStoredCredentialPayload extends SSHProfileRequest {
  password?: string;
  privateKey?: string;
  passphrase?: string;
  jumpHostPassword?: string;
  jumpHostPrivateKey?: string;
  jumpHostPassphrase?: string;
}

export interface SSHGetCredentialsResponse {
  success: boolean;
  credentials?: SSHStoredCredentialPayload;
  error?: string;
}

export interface SSHRemoveCredentialsResponse {
  success: boolean;
  error?: string;
}

export type SSHTunnelLifecycleState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface SSHTunnelStatusPayload {
  state: SSHTunnelLifecycleState;
  localPort?: number;
  error?: string;
  reconnectAttempts?: number;
}

export interface SSHGetTunnelStatusResponse {
  success: boolean;
  status: SSHTunnelStatusPayload | null;
  error?: string;
}

export interface SSHCloseTunnelResponse {
  success: boolean;
  error?: string;
}

export interface SSHTestConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SSHHasTunnelResponse {
  hasTunnel: boolean;
}

export interface SSHTunnelStatusChangeEvent {
  connectionId: string;
  status: SSHTunnelStatusPayload;
}

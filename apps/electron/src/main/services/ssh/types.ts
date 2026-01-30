/**
 * SSH Tunnel Types
 *
 * Type definitions for SSH tunnel configuration, credentials, and status.
 * Used by the SSH tunnel infrastructure for secure database connections.
 */

/**
 * SSH authentication method
 */
export type SSHAuthMethod = 'password' | 'privateKey';

/**
 * SSH connection configuration
 *
 * Note: Credentials (password, private key, passphrase) are stored separately
 * via sshCredentialStore using Electron's safeStorage API for encryption.
 */
export interface SSHConfig {
  /** Whether SSH tunnel is enabled for this connection */
  enabled: boolean;
  /** SSH server hostname or IP address */
  host: string;
  /** SSH server port (default: 22) */
  port?: number;
  /** SSH username for authentication */
  username: string;
  /** Authentication method: password or private key */
  authMethod: SSHAuthMethod;
}

/**
 * SSH jump host (bastion) configuration
 * Same structure as SSHConfig for jump host connections
 */
export interface SSHJumpHostConfig {
  /** Whether jump host is enabled */
  enabled: boolean;
  /** Jump host hostname or IP address */
  host: string;
  /** Jump host port (default: 22) */
  port?: number;
  /** Jump host username */
  username: string;
  /** Authentication method for jump host */
  authMethod: SSHAuthMethod;
}

/**
 * Complete SSH tunnel configuration
 * Combines SSH settings with target database host/port
 */
export interface SSHTunnelConfig {
  /** Primary SSH connection settings */
  ssh: SSHConfig;
  /** Optional jump host for multi-hop connections */
  jumpHost?: SSHJumpHostConfig;
  /** Remote database host (as seen from SSH server) */
  remoteHost: string;
  /** Remote database port */
  remotePort: number;
  /** Local port for tunnel (0 = dynamic allocation) */
  localPort?: number;
  /** Keepalive interval in ms (default: 10000) */
  keepaliveInterval?: number;
  /** Connection timeout in ms (default: 20000) */
  readyTimeout?: number;
}

/**
 * SSH tunnel connection status
 */
export type TunnelState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * SSH tunnel status information
 */
export interface TunnelStatus {
  /** Current tunnel state */
  state: TunnelState;
  /** Local port the tunnel is listening on (when connected) */
  localPort?: number;
  /** Error message if state is 'error' */
  error?: string;
  /** Number of reconnection attempts made */
  reconnectAttempts?: number;
}

/**
 * SSH credentials for authentication
 * Stored encrypted via sshCredentialStore
 */
export interface SSHCredential {
  /** Connection profile identifier */
  profileId: string;
  /** Password for password authentication */
  password?: string;
  /** Private key in PEM format for key authentication */
  privateKey?: string;
  /** Passphrase for encrypted private keys */
  passphrase?: string;
  /** Jump host password */
  jumpHostPassword?: string;
  /** Jump host private key in PEM format */
  jumpHostPrivateKey?: string;
  /** Jump host private key passphrase */
  jumpHostPassphrase?: string;
}

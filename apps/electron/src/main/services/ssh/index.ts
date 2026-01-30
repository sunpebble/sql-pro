/**
 * SSH Tunnel Services
 *
 * This module provides SSH tunnel functionality for secure database connections:
 * - SSHTunnel: Individual tunnel connection with auto-reconnection
 * - TunnelManager: Lifecycle management for multiple tunnels
 * - sshCredentialStore: Secure credential storage using Electron safeStorage
 *
 * Usage:
 * ```typescript
 * import { tunnelManager, sshCredentialStore } from './services/ssh';
 *
 * // Get stored credentials
 * const credentials = sshCredentialStore.getCredential(profileId);
 *
 * // Create a tunnel
 * const localPort = await tunnelManager.createTunnel(connectionId, config, credentials);
 *
 * // Connect to database via localhost:localPort
 * ```
 */

// Credential store
export { type SSHCredential, sshCredentialStore } from './ssh-credential-store';

// Tunnel connection
export { SSHTunnel } from './tunnel-connection';

// Tunnel manager
export { tunnelManager, TunnelManager } from './tunnel-manager';

// Types
export type {
  SSHAuthMethod,
  SSHConfig,
  SSHJumpHostConfig,
  SSHTunnelConfig,
  TunnelState,
  TunnelStatus,
} from './types';

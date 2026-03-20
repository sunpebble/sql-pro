/**
 * SSH IPC Handlers
 *
 * Provides IPC handlers for SSH tunnel operations:
 * - Credential management (save/get/remove)
 * - Tunnel status and lifecycle
 * - Connection testing
 */

import type {
  SSHConnectionRequest,
  SSHCredentialsInput,
  SSHProfileRequest,
  SSHSaveCredentialsRequest,
  SSHTestConnectionRequest,
} from '@shared/types';
import type { SSHCredential, SSHTunnelConfig } from '../ssh/types';
import { ipcMain } from 'electron';
import { logger } from '../../lib/logger';
import { sshCredentialStore, tunnelManager } from '../ssh';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isValidCredentials(value: unknown): value is SSHCredentialsInput {
  if (!isObject(value)) return false;
  return (
    isOptionalString(value.password) &&
    isOptionalString(value.privateKey) &&
    isOptionalString(value.passphrase) &&
    isOptionalString(value.jumpHostPassword) &&
    isOptionalString(value.jumpHostPrivateKey) &&
    isOptionalString(value.jumpHostPassphrase)
  );
}

function asProfileRequest(request: unknown): SSHProfileRequest | null {
  if (!isObject(request) || typeof request.profileId !== 'string') return null;
  return { profileId: request.profileId };
}

function asConnectionRequest(request: unknown): SSHConnectionRequest | null {
  if (!isObject(request) || typeof request.connectionId !== 'string') return null;
  return { connectionId: request.connectionId };
}

function asSaveCredentialsRequest(
  request: unknown
): SSHSaveCredentialsRequest | null {
  if (!isObject(request) || typeof request.profileId !== 'string') return null;
  if (!isValidCredentials(request.credentials)) return null;
  return { profileId: request.profileId, credentials: request.credentials };
}

function isValidSSHConfig(value: unknown): value is SSHTunnelConfig {
  if (!isObject(value) || !isObject(value.ssh)) return false;
  const ssh = value.ssh;
  if (
    typeof ssh.enabled !== 'boolean' ||
    typeof ssh.host !== 'string' ||
    typeof ssh.username !== 'string' ||
    (ssh.port !== undefined && typeof ssh.port !== 'number') ||
    (ssh.authMethod !== 'password' && ssh.authMethod !== 'privateKey')
  ) {
    return false;
  }
  if (
    typeof value.remoteHost !== 'string' ||
    typeof value.remotePort !== 'number' ||
    (value.localPort !== undefined && typeof value.localPort !== 'number')
  ) {
    return false;
  }
  if (value.jumpHost !== undefined) {
    if (!isObject(value.jumpHost)) return false;
    const jumpHost = value.jumpHost;
    if (
      typeof jumpHost.enabled !== 'boolean' ||
      typeof jumpHost.host !== 'string' ||
      typeof jumpHost.username !== 'string' ||
      (jumpHost.port !== undefined && typeof jumpHost.port !== 'number') ||
      (jumpHost.authMethod !== 'password' &&
        jumpHost.authMethod !== 'privateKey')
    ) {
      return false;
    }
  }
  return true;
}

function asTestConnectionRequest(
  request: unknown
): SSHTestConnectionRequest | null {
  if (!isObject(request)) return null;
  if (!isValidSSHConfig(request.config) || !isValidCredentials(request.credentials)) {
    return null;
  }
  return {
    config: request.config,
    credentials: request.credentials,
  };
}

/**
 * Register all SSH-related IPC handlers
 */
export function setupSSHHandlers(): void {
  // Save SSH credentials securely
  ipcMain.handle(
    'ssh:save-credentials',
    async (_, request: unknown) => {
      const payload = asSaveCredentialsRequest(request);
      if (!payload) {
        return { success: false, error: 'Invalid SSH save-credentials payload' };
      }
      logger.info('Saving SSH credentials', {
        profileId: payload.profileId,
        hasPassword: !!payload.credentials.password,
        hasPrivateKey: !!payload.credentials.privateKey,
        hasPassphrase: !!payload.credentials.passphrase,
      });
      const success = sshCredentialStore.saveCredential(
        payload.profileId,
        payload.credentials
      );
      if (success) {
        logger.info('SSH credentials saved successfully', {
          profileId: payload.profileId,
        });
      } else {
        logger.error('Failed to save SSH credentials', undefined, {
          profileId: payload.profileId,
        });
      }
      return { success };
    }
  );

  // Check if credentials exist for profile
  ipcMain.handle(
    'ssh:has-credentials',
    async (_, request: unknown) => {
      const payload = asProfileRequest(request);
      if (!payload) {
        return { hasCredentials: false };
      }
      const hasCredentials = sshCredentialStore.hasCredential(payload.profileId);
      logger.debug('Checking SSH credentials existence', {
        profileId: payload.profileId,
        hasCredentials,
      });
      return { hasCredentials };
    }
  );

  // Get credentials for profile
  ipcMain.handle('ssh:get-credentials', async (_, request: unknown) => {
    const payload = asProfileRequest(request);
    if (!payload) {
      return { success: false, error: 'Invalid SSH get-credentials payload' };
    }
    logger.debug('Retrieving SSH credentials', { profileId: payload.profileId });
    const credentials = sshCredentialStore.getCredential(payload.profileId);
    if (credentials) {
      logger.debug('SSH credentials retrieved successfully', {
        profileId: payload.profileId,
      });
    } else {
      logger.warn('SSH credentials not found', { profileId: payload.profileId });
    }
    return { success: !!credentials, credentials };
  });

  // Remove credentials
  ipcMain.handle(
    'ssh:remove-credentials',
    async (_, request: unknown) => {
      const payload = asProfileRequest(request);
      if (!payload) {
        return { success: false, error: 'Invalid SSH remove-credentials payload' };
      }
      logger.info('Removing SSH credentials', { profileId: payload.profileId });
      const success = sshCredentialStore.removeCredential(payload.profileId);
      if (success) {
        logger.info('SSH credentials removed successfully', {
          profileId: payload.profileId,
        });
      } else {
        logger.warn('Failed to remove SSH credentials', {
          profileId: payload.profileId,
        });
      }
      return { success };
    }
  );

  // Get tunnel status
  ipcMain.handle(
    'ssh:get-tunnel-status',
    async (_, request: unknown) => {
      const payload = asConnectionRequest(request);
      if (!payload) {
        return { success: false, status: null, error: 'Invalid SSH status payload' };
      }
      logger.debug('Getting SSH tunnel status', {
        connectionId: payload.connectionId,
      });
      const status = tunnelManager.getTunnelStatus(payload.connectionId);
      return { success: true, status };
    }
  );

  // Close specific tunnel
  ipcMain.handle('ssh:close-tunnel', async (_, request: unknown) => {
    const payload = asConnectionRequest(request);
    if (!payload) {
      return { success: false, error: 'Invalid SSH close-tunnel payload' };
    }
    logger.info('Closing SSH tunnel', { connectionId: payload.connectionId });
    await tunnelManager.closeTunnel(payload.connectionId);
    logger.info('SSH tunnel closed successfully', {
      connectionId: payload.connectionId,
    });
    return { success: true };
  });

  // Test SSH connection (without creating persistent tunnel)
  ipcMain.handle(
    'ssh:test-connection',
    async (_, request: unknown) => {
      const payload = asTestConnectionRequest(request);
      if (!payload) {
        return { success: false, error: 'Invalid SSH test-connection payload' };
      }
      const testId = `test-${Date.now()}`;
      logger.info('Testing SSH connection', {
        host: payload.config.ssh.host,
        port: payload.config.ssh.port,
        username: payload.config.ssh.username,
        hasPassword: !!payload.credentials.password,
        hasPrivateKey: !!payload.credentials.privateKey,
      });
      try {
        // Build full credentials object for testing
        const fullCredentials: SSHCredential = {
          profileId: testId,
          ...payload.credentials,
        };

        const localPort = await tunnelManager.createTunnel(
          testId,
          payload.config,
          fullCredentials
        );
        await tunnelManager.closeTunnel(testId);
        logger.info('SSH connection test successful', {
          host: payload.config.ssh.host,
          localPort,
        });
        return {
          success: true,
          message: `SSH tunnel established successfully on port ${localPort}`,
        };
      } catch (error) {
        logger.error('SSH connection test failed', error, {
          host: payload.config.ssh.host,
          port: payload.config.ssh.port,
        });
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'SSH connection failed',
        };
      }
    }
  );

  // Check if tunnel exists for connection
  ipcMain.handle(
    'ssh:has-tunnel',
    async (_, request: unknown) => {
      const payload = asConnectionRequest(request);
      if (!payload) {
        return { hasTunnel: false };
      }
      const hasTunnel = tunnelManager.hasTunnel(payload.connectionId);
      logger.debug('Checking SSH tunnel existence', {
        connectionId: payload.connectionId,
        hasTunnel,
      });
      return { hasTunnel };
    }
  );
}

/**
 * Cleanup SSH handlers and close all tunnels
 */
export function cleanupSSHHandlers(): void {
  logger.info('Cleaning up SSH handlers and closing all tunnels');
  tunnelManager.closeAllTunnels();
  logger.info('All SSH tunnels closed');
}

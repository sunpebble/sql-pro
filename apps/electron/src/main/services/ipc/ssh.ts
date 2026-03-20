/**
 * SSH IPC Handlers
 *
 * Provides IPC handlers for SSH tunnel operations:
 * - Credential management (save/get/remove)
 * - Tunnel status and lifecycle
 * - Connection testing
 */

import type { SSHCredential, SSHTunnelConfig } from '../ssh/types';
import { ipcMain } from 'electron';
import { logger } from '../../lib/logger';
import { sshCredentialStore, tunnelManager } from '../ssh';

/**
 * Register all SSH-related IPC handlers
 */
export function setupSSHHandlers(): void {
  // Save SSH credentials securely
  ipcMain.handle(
    'ssh:save-credentials',
    async (
      _,
      request: {
        profileId: string;
        credentials: Partial<Omit<SSHCredential, 'profileId'>>;
      }
    ) => {
      logger.info('Saving SSH credentials', {
        profileId: request.profileId,
        hasPassword: !!request.credentials.password,
        hasPrivateKey: !!request.credentials.privateKey,
        hasPassphrase: !!request.credentials.passphrase,
      });
      const success = sshCredentialStore.saveCredential(
        request.profileId,
        request.credentials
      );
      if (success) {
        logger.info('SSH credentials saved successfully', {
          profileId: request.profileId,
        });
      } else {
        logger.error('Failed to save SSH credentials', undefined, {
          profileId: request.profileId,
        });
      }
      return { success };
    }
  );

  // Check if credentials exist for profile
  ipcMain.handle(
    'ssh:has-credentials',
    async (_, request: { profileId: string }) => {
      const hasCredentials = sshCredentialStore.hasCredential(request.profileId);
      logger.debug('Checking SSH credentials existence', {
        profileId: request.profileId,
        hasCredentials,
      });
      return { hasCredentials };
    }
  );

  // Get credentials for profile
  ipcMain.handle('ssh:get-credentials', async (_, request: { profileId: string }) => {
    logger.debug('Retrieving SSH credentials', { profileId: request.profileId });
    const credentials = sshCredentialStore.getCredential(request.profileId);
    if (credentials) {
      logger.debug('SSH credentials retrieved successfully', {
        profileId: request.profileId,
      });
    } else {
      logger.warn('SSH credentials not found', { profileId: request.profileId });
    }
    return { success: !!credentials, credentials };
  });

  // Remove credentials
  ipcMain.handle(
    'ssh:remove-credentials',
    async (_, request: { profileId: string }) => {
      logger.info('Removing SSH credentials', { profileId: request.profileId });
      const success = sshCredentialStore.removeCredential(request.profileId);
      if (success) {
        logger.info('SSH credentials removed successfully', {
          profileId: request.profileId,
        });
      } else {
        logger.warn('Failed to remove SSH credentials', {
          profileId: request.profileId,
        });
      }
      return { success };
    }
  );

  // Get tunnel status
  ipcMain.handle(
    'ssh:get-tunnel-status',
    async (_, request: { connectionId: string }) => {
      logger.debug('Getting SSH tunnel status', {
        connectionId: request.connectionId,
      });
      const status = tunnelManager.getTunnelStatus(request.connectionId);
      return { success: true, status };
    }
  );

  // Close specific tunnel
  ipcMain.handle('ssh:close-tunnel', async (_, request: { connectionId: string }) => {
    logger.info('Closing SSH tunnel', { connectionId: request.connectionId });
    await tunnelManager.closeTunnel(request.connectionId);
    logger.info('SSH tunnel closed successfully', { connectionId: request.connectionId });
    return { success: true };
  });

  // Test SSH connection (without creating persistent tunnel)
  ipcMain.handle(
    'ssh:test-connection',
    async (
      _,
      request: {
        config: SSHTunnelConfig;
        credentials: Partial<Omit<SSHCredential, 'profileId'>>;
      }
    ) => {
      const testId = `test-${Date.now()}`;
      logger.info('Testing SSH connection', {
        host: request.config.ssh.host,
        port: request.config.ssh.port,
        username: request.config.ssh.username,
        hasPassword: !!request.credentials.password,
        hasPrivateKey: !!request.credentials.privateKey,
      });
      try {
        // Build full credentials object for testing
        const fullCredentials: SSHCredential = {
          profileId: testId,
          ...request.credentials,
        };

        const localPort = await tunnelManager.createTunnel(
          testId,
          request.config,
          fullCredentials
        );
        await tunnelManager.closeTunnel(testId);
        logger.info('SSH connection test successful', {
          host: request.config.ssh.host,
          localPort,
        });
        return {
          success: true,
          message: `SSH tunnel established successfully on port ${localPort}`,
        };
      } catch (error) {
        logger.error('SSH connection test failed', error, {
          host: request.config.ssh.host,
          port: request.config.ssh.port,
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
    async (_, request: { connectionId: string }) => {
      const hasTunnel = tunnelManager.hasTunnel(request.connectionId);
      logger.debug('Checking SSH tunnel existence', {
        connectionId: request.connectionId,
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

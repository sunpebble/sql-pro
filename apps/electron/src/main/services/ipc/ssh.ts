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
      profileId: string,
      credentials: Partial<Omit<SSHCredential, 'profileId'>>
    ) => {
      logger.info('Saving SSH credentials', {
        profileId,
        hasPassword: !!credentials.password,
        hasPrivateKey: !!credentials.privateKey,
        hasPassphrase: !!credentials.passphrase,
      });
      const success = sshCredentialStore.saveCredential(profileId, credentials);
      if (success) {
        logger.info('SSH credentials saved successfully', { profileId });
      } else {
        logger.error('Failed to save SSH credentials', undefined, {
          profileId,
        });
      }
      return { success };
    }
  );

  // Check if credentials exist for profile
  ipcMain.handle('ssh:has-credentials', async (_, profileId: string) => {
    const hasCredentials = sshCredentialStore.hasCredential(profileId);
    logger.debug('Checking SSH credentials existence', {
      profileId,
      hasCredentials,
    });
    return { hasCredentials };
  });

  // Get credentials for profile
  ipcMain.handle('ssh:get-credentials', async (_, profileId: string) => {
    logger.debug('Retrieving SSH credentials', { profileId });
    const credentials = sshCredentialStore.getCredential(profileId);
    if (credentials) {
      logger.debug('SSH credentials retrieved successfully', { profileId });
    } else {
      logger.warn('SSH credentials not found', { profileId });
    }
    return { success: !!credentials, credentials };
  });

  // Remove credentials
  ipcMain.handle('ssh:remove-credentials', async (_, profileId: string) => {
    logger.info('Removing SSH credentials', { profileId });
    const success = sshCredentialStore.removeCredential(profileId);
    if (success) {
      logger.info('SSH credentials removed successfully', { profileId });
    } else {
      logger.warn('Failed to remove SSH credentials', { profileId });
    }
    return { success };
  });

  // Get tunnel status
  ipcMain.handle('ssh:get-tunnel-status', async (_, connectionId: string) => {
    logger.debug('Getting SSH tunnel status', { connectionId });
    const status = tunnelManager.getTunnelStatus(connectionId);
    return { success: true, status };
  });

  // Close specific tunnel
  ipcMain.handle('ssh:close-tunnel', async (_, connectionId: string) => {
    logger.info('Closing SSH tunnel', { connectionId });
    await tunnelManager.closeTunnel(connectionId);
    logger.info('SSH tunnel closed successfully', { connectionId });
    return { success: true };
  });

  // Test SSH connection (without creating persistent tunnel)
  ipcMain.handle(
    'ssh:test-connection',
    async (
      _,
      config: SSHTunnelConfig,
      credentials: Partial<Omit<SSHCredential, 'profileId'>>
    ) => {
      const testId = `test-${Date.now()}`;
      logger.info('Testing SSH connection', {
        host: config.ssh.host,
        port: config.ssh.port,
        username: config.ssh.username,
        hasPassword: !!credentials.password,
        hasPrivateKey: !!credentials.privateKey,
      });
      try {
        // Build full credentials object for testing
        const fullCredentials: SSHCredential = {
          profileId: testId,
          ...credentials,
        };

        const localPort = await tunnelManager.createTunnel(
          testId,
          config,
          fullCredentials
        );
        await tunnelManager.closeTunnel(testId);
        logger.info('SSH connection test successful', {
          host: config.ssh.host,
          localPort,
        });
        return {
          success: true,
          message: `SSH tunnel established successfully on port ${localPort}`,
        };
      } catch (error) {
        logger.error('SSH connection test failed', error, {
          host: config.ssh.host,
          port: config.ssh.port,
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
  ipcMain.handle('ssh:has-tunnel', async (_, connectionId: string) => {
    const hasTunnel = tunnelManager.hasTunnel(connectionId);
    logger.debug('Checking SSH tunnel existence', { connectionId, hasTunnel });
    return { hasTunnel };
  });
}

/**
 * Cleanup SSH handlers and close all tunnels
 */
export function cleanupSSHHandlers(): void {
  logger.info('Cleaning up SSH handlers and closing all tunnels');
  tunnelManager.closeAllTunnels();
  logger.info('All SSH tunnels closed');
}

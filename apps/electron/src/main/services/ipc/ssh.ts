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
      const success = sshCredentialStore.saveCredential(profileId, credentials);
      return { success };
    }
  );

  // Check if credentials exist for profile
  ipcMain.handle('ssh:has-credentials', async (_, profileId: string) => {
    const hasCredentials = sshCredentialStore.hasCredential(profileId);
    return { hasCredentials };
  });

  // Get credentials for profile
  ipcMain.handle('ssh:get-credentials', async (_, profileId: string) => {
    const credentials = sshCredentialStore.getCredential(profileId);
    return { success: !!credentials, credentials };
  });

  // Remove credentials
  ipcMain.handle('ssh:remove-credentials', async (_, profileId: string) => {
    const success = sshCredentialStore.removeCredential(profileId);
    return { success };
  });

  // Get tunnel status
  ipcMain.handle('ssh:get-tunnel-status', async (_, connectionId: string) => {
    const status = tunnelManager.getTunnelStatus(connectionId);
    return { success: true, status };
  });

  // Close specific tunnel
  ipcMain.handle('ssh:close-tunnel', async (_, connectionId: string) => {
    await tunnelManager.closeTunnel(connectionId);
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
        return {
          success: true,
          message: `SSH tunnel established successfully on port ${localPort}`,
        };
      } catch (error) {
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
    return { hasTunnel };
  });
}

/**
 * Cleanup SSH handlers and close all tunnels
 */
export function cleanupSSHHandlers(): void {
  tunnelManager.closeAllTunnels();
}

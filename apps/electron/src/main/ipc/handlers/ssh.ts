/**
 * SSH IPC Handler
 *
 * Handles IPC for SSH tunnel operations including credential management,
 * tunnel lifecycle, and connection testing.
 */

import type { SSHCredential, SSHTunnelConfig } from '../../services/ssh/types';
import type {HandlerContext} from '../base/handler';
import { sshCredentialStore, tunnelManager } from '../../services/ssh';
import {  IpcHandler } from '../base/handler';

export class SSHHandler extends IpcHandler {
  constructor() {
    super({ name: 'ssh' });
  }

  register(): void {
    this.handleLegacy('ssh:save-credentials', this.saveCredentials.bind(this));
    this.handleLegacy('ssh:has-credentials', this.hasCredentials.bind(this));
    this.handleLegacy('ssh:get-credentials', this.getCredentials.bind(this));
    this.handleLegacy(
      'ssh:remove-credentials',
      this.removeCredentials.bind(this)
    );
    this.handleLegacy('ssh:get-tunnel-status', this.getTunnelStatus.bind(this));
    this.handleLegacy('ssh:close-tunnel', this.closeTunnel.bind(this));
    this.handleLegacy('ssh:test-connection', this.testConnection.bind(this));
    this.handleLegacy('ssh:has-tunnel', this.hasTunnel.bind(this));
  }

  cleanup(): void {
    super.cleanup();
    this.log('info', 'Cleaning up SSH handlers and closing all tunnels');
    tunnelManager.closeAllTunnels();
    this.log('info', 'All SSH tunnels closed');
  }

  private async saveCredentials(
    request: {
      profileId: string;
      credentials: Partial<Omit<SSHCredential, 'profileId'>>;
    },
    _ctx: HandlerContext
  ): Promise<{ success: boolean }> {
    this.log('info', 'Saving SSH credentials', {
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
      this.log('info', 'SSH credentials saved successfully', {
        profileId: request.profileId,
      });
    } else {
      this.log('error', 'Failed to save SSH credentials', {
        profileId: request.profileId,
      });
    }
    return { success };
  }

  private async hasCredentials(
    request: { profileId: string },
    _ctx: HandlerContext
  ): Promise<{ hasCredentials: boolean }> {
    const hasCredentials = sshCredentialStore.hasCredential(request.profileId);
    this.log('debug', 'Checking SSH credentials existence', {
      profileId: request.profileId,
      hasCredentials,
    });
    return { hasCredentials };
  }

  private async getCredentials(
    request: { profileId: string },
    _ctx: HandlerContext
  ): Promise<{ success: boolean; credentials?: SSHCredential }> {
    this.log('debug', 'Retrieving SSH credentials', {
      profileId: request.profileId,
    });
    const credentials = sshCredentialStore.getCredential(request.profileId);
    if (credentials) {
      this.log('debug', 'SSH credentials retrieved successfully', {
        profileId: request.profileId,
      });
    } else {
      this.log('warn', 'SSH credentials not found', {
        profileId: request.profileId,
      });
    }
    return { success: !!credentials, credentials: credentials || undefined };
  }

  private async removeCredentials(
    request: { profileId: string },
    _ctx: HandlerContext
  ): Promise<{ success: boolean }> {
    this.log('info', 'Removing SSH credentials', {
      profileId: request.profileId,
    });
    const success = sshCredentialStore.removeCredential(request.profileId);
    if (success) {
      this.log('info', 'SSH credentials removed successfully', {
        profileId: request.profileId,
      });
    } else {
      this.log('warn', 'Failed to remove SSH credentials', {
        profileId: request.profileId,
      });
    }
    return { success };
  }

  private async getTunnelStatus(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<{ success: boolean; status: unknown }> {
    this.log('debug', 'Getting SSH tunnel status', {
      connectionId: request.connectionId,
    });
    const status = tunnelManager.getTunnelStatus(request.connectionId);
    return { success: true, status };
  }

  private async closeTunnel(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<{ success: boolean }> {
    this.log('info', 'Closing SSH tunnel', {
      connectionId: request.connectionId,
    });
    await tunnelManager.closeTunnel(request.connectionId);
    this.log('info', 'SSH tunnel closed successfully', {
      connectionId: request.connectionId,
    });
    return { success: true };
  }

  private async testConnection(
    request: {
      config: SSHTunnelConfig;
      credentials: Partial<Omit<SSHCredential, 'profileId'>>;
    },
    _ctx: HandlerContext
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const testId = `test-${Date.now()}`;
    this.log('info', 'Testing SSH connection', {
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
      this.log('info', 'SSH connection test successful', {
        host: request.config.ssh.host,
        localPort,
      });
      return {
        success: true,
        message: `SSH tunnel established successfully on port ${localPort}`,
      };
    } catch (error) {
      this.log('error', 'SSH connection test failed', {
        host: request.config.ssh.host,
        port: request.config.ssh.port,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SSH connection failed',
      };
    }
  }

  private async hasTunnel(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<{ hasTunnel: boolean }> {
    const hasTunnel = tunnelManager.hasTunnel(request.connectionId);
    this.log('debug', 'Checking SSH tunnel existence', {
      connectionId: request.connectionId,
      hasTunnel,
    });
    return { hasTunnel };
  }
}

// Export singleton instance
export const sshHandler = new SSHHandler();

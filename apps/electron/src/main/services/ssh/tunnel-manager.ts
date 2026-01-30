/**
 * SSH Tunnel Manager
 *
 * Manages the lifecycle of multiple SSH tunnel connections.
 * Provides a central registry for creating, tracking, and closing tunnels.
 */

import type { SSHCredential } from './ssh-credential-store';
import type { SSHTunnelConfig, TunnelStatus } from './types';
import { SSHTunnel } from './tunnel-connection';

/**
 * TunnelManager manages multiple SSH tunnel connections
 *
 * Each tunnel is associated with a connection ID and can be
 * created, retrieved, or closed independently.
 */
export class TunnelManager {
  private tunnels: Map<string, SSHTunnel> = new Map();

  /**
   * Create and connect a new SSH tunnel
   *
   * @param connectionId - Unique identifier for this connection
   * @param config - SSH tunnel configuration
   * @param credentials - Decrypted SSH credentials
   * @returns The local port the tunnel is listening on
   */
  async createTunnel(
    connectionId: string,
    config: SSHTunnelConfig,
    credentials: SSHCredential
  ): Promise<number> {
    // Close existing tunnel if any
    if (this.tunnels.has(connectionId)) {
      await this.closeTunnel(connectionId);
    }

    const tunnel = new SSHTunnel(config, credentials);

    // Subscribe to tunnel events for logging/monitoring
    tunnel.on('statusChange', (status: TunnelStatus) => {
      // Log status changes for debugging
      if (status.state === 'error') {
        console.error(`SSH tunnel [${connectionId}] status:`, status.state);
      }
    });

    tunnel.on('error', (error: Error) => {
      console.error(`SSH tunnel [${connectionId}] error:`, error.message);
    });

    tunnel.on('reconnected', (_port: number) => {
      // Reconnection handled silently - status change event will fire
    });

    // Store the tunnel
    this.tunnels.set(connectionId, tunnel);

    // Connect and return the local port
    const localPort = await tunnel.connect();
    return localPort;
  }

  /**
   * Get an existing tunnel by connection ID
   *
   * @param connectionId - Connection identifier
   * @returns The tunnel or null if not found
   */
  getTunnel(connectionId: string): SSHTunnel | null {
    return this.tunnels.get(connectionId) || null;
  }

  /**
   * Get the status of a tunnel
   *
   * @param connectionId - Connection identifier
   * @returns The tunnel status or null if not found
   */
  getTunnelStatus(connectionId: string): TunnelStatus | null {
    const tunnel = this.tunnels.get(connectionId);
    return tunnel ? tunnel.status : null;
  }

  /**
   * Check if a tunnel exists for a connection
   *
   * @param connectionId - Connection identifier
   * @returns true if tunnel exists
   */
  hasTunnel(connectionId: string): boolean {
    return this.tunnels.has(connectionId);
  }

  /**
   * Close and remove a tunnel
   *
   * @param connectionId - Connection identifier
   */
  async closeTunnel(connectionId: string): Promise<void> {
    const tunnel = this.tunnels.get(connectionId);
    if (tunnel) {
      await tunnel.close();
      this.tunnels.delete(connectionId);
    }
  }

  /**
   * Close all tunnels
   * Call this on app shutdown to clean up resources
   */
  closeAllTunnels(): void {
    for (const [connectionId, tunnel] of this.tunnels) {
      tunnel.close().catch((error) => {
        console.error(`Error closing tunnel [${connectionId}]:`, error);
      });
    }

    this.tunnels.clear();
  }

  /**
   * Get the number of active tunnels
   */
  get activeTunnelCount(): number {
    return this.tunnels.size;
  }

  /**
   * Get all active connection IDs
   */
  getActiveConnectionIds(): string[] {
    return Array.from(this.tunnels.keys());
  }
}

// Export singleton instance
export const tunnelManager = new TunnelManager();

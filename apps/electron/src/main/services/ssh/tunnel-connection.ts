/**
 * SSH Tunnel Connection
 *
 * Manages individual SSH tunnel connections with support for:
 * - Password and private key authentication
 * - Jump host (bastion) connections
 * - Dynamic local port allocation
 * - Auto-reconnection with exponential backoff
 */

import type {ConnectConfig} from 'ssh2';
import type { SSHCredential } from './ssh-credential-store';
import type { SSHTunnelConfig, TunnelState, TunnelStatus } from './types';
import { EventEmitter } from 'node:events';
import * as net from 'node:net';
import { Client  } from 'ssh2';

/**
 * SSHTunnel manages a single SSH tunnel connection
 *
 * Events:
 * - 'statusChange': Emitted when tunnel status changes
 * - 'connected': Emitted when tunnel is established
 * - 'disconnected': Emitted when tunnel is closed
 * - 'reconnected': Emitted after successful reconnection
 * - 'error': Emitted on connection errors
 */
export class SSHTunnel extends EventEmitter {
  private sshClient: Client | null = null;
  private jumpClient: Client | null = null;
  private server: net.Server | null = null;
  private _localPort = 0;
  private _status: TunnelStatus = { state: 'disconnected' };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private shouldReconnect = true;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: SSHTunnelConfig,
    private readonly credentials: SSHCredential
  ) {
    super();
  }

  /**
   * Get the local port the tunnel is listening on
   */
  get localPort(): number {
    return this._localPort;
  }

  /**
   * Get current tunnel status
   */
  get status(): TunnelStatus {
    return { ...this._status };
  }

  /**
   * Update status and emit event
   */
  private setStatus(state: TunnelState, extra?: Partial<TunnelStatus>): void {
    this._status = {
      state,
      localPort: this._localPort,
      reconnectAttempts: this.reconnectAttempts,
      ...extra,
    };
    this.emit('statusChange', this._status);
  }

  /**
   * Establish the SSH tunnel connection
   * @returns The local port the tunnel is listening on
   */
  async connect(): Promise<number> {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.setStatus('connecting');

    try {
      if (this.config.jumpHost?.enabled) {
        await this.connectThroughJumpHost();
      } else {
        await this.connectDirect();
      }

      this._localPort = await this.startLocalServer();
      this.setStatus('connected');
      this.emit('connected', this._localPort);

      return this._localPort;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.setStatus('error', { error: errorMessage });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Direct SSH connection to the target server
   */
  private async connectDirect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sshClient = new Client();

      this.sshClient.on('ready', () => {
        resolve();
      });

      this.sshClient.on('error', (err) => {
        reject(err);
      });

      this.sshClient.on('close', () => {
        this.handleDisconnect();
      });

      this.sshClient.on('end', () => {
        this.handleDisconnect();
      });

      const connectConfig = this.buildConnectConfig(
        this.config.ssh,
        this.credentials.password,
        this.credentials.privateKey,
        this.credentials.passphrase
      );

      this.sshClient.connect(connectConfig);
    });
  }

  /**
   * Connect through a jump host (bastion)
   */
  private async connectThroughJumpHost(): Promise<void> {
    if (!this.config.jumpHost) {
      throw new Error('Jump host configuration is required');
    }

    // First, connect to the jump host
    await new Promise<void>((resolve, reject) => {
      this.jumpClient = new Client();

      this.jumpClient.on('ready', () => {
        resolve();
      });

      this.jumpClient.on('error', (err) => {
        reject(new Error(`Jump host connection failed: ${err.message}`));
      });

      this.jumpClient.on('close', () => {
        this.handleDisconnect();
      });

      const jumpConfig = this.buildConnectConfig(
        this.config.jumpHost!,
        this.credentials.jumpHostPassword,
        this.credentials.jumpHostPrivateKey,
        this.credentials.jumpHostPassphrase
      );

      this.jumpClient.connect(jumpConfig);
    });

    // Then, forward through the jump host to the target
    await new Promise<void>((resolve, reject) => {
      if (!this.jumpClient) {
        reject(new Error('Jump client not connected'));
        return;
      }

      this.jumpClient.forwardOut(
        '127.0.0.1',
        0,
        this.config.ssh.host,
        this.config.ssh.port || 22,
        (err, stream) => {
          if (err) {
            reject(
              new Error(
                `Port forwarding through jump host failed: ${err.message}`
              )
            );
            return;
          }

          // Connect to the target through the forwarded stream
          this.sshClient = new Client();

          this.sshClient.on('ready', () => {
            resolve();
          });

          this.sshClient.on('error', (err) => {
            reject(err);
          });

          this.sshClient.on('close', () => {
            this.handleDisconnect();
          });

          const targetConfig = this.buildConnectConfig(
            this.config.ssh,
            this.credentials.password,
            this.credentials.privateKey,
            this.credentials.passphrase
          );

          this.sshClient.connect({
            ...targetConfig,
            sock: stream,
          });
        }
      );
    });
  }

  /**
   * Build ssh2 ConnectConfig from our configuration
   */
  private buildConnectConfig(
    config: {
      host: string;
      port?: number;
      username: string;
      authMethod: string;
    },
    password?: string,
    privateKey?: string,
    passphrase?: string
  ): ConnectConfig {
    const connectConfig: ConnectConfig = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      keepaliveInterval: this.config.keepaliveInterval || 10000,
      readyTimeout: this.config.readyTimeout || 20000,
    };

    if (config.authMethod === 'password' && password) {
      connectConfig.password = password;
    } else if (config.authMethod === 'privateKey' && privateKey) {
      connectConfig.privateKey = privateKey;
      if (passphrase) {
        connectConfig.passphrase = passphrase;
      }
    }

    return connectConfig;
  }

  /**
   * Start a local TCP server that forwards connections through the SSH tunnel
   * @returns The dynamically allocated local port
   */
  private async startLocalServer(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((localSocket) => {
        if (!this.sshClient) {
          localSocket.destroy();
          return;
        }

        // Forward the local connection through the SSH tunnel
        this.sshClient.forwardOut(
          '127.0.0.1',
          localSocket.localPort || 0,
          this.config.remoteHost,
          this.config.remotePort,
          (err, stream) => {
            if (err) {
              console.error('SSH tunnel forward error:', err);
              localSocket.destroy();
              return;
            }

            // Pipe data between local socket and SSH stream
            localSocket.pipe(stream);
            stream.pipe(localSocket);

            localSocket.on('error', () => {
              stream.destroy();
            });

            stream.on('error', () => {
              localSocket.destroy();
            });

            localSocket.on('close', () => {
              stream.destroy();
            });

            stream.on('close', () => {
              localSocket.destroy();
            });
          }
        );
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      // Listen on specified port or 0 for dynamic allocation
      const listenPort = this.config.localPort || 0;
      this.server.listen(listenPort, '127.0.0.1', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });
    });
  }

  /**
   * Handle disconnection and trigger reconnection if enabled
   */
  private handleDisconnect(): void {
    if (!this.shouldReconnect) {
      return;
    }

    if (this._status.state === 'disconnected') {
      return; // Already handled
    }

    this.setStatus('disconnected');
    this.emit('disconnected');

    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async reconnect(): Promise<void> {
    if (!this.shouldReconnect) {
      return;
    }

    this.reconnectAttempts++;
    this.setStatus('reconnecting');

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(
      1000 * 2**(this.reconnectAttempts - 1),
      16000
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        // Clean up existing connections
        this.cleanupConnections();

        // Attempt to reconnect
        if (this.config.jumpHost?.enabled) {
          await this.connectThroughJumpHost();
        } else {
          await this.connectDirect();
        }

        this._localPort = await this.startLocalServer();
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.emit('reconnected', this._localPort);
      } catch (error) {
        console.error(
          `SSH tunnel reconnection attempt ${this.reconnectAttempts} failed:`,
          error
        );

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        } else {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.setStatus('error', {
            error: `Max reconnection attempts reached: ${errorMessage}`,
          });
          this.emit('error', error);
        }
      }
    }, delay);
  }

  /**
   * Clean up SSH client connections
   */
  private cleanupConnections(): void {
    if (this.sshClient) {
      this.sshClient.removeAllListeners();
      this.sshClient.end();
      this.sshClient = null;
    }

    if (this.jumpClient) {
      this.jumpClient.removeAllListeners();
      this.jumpClient.end();
      this.jumpClient = null;
    }
  }

  /**
   * Close the tunnel and clean up all resources
   */
  async close(): Promise<void> {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Close local server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          resolve();
        });
      });
      this.server = null;
    }

    // Close SSH connections
    this.cleanupConnections();

    this._localPort = 0;
    this.setStatus('disconnected');
    this.emit('disconnected');
  }
}

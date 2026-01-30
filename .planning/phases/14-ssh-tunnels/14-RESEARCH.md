# Phase 14: SSH Tunnels - Research

**Researched:** 2026-01-30
**Domain:** SSH tunneling, secure database connectivity, Electron/Node.js networking
**Confidence:** HIGH

## Summary

SSH tunneling enables secure database connections to servers behind firewalls or private networks by creating encrypted TCP port forwarding through an SSH server. This phase implements SSH tunnel support for MySQL and PostgreSQL connections in SQL Pro.

The standard approach in Node.js is to use the `ssh2` library for SSH connections with port forwarding capabilities. The tunnel is established before the database connection, forwarding a local port to the remote database port through the SSH server. The database client then connects to `localhost` on the forwarded port.

Key architectural decisions:

1. Use `ssh2` directly (not wrapper libraries) for full control over connection lifecycle, reconnection, and error handling
2. Store SSH credentials separately using existing `safeStorage` infrastructure
3. Implement tunnel management as a service layer that wraps database adapters
4. Support both password and private key authentication from the start
5. Implement jump host support using chained SSH connections

**Primary recommendation:** Use `ssh2` library directly with a `TunnelManager` service class that manages tunnel lifecycle, integrates with the existing database adapter pattern, and leverages Electron's `safeStorage` for credential encryption.

## Standard Stack

### Core

| Library | Version | Purpose                    | Why Standard                                                                                                                      |
| ------- | ------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ssh2`  | ^1.15.0 | SSH2 client implementation | De facto standard for Node.js SSH, actively maintained, supports all required features (password auth, key auth, port forwarding) |

### Supporting

| Library        | Version    | Purpose                           | When to Use                        |
| -------------- | ---------- | --------------------------------- | ---------------------------------- |
| `ssh2-streams` | (bundled)  | Low-level SSH stream handling     | Bundled with ssh2, used internally |
| `net`          | (built-in) | TCP server for local port binding | For dynamic port allocation        |

### Alternatives Considered

| Instead of | Could Use         | Tradeoff                                                                |
| ---------- | ----------------- | ----------------------------------------------------------------------- |
| `ssh2`     | `tunnel-ssh`      | Simpler API but less control over reconnection logic and error handling |
| `ssh2`     | `ssh2-promise`    | Promise wrapper, but adds abstraction layer we don't need               |
| `ssh2`     | `open-ssh-tunnel` | Modern wrapper but fewer downloads, less battle-tested                  |

**Installation:**

```bash
pnpm add ssh2
pnpm add -D @types/ssh2
```

## Architecture Patterns

### Recommended Project Structure

```
apps/electron/src/main/services/
├── ssh/
│   ├── tunnel-manager.ts       # Main tunnel lifecycle management
│   ├── tunnel-connection.ts    # Individual tunnel connection class
│   ├── ssh-credential-store.ts # SSH credential encryption/storage
│   └── types.ts                # SSH-specific types
├── database-adapters/
│   └── ... (existing adapters) # Adapters remain unchanged
└── ipc/
    └── ssh.ts                  # IPC handlers for SSH operations
```

### Pattern 1: Tunnel-Wrapped Database Connection

**What:** The tunnel is established before opening a database connection. The database adapter connects to `localhost:dynamicPort` instead of the remote host.

**When to use:** Always when SSH tunnel is enabled for a connection.

**Example:**

```typescript
// Source: ssh2 documentation pattern
import { Client } from 'ssh2';
import net from 'net';

interface TunnelConfig {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPassword?: string;
  sshPrivateKey?: string;
  sshPassphrase?: string;
  remoteHost: string;
  remotePort: number;
  localPort?: number; // 0 for dynamic allocation
}

class TunnelConnection {
  private sshClient: Client;
  private server: net.Server | null = null;
  private localPort: number = 0;

  async connect(config: TunnelConfig): Promise<number> {
    return new Promise((resolve, reject) => {
      this.sshClient = new Client();

      this.sshClient.on('ready', () => {
        // Create local TCP server for port forwarding
        this.server = net.createServer((socket) => {
          this.sshClient.forwardOut(
            '127.0.0.1',
            socket.localPort,
            config.remoteHost,
            config.remotePort,
            (err, stream) => {
              if (err) {
                socket.end();
                return;
              }
              socket.pipe(stream).pipe(socket);
            }
          );
        });

        // Listen on dynamic port (0) or specified port
        this.server.listen(config.localPort || 0, '127.0.0.1', () => {
          const address = this.server!.address();
          this.localPort = typeof address === 'object' ? address!.port : 0;
          resolve(this.localPort);
        });
      });

      this.sshClient.on('error', reject);

      // Connect with password or private key
      this.sshClient.connect({
        host: config.sshHost,
        port: config.sshPort,
        username: config.sshUsername,
        password: config.sshPassword,
        privateKey: config.sshPrivateKey,
        passphrase: config.sshPassphrase,
      });
    });
  }

  async close(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    this.sshClient.end();
  }
}
```

### Pattern 2: Jump Host (Multi-Hop) Connection

**What:** Connect through a bastion/jump host to reach the final SSH server.

**When to use:** When the database server is in a private network only accessible via a bastion host.

**Example:**

```typescript
// Source: ssh2 multi-hop pattern from community examples
async connectThroughJumpHost(
  jumpConfig: SSHConfig,
  targetConfig: SSHConfig,
  tunnelConfig: TunnelConfig
): Promise<number> {
  return new Promise((resolve, reject) => {
    const jumpClient = new Client();
    const targetClient = new Client();

    jumpClient.on('ready', () => {
      // Forward from jump host to target SSH server
      jumpClient.forwardOut(
        '127.0.0.1',
        0,
        targetConfig.host,
        targetConfig.port || 22,
        (err, stream) => {
          if (err) {
            jumpClient.end();
            return reject(err);
          }

          // Connect to target through the forwarded stream
          targetClient.connect({
            sock: stream,
            username: targetConfig.username,
            password: targetConfig.password,
            privateKey: targetConfig.privateKey,
          });
        }
      );
    });

    targetClient.on('ready', () => {
      // Now set up the database port forwarding on target
      // ... (same pattern as Pattern 1)
    });

    jumpClient.connect({
      host: jumpConfig.host,
      port: jumpConfig.port || 22,
      username: jumpConfig.username,
      password: jumpConfig.password,
      privateKey: jumpConfig.privateKey,
    });
  });
}
```

### Pattern 3: Secure Credential Storage

**What:** Store SSH passwords and private keys using Electron's safeStorage API.

**When to use:** Always for SSH credentials that need persistence.

**Example:**

```typescript
// Source: Existing password-storage.ts pattern in codebase
import { safeStorage } from 'electron';

interface SSHCredential {
  profileId: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

class SSHCredentialStore {
  private storePath: string;

  saveCredential(
    profileId: string,
    credential: Partial<SSHCredential>
  ): boolean {
    if (!safeStorage.isEncryptionAvailable()) {
      return false;
    }

    const existing = this.getCredential(profileId) || {};
    const merged = { ...existing, ...credential };

    // Encrypt sensitive fields
    const encrypted = {
      profileId,
      password: credential.password
        ? safeStorage.encryptString(credential.password).toString('base64')
        : existing.password,
      privateKey: credential.privateKey
        ? safeStorage.encryptString(credential.privateKey).toString('base64')
        : existing.privateKey,
      passphrase: credential.passphrase
        ? safeStorage.encryptString(credential.passphrase).toString('base64')
        : existing.passphrase,
    };

    // Store to file (similar to password-storage.ts pattern)
    // ...
    return true;
  }
}
```

### Pattern 4: Auto-Reconnection with Exponential Backoff

**What:** Automatically reconnect tunnels after network interruption.

**When to use:** Always for production tunnel connections.

**Example:**

```typescript
// Source: Standard reconnection pattern
class TunnelConnection {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelay = 1000;

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect(this.config);
      this.reconnectAttempts = 0;
      this.emit('reconnected');
    } catch (err) {
      this.emit('reconnectFailed', {
        attempt: this.reconnectAttempts,
        error: err,
      });
      await this.reconnect();
    }
  }

  private setupConnectionHandlers(): void {
    this.sshClient.on('end', () => {
      if (this.shouldReconnect) {
        this.reconnect();
      }
    });

    this.sshClient.on('error', (err) => {
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        this.reconnect();
      }
    });
  }
}
```

### Anti-Patterns to Avoid

- **Global tunnel singleton:** Each database connection should have its own tunnel instance for proper lifecycle management
- **Blocking on tunnel creation:** Use async/await properly; never block the main process
- **Hardcoded ports:** Always use dynamic port allocation (port 0) to avoid conflicts
- **Storing credentials in plain text:** Always use safeStorage for SSH passwords and private keys
- **Ignoring SSH host key verification:** Provide option to save/verify host keys (though can allow "trust on first use")

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                     | Don't Build                | Use Instead              | Why                                                      |
| --------------------------- | -------------------------- | ------------------------ | -------------------------------------------------------- |
| SSH protocol implementation | Custom SSH client          | `ssh2` library           | Complex protocol with many edge cases, security critical |
| Port forwarding             | Manual TCP socket handling | `ssh2.forwardOut()`      | Handles stream management, buffering, cleanup            |
| Private key parsing         | Custom PEM parser          | `ssh2` built-in          | Handles multiple formats (PEM, OpenSSH, PPK)             |
| Encrypted key passphrase    | Custom decryption          | `ssh2` passphrase option | Secure handling built-in                                 |
| Keep-alive                  | Custom ping mechanism      | `ssh2` keepaliveInterval | Protocol-level keep-alive                                |

**Key insight:** SSH is a complex, security-critical protocol. Using battle-tested libraries is essential for security and reliability.

## Common Pitfalls

### Pitfall 1: Port Exhaustion from Leaked Tunnels

**What goes wrong:** Tunnels not properly closed leave local ports bound, eventually exhausting available ports.
**Why it happens:** Database connections closed without closing associated tunnels.
**How to avoid:**

- Track tunnel-to-connection mapping
- Close tunnel when database connection closes
- Implement cleanup on app shutdown
  **Warning signs:** "Address already in use" errors, increasing port numbers over time

### Pitfall 2: Connection Timeout vs SSH Timeout Confusion

**What goes wrong:** Users see "connection timeout" but the issue is SSH authentication failure.
**Why it happens:** Generic error messages don't distinguish SSH layer from database layer.
**How to avoid:**

- Separate SSH connection step from database connection step in error handling
- Provide specific error messages for each layer
- Test SSH connection independently before attempting database connection
  **Warning signs:** All "timeout" errors even with wrong passwords

### Pitfall 3: Private Key Format Incompatibility

**What goes wrong:** Users' private keys fail to authenticate despite being valid.
**Why it happens:** Different key formats (OpenSSH new format, PuTTY PPK, old PEM) require different handling.
**How to avoid:**

- Support multiple key formats (ssh2 handles most automatically)
- Provide clear error messages about unsupported formats
- Document supported key formats in UI
  **Warning signs:** "Invalid key" errors for keys that work with OpenSSH

### Pitfall 4: Blocking Main Process During SSH Handshake

**What goes wrong:** UI freezes during SSH connection.
**Why it happens:** SSH operations performed synchronously or with blocking waits.
**How to avoid:**

- All SSH operations must be async
- Use proper Promise-based patterns
- Consider timeouts for long-running operations
  **Warning signs:** Frozen UI during "Connecting..." state

### Pitfall 5: Jump Host Credential Confusion

**What goes wrong:** Users provide wrong credentials for jump host vs target host.
**Why it happens:** UI doesn't clearly separate the two sets of credentials.
**How to avoid:**

- Clear visual separation in UI
- Distinct labels: "Jump Host" vs "SSH Server" vs "Database Server"
- Help text explaining the connection flow
  **Warning signs:** "Authentication failed" when credentials are correct for wrong hop

## Code Examples

### Complete Tunnel Manager Implementation

```typescript
// Source: Synthesized from ssh2 docs and codebase patterns
import { Client, ConnectConfig } from 'ssh2';
import net from 'net';
import { EventEmitter } from 'events';

export interface SSHTunnelConfig {
  // SSH Connection
  sshHost: string;
  sshPort?: number;
  sshUsername: string;
  authMethod: 'password' | 'privateKey';
  sshPassword?: string;
  sshPrivateKey?: string;
  sshKeyPassphrase?: string;

  // Jump Host (optional)
  jumpHost?: {
    host: string;
    port?: number;
    username: string;
    authMethod: 'password' | 'privateKey';
    password?: string;
    privateKey?: string;
    passphrase?: string;
  };

  // Forwarding
  remoteHost: string;
  remotePort: number;
  localPort?: number; // 0 for auto-assign

  // Options
  keepaliveInterval?: number;
  readyTimeout?: number;
}

export interface TunnelStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  localPort?: number;
  error?: string;
}

export class SSHTunnel extends EventEmitter {
  private config: SSHTunnelConfig;
  private jumpClient: Client | null = null;
  private sshClient: Client | null = null;
  private server: net.Server | null = null;
  private _localPort: number = 0;
  private _status: TunnelStatus = { state: 'disconnected' };

  constructor(config: SSHTunnelConfig) {
    super();
    this.config = config;
  }

  get localPort(): number {
    return this._localPort;
  }

  get status(): TunnelStatus {
    return this._status;
  }

  async connect(): Promise<number> {
    this.updateStatus({ state: 'connecting' });

    try {
      if (this.config.jumpHost) {
        await this.connectThroughJumpHost();
      } else {
        await this.connectDirect();
      }

      this._localPort = await this.startLocalServer();
      this.updateStatus({ state: 'connected', localPort: this._localPort });
      return this._localPort;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.updateStatus({ state: 'error', error: message });
      throw error;
    }
  }

  private async connectDirect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sshClient = new Client();

      this.sshClient.on('ready', () => resolve());
      this.sshClient.on('error', reject);
      this.sshClient.on('end', () => this.handleDisconnect());

      this.sshClient.connect(this.buildConnectConfig(this.config));
    });
  }

  private buildConnectConfig(
    config: SSHTunnelConfig | SSHTunnelConfig['jumpHost']
  ): ConnectConfig {
    if (!config) throw new Error('Config required');

    const connectConfig: ConnectConfig = {
      host: 'host' in config ? config.host : config.sshHost,
      port: ('port' in config ? config.port : config.sshPort) || 22,
      username: 'username' in config ? config.username : config.sshUsername,
      readyTimeout: this.config.readyTimeout || 20000,
      keepaliveInterval: this.config.keepaliveInterval || 10000,
    };

    const authMethod =
      'authMethod' in config ? config.authMethod : config.authMethod;
    if (authMethod === 'password') {
      connectConfig.password =
        'password' in config ? config.password : config.sshPassword;
    } else {
      connectConfig.privateKey =
        'privateKey' in config ? config.privateKey : config.sshPrivateKey;
      connectConfig.passphrase =
        'passphrase' in config ? config.passphrase : config.sshKeyPassphrase;
    }

    return connectConfig;
  }

  private async startLocalServer(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        if (!this.sshClient) {
          socket.end();
          return;
        }

        this.sshClient.forwardOut(
          '127.0.0.1',
          socket.localPort || 0,
          this.config.remoteHost,
          this.config.remotePort,
          (err, stream) => {
            if (err) {
              socket.end();
              return;
            }
            socket.pipe(stream).pipe(socket);
          }
        );
      });

      this.server.on('error', reject);

      this.server.listen(this.config.localPort || 0, '127.0.0.1', () => {
        const addr = this.server!.address();
        if (typeof addr === 'object' && addr) {
          resolve(addr.port);
        } else {
          reject(new Error('Failed to get local port'));
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    if (this.sshClient) {
      this.sshClient.end();
      this.sshClient = null;
    }
    if (this.jumpClient) {
      this.jumpClient.end();
      this.jumpClient = null;
    }
    this.updateStatus({ state: 'disconnected' });
  }

  private updateStatus(status: Partial<TunnelStatus>): void {
    this._status = { ...this._status, ...status };
    this.emit('statusChange', this._status);
  }

  private handleDisconnect(): void {
    // Implement reconnection logic here
    this.emit('disconnected');
  }
}
```

### Type Definitions for SSH Configuration

```typescript
// Source: Extending existing DatabaseConnectionConfig pattern
export interface SSHConfig {
  enabled: boolean;
  host: string;
  port?: number; // Default: 22
  username: string;
  authMethod: 'password' | 'privateKey';
  // Credentials stored separately via safeStorage

  // Jump host configuration (optional)
  jumpHost?: {
    enabled: boolean;
    host: string;
    port?: number;
    username: string;
    authMethod: 'password' | 'privateKey';
  };
}

// Extend DatabaseConnectionConfig
export interface DatabaseConnectionConfig {
  // ... existing fields ...

  /** SSH tunnel configuration */
  ssh?: SSHConfig;
}
```

## State of the Art

| Old Approach               | Current Approach         | When Changed          | Impact                                               |
| -------------------------- | ------------------------ | --------------------- | ---------------------------------------------------- |
| Shell out to `ssh` command | Native `ssh2` library    | 2015+                 | More reliable, cross-platform, better error handling |
| Password-only auth         | Key-based auth preferred | Always                | Better security, required by many servers            |
| Static local port          | Dynamic port allocation  | Current best practice | Avoids port conflicts                                |
| Single-hop tunnels         | Jump host support        | SSH 7.3 (2016)        | Access to isolated networks                          |

**Deprecated/outdated:**

- `tunnel-ssh` < 4.0: Older callback-based API, less maintained
- Manual `ssh` process spawning: Unreliable, platform-dependent

## Open Questions

1. **Host Key Verification**
   - What we know: SSH host key verification is important for security
   - What's unclear: Whether to implement strict verification or "trust on first use" (TOFU)
   - Recommendation: Implement TOFU with option to view/manage known hosts

2. **SSH Agent Support**
   - What we know: Marked as out of scope, but some users may expect it
   - What's unclear: Effort vs benefit tradeoff
   - Recommendation: Defer to future phase, document limitation clearly

3. **Tunnel Health Monitoring**
   - What we know: Tunnels can become stale without explicit errors
   - What's unclear: Best approach for health checks
   - Recommendation: Use SSH keepalive + periodic test queries

## Sources

### Primary (HIGH confidence)

- ssh2 GitHub repository: https://github.com/mscdex/ssh2 - API documentation, examples
- Existing codebase: `password-storage.ts`, `postgresql-adapter.ts` - Pattern references

### Secondary (MEDIUM confidence)

- [Stack Overflow SSH tunneling patterns](https://stackoverflow.com) - Community patterns for Node.js SSH tunneling
- [Medium article on SSH tunneling](https://medium.com) - Multi-hop tunnel implementation patterns
- [npm ssh2 documentation](https://socket.dev) - Package security and API details

### Tertiary (LOW confidence)

- General web search results - Best practices, ecosystem discovery

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - ssh2 is well-established, actively maintained
- Architecture: HIGH - Based on existing codebase patterns and ssh2 documented patterns
- Pitfalls: MEDIUM - Based on general SSH tunneling experience and community knowledge

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (60 days - stable technology)

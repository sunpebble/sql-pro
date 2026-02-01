/**
 * SSH Feature Module
 *
 * Provides SSH tunnel functionality for secure database connections:
 * - SSH tunnel creation and management
 * - SSH credential storage
 * - Connection forwarding
 */

// Re-export SSH IPC handler (note: class name is SSHHandler)
export { SSHHandler } from '../../ipc/handlers/ssh';

// Re-export SSH credential store
export { sshCredentialStore } from '../../services/ssh/ssh-credential-store';

/**
 * Backup Feature Module
 *
 * Provides database backup functionality including:
 * - Automatic scheduled backups
 * - Manual backup creation
 * - Backup restoration
 */

// Re-export backup IPC handler
export { BackupHandler } from '../../ipc/handlers/backup';

// Re-export backup service (exports all functions)
export * from '../../services/backup';

/**
 * IPC Contracts - Type-Safe Channel Definitions
 *
 * This module re-exports channel definitions from @sqlpro/ipc-contracts
 * and provides local channel definitions for the main process.
 */

// Re-export from shared package
export {
  agentChannels,
  backupChannels,
  channels,
  databaseChannels,
  exportChannels,
  historyChannels,
  importChannels,
  licenseChannels,
  preferencesChannels,
  schemaChannels,
  systemChannels,
} from '@sqlpro/ipc-contracts';

export type { Channels } from '@sqlpro/ipc-contracts';

// Re-export utilities
export {
  channel,
  createChannelNamespace,
  schemaChannel,
  streamChannel,
} from '@sqlpro/ipc-contracts';

// Re-export types
export type {
  ChannelInput,
  ChannelOutput,
  IpcChannel,
  IpcError,
  IpcHandler,
  IpcResponse,
  IpcStreamChannel,
  SchemaChannel,
  StreamChunk,
} from '@sqlpro/ipc-contracts';

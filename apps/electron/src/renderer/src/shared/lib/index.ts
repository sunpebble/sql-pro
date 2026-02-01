/**
 * Shared Library
 *
 * Common utility functions used across the application.
 */

export { getAPI, sqlPro } from '../../lib/api';
export {
  type IpcResult,
  isError,
  isSuccess,
  wrapIpcCall,
} from '../../lib/ipc-client';
export { cn } from '../../lib/utils';

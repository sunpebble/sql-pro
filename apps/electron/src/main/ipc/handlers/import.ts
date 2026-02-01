/**
 * Import IPC Handler
 *
 * Handles all import-related IPC operations.
 */

import type { ImportBundleRequest, ImportSchemaRequest } from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  importBundle,
  importSchema,
} from '../../services/query-schema-sharing';
import {  IpcHandler } from '../base/handler';

export class ImportHandler extends IpcHandler {
  constructor() {
    super({ name: 'import' });
  }

  register(): void {
    this.handleLegacy('import:bundle', this.importBundle.bind(this));
    this.handleLegacy('import:schema', this.importSchema.bind(this));
  }

  private async importBundle(
    request: ImportBundleRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; bundle?: unknown; validation?: unknown }> {
    if (!request.data) {
      throw new Error('Import data is required');
    }
    const result = await importBundle(request.data);
    return { success: true, ...result };
  }

  private async importSchema(
    request: ImportSchemaRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; schema?: unknown; validation?: unknown }> {
    if (!request.data) {
      throw new Error('Import data is required');
    }
    const result = await importSchema(request.data);
    return { success: true, ...result };
  }
}

// Export singleton instance
export const importHandler = new ImportHandler();

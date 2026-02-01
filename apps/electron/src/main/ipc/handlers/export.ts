/**
 * Export IPC Handler
 *
 * Handles all export-related IPC operations.
 */

import type {
  ColumnInfo,
  ExportBundleRequest,
  ExportComparisonReportRequest,
  ExportRequest,
  ExportSchemaRequest,
  SchemaComparisonResult,
} from '@shared/types';
import type { Buffer } from 'node:buffer';
import type {HandlerContext} from '../base/handler';
import {
  generateHTMLReport,
  generateJSONReport,
  generateMarkdownReport,
} from '@/lib/comparison-report-generators';
import {
  generateCSV,
  generateExcel,
  generateJSON,
  generateSQL,
} from '@/lib/export-generators';
import { databaseService } from '../../services/database';
import {
  exportBundle,
  exportSchema,
} from '../../services/query-schema-sharing';
import { getSchemaSnapshot } from '../../services/store';
import {  IpcHandler } from '../base/handler';

export class ExportHandler extends IpcHandler {
  constructor() {
    super({ name: 'export' });
  }

  register(): void {
    this.handleLegacy('export:data', this.exportData.bind(this));
    this.handleLegacy('export:bundle', this.exportBundle.bind(this));
    this.handleLegacy('export:schema', this.exportSchema.bind(this));
    this.handleLegacy(
      'export:comparison-report',
      this.exportComparisonReport.bind(this)
    );
  }

  private async exportData(
    request: ExportRequest,
    _ctx: HandlerContext
  ): Promise<{ data: Buffer | string; format: string }> {
    let columns: ColumnInfo[] = [];
    let rows: Record<string, unknown>[] = [];

    const tableData = await databaseService.getTableData(
      request.connectionId,
      request.table,
      1,
      999999,
      undefined,
      undefined,
      undefined,
      request.schema
    );

    if (tableData.success) {
      columns = tableData.columns || [];
      rows = (tableData.rows || []) as Record<string, unknown>[];
    }

    let output: Buffer | string = '';
    if (request.format === 'csv') {
      output = generateCSV(rows, columns);
    } else if (request.format === 'json') {
      output = generateJSON(rows, columns);
    } else if (request.format === 'sql') {
      output = generateSQL(rows, columns, { tableName: request.table });
    } else if (request.format === 'xlsx') {
      output = await generateExcel(rows, columns, {
        sheetName: request.table,
      });
    }

    return {
      data: output,
      format: request.format,
    };
  }

  private async exportBundle(
    _request: ExportBundleRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; data: unknown }> {
    const { data } = await exportBundle({
      name: 'bundle',
      queries: [],
      schemas: [],
    });
    return { success: true, data };
  }

  private async exportSchema(
    request: ExportSchemaRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; data: unknown }> {
    if (request.snapshotId) {
      const snapshot = getSchemaSnapshot(request.snapshotId);
      if (!snapshot) {
        throw new Error(
          `Schema snapshot with ID ${request.snapshotId} not found`
        );
      }
      const { data } = await exportSchema({
        name: snapshot.name,
        description: snapshot.description,
        databaseName: snapshot.connectionPath || '',
        databaseType: 'sqlite',
        format: 'json',
        schemas: snapshot.schemas || [],
      });
      return { success: true, data };
    }
    throw new Error('snapshotId is required');
  }

  private async exportComparisonReport(
    request: ExportComparisonReportRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; data: string; format: string }> {
    const comparisonData = (request.comparison ||
      request.comparisonResult) as SchemaComparisonResult;
    if (!comparisonData) {
      throw new Error('Comparison data is required');
    }
    let output = '';

    if (request.format === 'markdown') {
      output = generateMarkdownReport(comparisonData);
    } else if (request.format === 'html') {
      output = generateHTMLReport(comparisonData);
    } else if (request.format === 'json') {
      output = generateJSONReport(comparisonData);
    }

    return { success: true, data: output, format: request.format };
  }
}

// Export singleton instance
export const exportHandler = new ExportHandler();

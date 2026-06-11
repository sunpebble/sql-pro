/**
 * Mock API definitions for the AI domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';

export interface AiMockApi {
  getSettings: () => Promise<unknown>;
  saveSettings: (r: unknown) => Promise<unknown>;
  fetchAnthropic: (r: unknown) => Promise<unknown>;
  fetchOpenAI: (r: unknown) => Promise<unknown>;
  streamAnthropic: (r: unknown) => Promise<unknown>;
  streamOpenAI: (r: unknown) => Promise<unknown>;
  agentQuery: (r: unknown) => Promise<unknown>;
  cancelStream: (r: unknown) => Promise<unknown>;
  getClaudeCodePaths: () => Promise<unknown>;
}

export function createAiMock(_deps: SqlProApiDeps): AiMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

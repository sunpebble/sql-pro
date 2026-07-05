import type {
  AnalyzeQueryPlanRequest,
  AnalyzeQueryPlanResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  ValidateChangesRequest,
  ValidateChangesResponse,
} from './types';
// Inline channel() helper — avoids @quarry/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return {
    name,
    _input: undefined as unknown as TIn,
    _output: undefined as unknown as TOut,
  };
}

export const queryChannels = {
  execute: channel<ExecuteQueryRequest, ExecuteQueryResponse>('query:execute'),
  analyzePlan: channel<AnalyzeQueryPlanRequest, AnalyzeQueryPlanResponse>(
    'query:analyze-plan'
  ),
} as const;

export const changesChannels = {
  validate: channel<ValidateChangesRequest, ValidateChangesResponse>(
    'changes:validate'
  ),
  apply: channel<ApplyChangesRequest, ApplyChangesResponse>('changes:apply'),
  checkUnsaved: channel<unknown, unknown>('changes:check-unsaved'),
} as const;

export const historyChannels = {
  get: channel<unknown, unknown>('history:get'),
  save: channel<unknown, unknown>('history:save'),
  delete: channel<unknown, unknown>('history:delete'),
  clear: channel<unknown, unknown>('history:clear'),
} as const;

export const sqlLogChannels = {
  get: channel<unknown, unknown>('sql-log:get'),
  clear: channel<unknown, unknown>('sql-log:clear'),
  onEntry: channel<unknown, void>('sql-log:entry'),
} as const;

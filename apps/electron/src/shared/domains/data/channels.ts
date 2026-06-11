import type {
  GetColumnDistributionRequest,
  GetColumnDistributionResponse,
  GetTableDataRequest,
  GetTableDataResponse,
  GetTableRowRangeRequest,
  GetTableRowRangeResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const dataChannels = {
  getTableData: channel<GetTableDataRequest, GetTableDataResponse>(
    'data:get-table-data'
  ),
  getTableRowRange: channel<GetTableRowRangeRequest, GetTableRowRangeResponse>(
    'data:get-table-row-range'
  ),
  getColumnDistribution: channel<
    GetColumnDistributionRequest,
    GetColumnDistributionResponse
  >('data:get-column-distribution'),
} as const;

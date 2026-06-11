import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import { dataChannels } from './channels';

export function createDataApi({ invoke }: SqlProApiDeps) {
  return {
    getTableData: (r: unknown) => invoke(dataChannels.getTableData.name, r),
    getTableRowRange: (r: unknown) =>
      invoke(dataChannels.getTableRowRange.name, r),
    getColumnDistribution: (r: unknown) =>
      invoke(dataChannels.getColumnDistribution.name, r),
  };
}

export type DataApi = ReturnType<typeof createDataApi>;

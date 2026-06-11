import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import {
  changesChannels,
  historyChannels,
  queryChannels,
  sqlLogChannels,
} from './channels';

export function createQueryApi({ invoke, on, off }: SqlProApiDeps) {
  return {
    query: {
      execute: (r: unknown) => invoke(queryChannels.execute.name, r),
      analyzePlan: (r: unknown) => invoke(queryChannels.analyzePlan.name, r),
    },
    changes: {
      validate: (r: unknown) => invoke(changesChannels.validate.name, r),
      apply: (r: unknown) => invoke(changesChannels.apply.name, r),
      checkUnsaved: (r: unknown) =>
        invoke(changesChannels.checkUnsaved.name, r),
    },
    history: {
      get: (r: unknown) => invoke(historyChannels.get.name, r),
      save: (r: unknown) => invoke(historyChannels.save.name, r),
      delete: (r: unknown) => invoke(historyChannels.delete.name, r),
      clear: (r: unknown) => invoke(historyChannels.clear.name, r),
    },
    sqlLog: {
      get: (r: unknown) => invoke(sqlLogChannels.get.name, r),
      clear: (r: unknown) => invoke(sqlLogChannels.clear.name, r),
      onEntry: (cb: (e: unknown) => void) => {
        const handler = (_e: unknown, payload: unknown) => cb(payload);
        on(sqlLogChannels.onEntry.name, handler);
        return () => off(sqlLogChannels.onEntry.name, handler);
      },
    },
  };
}

export type QueryApi = ReturnType<typeof createQueryApi>;

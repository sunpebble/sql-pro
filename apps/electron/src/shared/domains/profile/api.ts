import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import {
  folderChannels,
  preferencesChannels,
  profileChannels,
} from './channels';

export function createProfileApi({ invoke }: SqlProApiDeps) {
  return {
    profile: {
      save: (r: unknown) => invoke(profileChannels.save.name, r),
      update: (r: unknown) => invoke(profileChannels.update.name, r),
      delete: (r: unknown) => invoke(profileChannels.delete.name, r),
      getAll: (r: unknown) => invoke(profileChannels.getAll.name, r),
      export: () => invoke(profileChannels.export.name),
      import: () => invoke(profileChannels.import.name),
    },
    folder: {
      create: (r: unknown) => invoke(folderChannels.create.name, r),
      update: (r: unknown) => invoke(folderChannels.update.name, r),
      delete: (r: unknown) => invoke(folderChannels.delete.name, r),
      getAll: (r: unknown) => invoke(folderChannels.getAll.name, r),
    },
    preferences: {
      get: () => invoke(preferencesChannels.get.name),
      set: (r: unknown) => invoke(preferencesChannels.set.name, r),
      getRecentConnections: () =>
        invoke(preferencesChannels.getRecentConnections.name),
    },
  };
}

export type ProfileApi = ReturnType<typeof createProfileApi>;

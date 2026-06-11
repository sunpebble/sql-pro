import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type { FileChangeEvent } from './types';
import {
  connectionChannels,
  imageChannels,
  vectorChannels,
  videoChannels,
} from './channels';

export function createDatabaseApi({ invoke, on, off }: SqlProApiDeps) {
  return {
    connection: {
      open: (r: unknown) => invoke(connectionChannels.open.name, r),
      close: (r: unknown) => invoke(connectionChannels.close.name, r),
      testConnection: (r: unknown) =>
        invoke(connectionChannels.testConnection.name, r),
      changePassword: (r: unknown) =>
        invoke(connectionChannels.changePassword.name, r),
      getStats: (r: unknown) => invoke(connectionChannels.getStats.name, r),
      vacuum: (r: unknown) => invoke(connectionChannels.vacuum.name, r),
      analyze: (r: unknown) => invoke(connectionChannels.analyze.name, r),
      onFileChanged: (cb: (e: FileChangeEvent) => void) => {
        const handler = (_e: unknown, event: FileChangeEvent) => cb(event);
        on(connectionChannels.fileChanged.name, handler);
        return () => off(connectionChannels.fileChanged.name, handler);
      },
    },
    vector: {
      search: (r: unknown) => invoke(vectorChannels.search.name, r),
      searchSimilar: (r: unknown) =>
        invoke(vectorChannels.searchSimilar.name, r),
      batchSearch: (r: unknown) => invoke(vectorChannels.batchSearch.name, r),
      getPointsWithVectors: (r: unknown) =>
        invoke(vectorChannels.getPointsWithVectors.name, r),
    },
    image: {
      getMetadata: (r: unknown) => invoke(imageChannels.getMetadata.name, r),
      getFileMetadata: (r: unknown) =>
        invoke(imageChannels.getFileMetadata.name, r),
      getCacheStats: () => invoke(imageChannels.getCacheStats.name),
      clearCache: () => invoke(imageChannels.clearCache.name),
      checkUrl: (r: unknown) => invoke(imageChannels.checkUrl.name, r),
      validateUrl: (r: unknown) => invoke(imageChannels.validateUrl.name, r),
      checkFile: (r: unknown) => invoke(imageChannels.checkFile.name, r),
    },
    video: {
      getMetadata: (r: unknown) => invoke(videoChannels.getMetadata.name, r),
      checkUrl: (r: unknown) => invoke(videoChannels.checkUrl.name, r),
      validateUrl: (r: unknown) => invoke(videoChannels.validateUrl.name, r),
      checkFile: (r: unknown) => invoke(videoChannels.checkFile.name, r),
    },
  };
}

export type DatabaseApi = ReturnType<typeof createDatabaseApi>;

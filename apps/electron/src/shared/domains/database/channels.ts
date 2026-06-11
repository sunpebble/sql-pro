import type {
  BatchVectorSearchRequest,
  BatchVectorSearchResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CloseDatabaseRequest,
  CloseDatabaseResponse,
  DatabaseConnectionIdRequest,
  DatabaseMaintenanceResponse,
  FileChangeEvent,
  GetPointsWithVectorsRequest,
  GetPointsWithVectorsResponse,
  ImageCheckFileResponse,
  ImageCheckUrlResponse,
  ImageGetCacheStatsResponse,
  ImageGetFileMetadataResponse,
  ImageGetMetadataResponse,
  ImageValidateUrlResponse,
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  SearchSimilarRequest,
  SearchSimilarResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  VectorSearchRequest,
  VectorSearchResponse,
  VideoCheckFileResponse,
  VideoCheckUrlResponse,
  VideoGetMetadataResponse,
  VideoValidateUrlResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const connectionChannels = {
  open: channel<OpenDatabaseRequest, OpenDatabaseResponse>('database:open'),
  close: channel<CloseDatabaseRequest, CloseDatabaseResponse>('database:close'),
  testConnection: channel<TestConnectionRequest, TestConnectionResponse>(
    'database:test-connection'
  ),
  changePassword: channel<ChangePasswordRequest, ChangePasswordResponse>(
    'database:change-password'
  ),
  getStats: channel<DatabaseConnectionIdRequest, unknown>('database:get-stats'),
  vacuum: channel<DatabaseConnectionIdRequest, DatabaseMaintenanceResponse>(
    'database:vacuum'
  ),
  analyze: channel<DatabaseConnectionIdRequest, DatabaseMaintenanceResponse>(
    'database:analyze'
  ),
  fileChanged: channel<FileChangeEvent, void>('database:file-changed'),
} as const;

export const vectorChannels = {
  search: channel<VectorSearchRequest, VectorSearchResponse>('vector:search'),
  searchSimilar: channel<SearchSimilarRequest, SearchSimilarResponse>(
    'vector:search-similar'
  ),
  batchSearch: channel<BatchVectorSearchRequest, BatchVectorSearchResponse>(
    'vector:batch-search'
  ),
  getPointsWithVectors: channel<
    GetPointsWithVectorsRequest,
    GetPointsWithVectorsResponse
  >('vector:get-points'),
} as const;

export const imageChannels = {
  getMetadata: channel<{ url: string }, ImageGetMetadataResponse>(
    'image:get-metadata'
  ),
  getFileMetadata: channel<{ path: string }, ImageGetFileMetadataResponse>(
    'image:get-file-metadata'
  ),
  getCacheStats: channel<void, ImageGetCacheStatsResponse>(
    'image:get-cache-stats'
  ),
  clearCache: channel<void, { success: boolean }>('image:clear-cache'),
  checkUrl: channel<{ url: string }, ImageCheckUrlResponse>('image:check-url'),
  validateUrl: channel<{ url: string }, ImageValidateUrlResponse>(
    'image:validate-url'
  ),
  checkFile: channel<{ path: string }, ImageCheckFileResponse>(
    'image:check-file'
  ),
} as const;

export const videoChannels = {
  getMetadata: channel<{ url: string }, VideoGetMetadataResponse>(
    'video:get-metadata'
  ),
  checkUrl: channel<{ url: string }, VideoCheckUrlResponse>('video:check-url'),
  validateUrl: channel<{ url: string }, VideoValidateUrlResponse>(
    'video:validate-url'
  ),
  checkFile: channel<{ path: string }, VideoCheckFileResponse>(
    'video:check-file'
  ),
} as const;

/**
 * Database domain types — connection lifecycle, vector search, media, turso
 *
 * During migration, re-exports from the legacy shared/types.ts monolith.
 * Eventually these types will be defined in-place here.
 */

export type {
  BatchVectorSearchRequest,
  BatchVectorSearchResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CloseDatabaseRequest,
  CloseDatabaseResponse,
  DatabaseConnectionConfig,
  DatabaseConnectionIdRequest,
  DatabaseMaintenanceResponse,
  DatabaseType,
  EnhancedErrorInfo,
  ErrorCode,
  ErrorPosition,
  FileChangeEvent,
  GetPointsWithVectorsRequest,
  GetPointsWithVectorsResponse,
  ImageCheckFileResponse,
  ImageCheckUrlResponse,
  ImageFileMetadata,
  ImageGetCacheStatsResponse,
  ImageGetFileMetadataResponse,
  ImageGetMetadataResponse,
  ImageMetadata,
  ImageValidateUrlResponse,
  ListTursoDatabasesRequest,
  ListTursoDatabasesResponse,
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  SearchSimilarRequest,
  SearchSimilarResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  VectorSearchRequest,
  VectorSearchResponse,
  VectorSearchResult,
  VideoCheckFileResponse,
  VideoCheckUrlResponse,
  VideoGetMetadataResponse,
  VideoMetadata,
  VideoValidateUrlResponse,
} from '../../types';

export {
  isMySQLCompatibleDatabaseType,
  isPostgreSQLCompatibleDatabaseType,
  MYSQL_COMPATIBLE_DATABASE_TYPES,
  POSTGRESQL_COMPATIBLE_DATABASE_TYPES,
} from '../../types';

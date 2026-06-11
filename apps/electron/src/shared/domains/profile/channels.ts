import type {
  CreateFolderRequest,
  CreateFolderResponse,
  DeleteFolderRequest,
  DeleteFolderResponse,
  DeleteProfileRequest,
  DeleteProfileResponse,
  GetFoldersRequest,
  GetFoldersResponse,
  GetProfilesRequest,
  GetProfilesResponse,
  RemoveConnectionRequest,
  RemoveConnectionResponse,
  SaveProfileRequest,
  SaveProfileResponse,
  SetPreferencesRequest,
  SetPreferencesResponse,
  UpdateConnectionRequest,
  UpdateConnectionResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const profileChannels = {
  save: channel<SaveProfileRequest, SaveProfileResponse>('profile:save'),
  update: channel<UpdateProfileRequest, UpdateProfileResponse>(
    'profile:update'
  ),
  delete: channel<DeleteProfileRequest, DeleteProfileResponse>(
    'profile:delete'
  ),
  getAll: channel<GetProfilesRequest, GetProfilesResponse>('profile:get-all'),
  export: channel<void, unknown>('profile:export'),
  import: channel<void, unknown>('profile:import'),
} as const;

export const folderChannels = {
  create: channel<CreateFolderRequest, CreateFolderResponse>('folder:create'),
  update: channel<UpdateFolderRequest, UpdateFolderResponse>('folder:update'),
  delete: channel<DeleteFolderRequest, DeleteFolderResponse>('folder:delete'),
  getAll: channel<GetFoldersRequest, GetFoldersResponse>('folder:get-all'),
} as const;

export const preferencesChannels = {
  get: channel<void, unknown>('preferences:get'),
  set: channel<SetPreferencesRequest, SetPreferencesResponse>(
    'preferences:set'
  ),
  getRecentConnections: channel<void, unknown>(
    'preferences:get-recent-connections'
  ),
  updateConnection: channel<UpdateConnectionRequest, UpdateConnectionResponse>(
    'preferences:update-connection'
  ),
  removeConnection: channel<RemoveConnectionRequest, RemoveConnectionResponse>(
    'preferences:remove-connection'
  ),
} as const;

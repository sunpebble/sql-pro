import type {
  CloseWindowRequest,
  CloseWindowResponse,
  CreateWindowResponse,
  FocusWindowRequest,
  FocusWindowResponse,
  GetAllWindowsResponse,
  GetCurrentWindowResponse,
  GetPasswordRequest,
  GetPasswordResponse,
  HasPasswordRequest,
  HasPasswordResponse,
  IsPasswordStorageAvailableResponse,
  MenuAction,
  OpenExternalRequest,
  OpenExternalResponse,
  OpenFileDialogRequest,
  OpenFileDialogResponse,
  RemovePasswordRequest,
  RemovePasswordResponse,
  SaveFileDialogRequest,
  SaveFileDialogResponse,
  SavePasswordRequest,
  SavePasswordResponse,
  ShortcutsUpdatePayload,
  ShowItemInFolderRequest,
  ShowItemInFolderResponse,
  WriteFileRequest,
  WriteFileResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const windowChannels = {
  create: channel<void, CreateWindowResponse>('window:create'),
  close: channel<CloseWindowRequest, CloseWindowResponse>('window:close'),
  focus: channel<FocusWindowRequest, FocusWindowResponse>('window:focus'),
  getAll: channel<void, GetAllWindowsResponse>('window:get-all'),
  getCurrent: channel<void, GetCurrentWindowResponse>('window:get-current'),
} as const;

export const dialogChannels = {
  openFile: channel<OpenFileDialogRequest, OpenFileDialogResponse>(
    'dialog:open-file'
  ),
  saveFile: channel<SaveFileDialogRequest, SaveFileDialogResponse>(
    'dialog:save-file'
  ),
  writeFile: channel<WriteFileRequest, WriteFileResponse>('dialog:write-file'),
} as const;

export const passwordChannels = {
  save: channel<SavePasswordRequest, SavePasswordResponse>('password:save'),
  get: channel<GetPasswordRequest, GetPasswordResponse>('password:get'),
  has: channel<HasPasswordRequest, HasPasswordResponse>('password:has'),
  remove: channel<RemovePasswordRequest, RemovePasswordResponse>(
    'password:remove'
  ),
  isAvailable: channel<void, IsPasswordStorageAvailableResponse>(
    'password:is-available'
  ),
} as const;

export const systemChannels = {
  showItemInFolder: channel<ShowItemInFolderRequest, ShowItemInFolderResponse>(
    'system:show-item-in-folder'
  ),
  openExternal: channel<OpenExternalRequest, OpenExternalResponse>(
    'system:open-external'
  ),
  getAppVersion: channel<
    void,
    { success: boolean; version?: string; error?: string }
  >('system:get-app-version'),
  getPlatform: channel<
    void,
    { success: boolean; platform?: string; error?: string }
  >('system:get-platform'),
} as const;

export const updateChannels = {
  check: channel<boolean, { success: boolean; error?: string }>('update:check'),
  download: channel<void, { success: boolean; error?: string }>(
    'update:download'
  ),
  install: channel<void, { success: boolean; error?: string }>(
    'update:install'
  ),
  onStatusChange: channel<unknown, void>('update:status-change'),
} as const;

export const menuChannels = {
  onAction: channel<MenuAction, void>('menu:action'),
} as const;

export const shortcutChannels = {
  update: channel<ShortcutsUpdatePayload, { success: boolean }>(
    'shortcuts:update'
  ),
} as const;

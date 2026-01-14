import type {
  CreateFolderRequest,
  DeleteFolderRequest,
  UpdateFolderRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { deleteFolder, getFolders, saveFolder, updateFolder } from '../store';
import { createHandler } from './utils';

export function setupFoldersHandlers(): void {
  // Folders: Get
  ipcMain.handle(
    IPC_CHANNELS.FOLDERS_GET,
    createHandler(async () => {
      const folders = getFolders();
      return { folders };
    })
  );

  // Folders: Save
  ipcMain.handle(
    IPC_CHANNELS.FOLDERS_SAVE,
    createHandler(async (request: CreateFolderRequest) => {
      const result = saveFolder({
        name: request.folder.name || '',
        parentId: request.folder.parentId,
      });
      return result;
    })
  );

  // Folders: Update
  ipcMain.handle(
    IPC_CHANNELS.FOLDERS_UPDATE,
    createHandler(async (request: UpdateFolderRequest) => {
      const result = updateFolder(request.id, {
        name: request.updates.name,
      });
      return result;
    })
  );

  // Folders: Delete
  ipcMain.handle(
    IPC_CHANNELS.FOLDERS_DELETE,
    createHandler(async (request: DeleteFolderRequest) => {
      deleteFolder(request.id);
      return {};
    })
  );
}

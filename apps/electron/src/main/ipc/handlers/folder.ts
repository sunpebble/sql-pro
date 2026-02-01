/**
 * Folder IPC Handler
 *
 * Handles all folder-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  CreateFolderRequest,
  CreateFolderResponse,
  DeleteFolderRequest,
  DeleteFolderResponse,
  GetFoldersRequest,
  GetFoldersResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  deleteFolder,
  getFolders,
  saveFolder,
  updateFolder,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';
import { folderChannels } from '../contracts/all-channels';

export class FolderHandler extends IpcHandler {
  constructor() {
    super({ name: 'folder' });
  }

  register(): void {
    this.handle(folderChannels.getAll, this.getFolders.bind(this));
    this.handle(folderChannels.create, this.createFolder.bind(this));
    this.handle(folderChannels.update, this.updateFolder.bind(this));
    this.handle(folderChannels.delete, this.deleteFolder.bind(this));
  }

  private async getFolders(
    _request: GetFoldersRequest,
    _ctx: HandlerContext
  ): Promise<GetFoldersResponse> {
    this.log('debug', 'Getting folders');
    const folders = getFolders();
    return { success: true, folders };
  }

  private async createFolder(
    request: CreateFolderRequest,
    _ctx: HandlerContext
  ): Promise<CreateFolderResponse> {
    const name = request.name || request.folder?.name || '';
    const parentId = request.parentId || request.folder?.parentId;

    this.log('info', 'Creating folder', { name, parentId });

    const result = saveFolder({
      name,
      parentId,
    });

    return result;
  }

  private async updateFolder(
    request: UpdateFolderRequest,
    _ctx: HandlerContext
  ): Promise<UpdateFolderResponse> {
    this.log('info', 'Updating folder', { id: request.id });

    const result = updateFolder(request.id, {
      name: request.updates.name,
    });

    return result;
  }

  private async deleteFolder(
    request: DeleteFolderRequest,
    _ctx: HandlerContext
  ): Promise<DeleteFolderResponse> {
    this.log('info', 'Deleting folder', { id: request.id });
    deleteFolder(request.id);
    return { success: true };
  }
}

// Export singleton instance
export const folderHandler = new FolderHandler();

/**
 * Dialog IPC Handler
 *
 * Handles all dialog-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  OpenFileDialogRequest,
  OpenFileDialogResponse,
  SaveFileDialogRequest,
  SaveFileDialogResponse,
  WriteFileRequest,
  WriteFileResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { dialog } from 'electron';
import {  IpcHandler } from '../base/handler';
import { dialogChannels } from '../contracts/all-channels';

export class DialogHandler extends IpcHandler {
  constructor() {
    super({ name: 'dialog' });
  }

  register(): void {
    this.handle(dialogChannels.openFile, this.openFileDialog.bind(this));
    this.handle(dialogChannels.saveFile, this.saveFileDialog.bind(this));
    this.handle(dialogChannels.writeFile, this.writeFile.bind(this));
  }

  private async openFileDialog(
    request: OpenFileDialogRequest,
    _ctx: HandlerContext
  ): Promise<OpenFileDialogResponse> {
    this.log('debug', 'Opening file dialog', { title: request.title });

    const result = await dialog.showOpenDialog({
      title: request.title || 'Open Database',
      filters: request.filters || [
        { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      defaultPath: request.defaultPath,
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, canceled: true };
    }

    return { success: true, filePath: result.filePaths[0] };
  }

  private async saveFileDialog(
    request: SaveFileDialogRequest,
    _ctx: HandlerContext
  ): Promise<SaveFileDialogResponse> {
    this.log('debug', 'Opening save dialog', { title: request.title });

    const result = await dialog.showSaveDialog({
      title: request.title || 'Save File',
      filters: request.filters || [{ name: 'All Files', extensions: ['*'] }],
      defaultPath: request.defaultPath,
    });

    if (result.canceled || !result.filePath) {
      return { success: true, canceled: true };
    }

    return { success: true, filePath: result.filePath };
  }

  private async writeFile(
    request: WriteFileRequest,
    _ctx: HandlerContext
  ): Promise<WriteFileResponse> {
    const { filePath, content, encoding = 'utf8', atomic = true } = request;

    this.log('debug', 'Writing file', { filePath, atomic });

    try {
      const dataToWrite =
        typeof content === 'string' ? Buffer.from(content, encoding) : content;

      if (atomic) {
        const tempFileName = `.tmp_${randomBytes(8).toString('hex')}_${Date.now()}`;
        const tempFilePath = join(dirname(filePath), tempFileName);

        try {
          await writeFile(tempFilePath, dataToWrite);
          await rename(tempFilePath, filePath);
        } catch (writeError) {
          try {
            await unlink(tempFilePath);
          } catch {
            // Ignore cleanup errors
          }
          throw writeError;
        }
      } else {
        await writeFile(filePath, dataToWrite);
      }

      return {
        success: true,
        bytesWritten: dataToWrite.length,
      };
    } catch (error) {
      const errorMessage = this.getFileWriteErrorMessage(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private getFileWriteErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      switch (nodeError.code) {
        case 'EACCES':
        case 'EPERM':
          return 'Permission denied. Check that you have write access to this location.';
        case 'ENOENT':
          return 'The directory does not exist. Please choose a valid location.';
        case 'ENOSPC':
          return 'Not enough disk space to save the file.';
        case 'EROFS':
          return 'Cannot write to a read-only file system.';
        case 'EISDIR':
          return 'Cannot write to a directory. Please specify a file path.';
        case 'EMFILE':
        case 'ENFILE':
          return 'Too many open files. Please close some applications and try again.';
        case 'EXDEV':
          return 'Cannot move file across different file systems.';
        default:
          return error.message || 'Failed to write file';
      }
    }

    return 'An unexpected error occurred while writing the file';
  }
}

// Export singleton instance
export const dialogHandler = new DialogHandler();

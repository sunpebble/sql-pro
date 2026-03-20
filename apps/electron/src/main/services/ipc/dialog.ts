import type {
  FileExistsRequest,
  FileExistsResponse,
  OpenFileDialogRequest,
  SaveFileDialogRequest,
  WriteFileRequest,
  WriteFileResponse,
} from '@shared/types';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { IPC_CHANNELS } from '@shared/types';
import { dialog, ipcMain } from 'electron';

export function setupDialogHandlers(): void {
  // Dialog: Open File
  ipcMain.handle(
    IPC_CHANNELS.DIALOG_OPEN_FILE,
    async (_event, request: OpenFileDialogRequest) => {
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
  );

  // Dialog: Save File
  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (_event, request: SaveFileDialogRequest) => {
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
  );

  // File: path exists (main process; avoids renderer fs access)
  ipcMain.handle(
    IPC_CHANNELS.FILE_EXISTS,
    async (_event, request: unknown): Promise<FileExistsResponse> => {
      if (
        !request ||
        typeof request !== 'object' ||
        typeof (request as FileExistsRequest).path !== 'string' ||
        (request as FileExistsRequest).path.length === 0
      ) {
        return { exists: false };
      }
      const { path: filePath } = request as FileExistsRequest;
      try {
        await access(filePath, fsConstants.F_OK);
        return { exists: true };
      } catch {
        return { exists: false };
      }
    }
  );

  // File: Write
  ipcMain.handle(
    IPC_CHANNELS.FILE_WRITE,
    async (_event, request: WriteFileRequest): Promise<WriteFileResponse> => {
      const { filePath, content, encoding = 'utf8', atomic = true } = request;

      try {
        // Determine the data to write
        const dataToWrite =
          typeof content === 'string'
            ? Buffer.from(content, encoding)
            : content;

        if (atomic) {
          // Atomic write: write to temp file, then rename
          // Generate a unique temp filename in the same directory (ensures same filesystem for atomic rename)
          const tempFileName = `.tmp_${randomBytes(8).toString('hex')}_${Date.now()}`;
          const tempFilePath = join(dirname(filePath), tempFileName);

          try {
            // Write to temp file
            await writeFile(tempFilePath, dataToWrite);

            // Atomically rename temp file to target file
            await rename(tempFilePath, filePath);
          } catch (writeError) {
            // Clean up temp file if it exists
            try {
              await unlink(tempFilePath);
            } catch {
              // Ignore cleanup errors - temp file may not exist
            }
            throw writeError;
          }
        } else {
          // Non-atomic write: write directly to target
          await writeFile(filePath, dataToWrite);
        }

        return {
          success: true,
          bytesWritten: dataToWrite.length,
        };
      } catch (error) {
        // Map common errors to user-friendly messages
        const errorMessage = getFileWriteErrorMessage(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  );
}

/**
 * Maps file system errors to user-friendly messages
 */
function getFileWriteErrorMessage(error: unknown): string {
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

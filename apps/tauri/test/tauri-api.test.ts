/**
 * Tests for the Tauri API adapter layer
 */

import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sqlProAPI } from '../src/lib/tauri-api';

describe('tauri API Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('db', () => {
    it('should call db_open with correct parameters', async () => {
      const mockResponse = {
        success: true,
        connection: {
          id: 'conn_1',
          path: '/path/to/db.sqlite',
          filename: 'db.sqlite',
          isEncrypted: false,
          isReadOnly: false,
        },
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResponse);

      const result = await sqlProAPI.db.open({
        path: '/path/to/db.sqlite',
        readOnly: false,
      });

      expect(invoke).toHaveBeenCalledWith('db_open', {
        request: {
          path: '/path/to/db.sqlite',
          readOnly: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should call db_close with connection ID', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({ success: true });

      await sqlProAPI.db.close({ connectionId: 'conn_1' });

      expect(invoke).toHaveBeenCalledWith('db_close', {
        request: { connectionId: 'conn_1' },
      });
    });

    it('should call db_execute_query with query', async () => {
      const mockResponse = {
        success: true,
        columns: ['id', 'name'],
        rows: [{ id: 1, name: 'Test' }],
        executionTime: 5,
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockResponse);

      const result = await sqlProAPI.db.executeQuery({
        connectionId: 'conn_1',
        query: 'SELECT * FROM users',
      });

      expect(invoke).toHaveBeenCalledWith('db_execute_query', {
        request: {
          connectionId: 'conn_1',
          query: 'SELECT * FROM users',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('password', () => {
    it('should check if password storage is available', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        success: true,
        available: true,
      });

      const result = await sqlProAPI.password.isAvailable();

      expect(invoke).toHaveBeenCalledWith('password_is_available');
      expect(result.available).toBe(true);
    });

    it('should save a password', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({ success: true });

      await sqlProAPI.password.save('/path/to/db.sqlite', 'secret123');

      expect(invoke).toHaveBeenCalledWith('password_save', {
        request: {
          identifier: '/path/to/db.sqlite',
          password: 'secret123',
        },
      });
    });
  });

  describe('history', () => {
    it('should get query history', async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        success: true,
        history: [],
      });

      const result = await sqlProAPI.history.get('/path/to/db.sqlite');

      expect(invoke).toHaveBeenCalledWith('history_get', {
        request: { dbPath: '/path/to/db.sqlite' },
      });
      expect(result.success).toBe(true);
    });
  });
});

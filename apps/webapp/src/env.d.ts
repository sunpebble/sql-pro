/// <reference types="vite/client" />

import type { SqlProAPI } from '@shared/types/sql-pro-api';

declare global {
  interface Window {
    sqlPro: SqlProAPI;
    electronAPI: Record<string, unknown> | undefined;
  }
}

export {};

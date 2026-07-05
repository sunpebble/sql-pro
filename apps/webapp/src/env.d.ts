/// <reference types="vite/client" />

import type { QuarryAPI } from '@shared/types/quarry-api';

declare global {
  interface Window {
    quarry: QuarryAPI;
    electronAPI: Record<string, unknown> | undefined;
  }
}

export {};

// Vite environment variables
// Extend Window interface for global quarry API access
import type { quarry } from '@/lib/api';

interface ImportMetaEnv {
  readonly VITE_MOCK_MODE?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite worker import type declarations
declare module 'monaco-editor/esm/vs/editor/editor.worker?worker' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

declare global {
  interface Window {
    quarry: typeof quarry;
  }
}

export {};

// Vite environment variables
// Extend Window interface for global sqlPro API access
import type { sqlPro } from '@/lib/api';

interface ImportMetaEnv {
  readonly VITE_MOCK_MODE?: string;
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
    sqlPro: typeof sqlPro;
  }
}

export {};

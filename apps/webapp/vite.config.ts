import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const electronRendererSrc = resolve(__dirname, '../electron/src/renderer/src');
const electronShared = resolve(__dirname, '../electron/src/shared');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@/': `${electronRendererSrc}/`,
      '@shared/': `${electronShared}/`,
      '@app/': `${electronRendererSrc}/app/`,
      '@features/': `${electronRendererSrc}/features/`,
      '@shared-ui/': `${electronRendererSrc}/shared/`,
    },
  },
  define: {
    'import.meta.env.VITE_MOCK_MODE': JSON.stringify('true'),
  },
  server: {
    port: 5175,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/monaco-editor')) {
            return 'vendor-monaco';
          }
          return undefined;
        },
      },
    },
  },
});

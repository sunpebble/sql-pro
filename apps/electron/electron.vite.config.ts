import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      // ESM-only packages must be bundled (not externalized) so they get
      // converted to CJS format that Electron can use.
      // electron-store -> conf -> dot-prop, env-paths, atomically, etc.
      // conf -> ajv -> json-schema-traverse, fast-deep-equal, etc.
      externalizeDeps: {
        exclude: [
          'electron-store',
          'conf',
          'dot-prop',
          'env-paths',
          'atomically',
          'debounce-fn',
          'json-schema-typed',
          'uint8array-extras',
          'ajv',
          'ajv-formats',
          'json-schema-traverse',
          'fast-deep-equal',
          'fast-uri',
          'require-from-string',
          // electron-updater and its dependencies need to be bundled
          // to avoid pnpm symlink issues in packaged app
          'electron-updater',
          'builder-util-runtime',
          'lazy-val',
          'semver',
        ],
        // sharp and its native modules must be externalized (not bundled)
        // because they contain native .node files
        include: [
          'sharp',
          '@img/sharp-darwin-arm64',
          '@img/sharp-libvips-darwin-arm64',
        ],
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
  },
  preload: {
    build: {
      // Bundle all dependencies in preload script because it runs in a sandboxed
      // context that cannot resolve external modules at runtime
      externalizeDeps: false,
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    plugins: [react(), tailwindcss()],
    build: {
      target: 'es2020',
      // 代码分割优化 (vercel-react-best-practices: bundle-dynamic-imports)
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // React 核心独立分割
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/')
            ) {
              return 'vendor-react';
            }
            // UI 组件库独立分割
            if (id.includes('@sqlpro/ui')) {
              return 'vendor-ui';
            }
            // 代码编辑器相关
            if (
              id.includes('node_modules/@codemirror') ||
              id.includes('node_modules/@lezer')
            ) {
              return 'vendor-codemirror';
            }
          },
        },
      },
    },
  },
});

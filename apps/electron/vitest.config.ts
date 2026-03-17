import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    watch: false,
    projects: [
      {
        esbuild: {
          jsx: 'automatic',
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src/renderer/src'),
            '@shared': path.resolve(__dirname, './src/shared'),
          },
        },
        test: {
          name: 'renderer',
          globals: true,
          environment: 'happy-dom',
          setupFiles: ['./test/setup.ts'],
          include: [
            'src/renderer/**/*.test.{ts,tsx}',
            'src/shared/**/*.test.{ts,tsx}',
          ],
          exclude: [
            'node_modules',
            'dist',
            'out',
            // Crashes vitest worker with OOM due to heavy component imports
            'src/renderer/src/components/dev-tools/MemoryMonitorPanel.test.tsx',
          ],
          testTimeout: 30000,
          hookTimeout: 30000,
          maxConcurrency: 5,
          coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary', 'html'],
            include: ['src/renderer/src/**/*.{ts,tsx}'],
            exclude: [
              'src/renderer/src/**/*.test.{ts,tsx}',
              'src/renderer/src/**/*.d.ts',
              'src/renderer/src/main.tsx',
              'src/renderer/src/routeTree.gen.ts',
            ],
          },
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src/main'),
            '@shared': path.resolve(__dirname, './src/shared'),
          },
        },
        test: {
          name: 'main',
          globals: true,
          environment: 'node',
          include: ['src/main/**/*.test.{ts,tsx}'],
          exclude: [
            'node_modules',
            'dist',
            'out',
            'src/main/services/plugin/*.integration.test.ts',
            'src/main/services/plugin/*.e2e.test.ts',
          ],
          testTimeout: 30000,
          hookTimeout: 30000,
          maxConcurrency: 5,
        },
      },
    ],
  },
});

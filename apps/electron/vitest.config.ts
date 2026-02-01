import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // For renderer tests
      '@': path.resolve(__dirname, './src/renderer/src'),
      // For main process tests - more specific paths take precedence
      '@/lib': path.resolve(__dirname, './src/main/lib'),
      '@/utils': path.resolve(__dirname, './src/main/utils'),
      '@/plugin-api': path.resolve(__dirname, './src/main/plugin-api'),
      '@/services': path.resolve(__dirname, './src/main/services'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'out',
      // Exclude memory-intensive plugin integration/e2e tests
      // These should be run separately with increased memory: NODE_OPTIONS="--max-old-space-size=8192"
      'src/main/services/plugin/*.integration.test.ts',
      'src/main/services/plugin/*.e2e.test.ts',
    ],
    // Increase test timeout for complex tests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Limit concurrency to prevent memory exhaustion
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
});

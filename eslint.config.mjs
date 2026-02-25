import antfu from '@antfu/eslint-config';

export default antfu(
  {
    // Enable React support
    react: true,

    // Enable TypeScript support
    typescript: true,

    // Disable all formatters (use Prettier instead)
    formatters: false,

    // Disable stylistic rules (formatting handled by Prettier)
    stylistic: false,

    markdown: false,

    // Ignore patterns
    ignores: [
      '.claude/**',
      '.nx/**',
      'out/**',
      'dist/**',
      'node_modules/**',
      'pnpm-workspace.yaml',
      // Build outputs
      'packages/cloudflare/public/assets/**',
      '**/build/**',
      '**/.next/**',
    ],

    rules: {
      'unicorn/number-literal-case': 'off',
      // catalog 迁移已完成，禁用此规则以避免 electron-builder 兼容性问题
      'pnpm/json-valid-catalog': 'off',
    },
  },
  // Allow console.log in Cloudflare Workers (backend)
  {
    files: ['packages/cloudflare/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);

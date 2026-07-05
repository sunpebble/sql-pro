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
      '**/build/**',
      '**/.next/**',
    ],

    rules: {
      'unicorn/number-literal-case': 'off',
      'pnpm/json-enforce-catalog': 'off',
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

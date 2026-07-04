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
      'pnpm/json-enforce-catalog': 'off',
      // React Compiler rules flag pre-existing render-time component
      // creation; demoted to warn until those components are refactored
      'react/static-components': 'warn',
      'react/unsupported-syntax': 'warn',
      'e18e/prefer-static-regex': 'warn',
      'e18e/prefer-array-at': 'warn',
      'e18e/prefer-timer-args': 'warn',
      'e18e/prefer-regex-test': 'warn',
      'e18e/prefer-object-has-own': 'warn',
      'e18e/prefer-array-some': 'warn',
      'e18e/prefer-array-fill': 'warn',
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

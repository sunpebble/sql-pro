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
      // electron-builder postinstall 无法解析 catalog: 协议
      // json-enforce-catalog 会自动将硬编码版本转为 catalog:，需禁用
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

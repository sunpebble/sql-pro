/**
 * Re-export the Electron app Vitest config so `pnpm vitest` from the monorepo root
 * resolves path aliases (`@/*` → `apps/electron/src/main`) and `test.projects` includes.
 */
export { default } from './apps/electron/vitest.config';

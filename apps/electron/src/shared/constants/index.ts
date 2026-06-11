/**
 * Application constants
 *
 * Project URLs, AI provider defaults, and other app-wide constants
 * extracted from the legacy shared/types.ts monolith.
 */

// ============ Project URLs ============

export const PROJECT_REPO_URL = 'https://github.com/kunish-homelab/sql-pro';
export const PROJECT_ISSUES_URL = `${PROJECT_REPO_URL}/issues`;

// ============ AI Defaults ============

export const DEFAULT_AI_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
} as const;

// ============ Database Type Helpers ============

export const MYSQL_COMPATIBLE_DATABASE_TYPES = ['mysql', 'mariadb'] as const;

export const POSTGRESQL_COMPATIBLE_DATABASE_TYPES = [
  'postgresql',
  'supabase',
  'neon',
  'planetscale',
] as const;

export function isMySQLCompatibleDatabaseType(
  type: string | undefined
): boolean {
  return (
    !!type &&
    (MYSQL_COMPATIBLE_DATABASE_TYPES as readonly string[]).includes(type)
  );
}

export function isPostgreSQLCompatibleDatabaseType(
  type: string | undefined
): boolean {
  return (
    !!type &&
    (POSTGRESQL_COMPATIBLE_DATABASE_TYPES as readonly string[]).includes(type)
  );
}

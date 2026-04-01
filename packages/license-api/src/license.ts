import { customAlphabet } from 'nanoid';

// Base32 alphabet (no I, L, O, U to avoid confusion)
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ0123456789';
const nanoid = customAlphabet(ALPHABET, 4);

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

/**
 * Generate a license key in format: SQLPRO-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const segments = [nanoid(), nanoid(), nanoid(), nanoid()];
  return `SQLPRO-${segments.join('-')}`;
}

/**
 * Validate license key format
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  const pattern = /^SQLPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key);
}

/**
 * Get max machines for a plan
 */
export function getMaxMachinesForPlan(
  plan: 'monthly' | 'yearly' | 'lifetime'
): number {
  switch (plan) {
    case 'monthly':
      return 2;
    case 'yearly':
      return 3;
    case 'lifetime':
      return 5;
    default:
      return assertNever(plan);
  }
}

/**
 * Calculate period end date for a plan
 */
export function calculatePeriodEnd(
  plan: 'monthly' | 'yearly' | 'lifetime'
): Date {
  const now = new Date();
  switch (plan) {
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'lifetime':
      // 100 years from now
      return new Date(now.setFullYear(now.getFullYear() + 100));
    default:
      return assertNever(plan);
  }
}

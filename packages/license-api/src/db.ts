import type { Client, Row } from '@libsql/client';
import type { Env, License, MachineActivation } from './types';
import { createClient } from '@libsql/client';

let dbClient: Client | null = null;

export function getDb(env: Env): Client {
  if (!dbClient) {
    dbClient = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
  }
  return dbClient;
}

// ============ Type-Safe Row Parsers ============

/**
 * Safely extracts a string value from a database row.
 */
function getString(row: Row, key: string): string {
  const value = row[key];
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Safely extracts a nullable string value from a database row.
 */
function getStringOrNull(row: Row, key: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Safely extracts a number value from a database row.
 */
function getNumber(row: Row, key: string): number {
  const value = row[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number.parseInt(value, 10) || 0;
  return 0;
}

/**
 * Parses a database row into a License object with runtime validation.
 */
function parseLicenseRow(row: Row): License {
  return {
    id: getString(row, 'id'),
    email: getString(row, 'email'),
    license_key: getString(row, 'license_key'),
    stripe_customer_id: getString(row, 'stripe_customer_id'),
    stripe_subscription_id: getStringOrNull(row, 'stripe_subscription_id'),
    plan: getString(row, 'plan') as License['plan'],
    status: getString(row, 'status') as License['status'],
    current_period_end: getString(row, 'current_period_end'),
    max_machines: getNumber(row, 'max_machines'),
    created_at: getString(row, 'created_at'),
    updated_at: getString(row, 'updated_at'),
  };
}

/**
 * Parses a database row into a MachineActivation object with runtime validation.
 */
function parseMachineActivationRow(row: Row): MachineActivation {
  return {
    id: getString(row, 'id'),
    license_id: getString(row, 'license_id'),
    machine_id: getString(row, 'machine_id'),
    platform: getString(row, 'platform'),
    hostname: getString(row, 'hostname'),
    activated_at: getString(row, 'activated_at'),
    last_seen_at: getString(row, 'last_seen_at'),
  };
}

// Initialize database schema
export async function initDb(env: Env): Promise<void> {
  const db = getDb(env);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      stripe_customer_id TEXT NOT NULL,
      stripe_subscription_id TEXT,
      plan TEXT NOT NULL CHECK(plan IN ('monthly', 'yearly', 'lifetime')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'expired', 'past_due')),
      current_period_end TEXT NOT NULL,
      max_machines INTEGER NOT NULL DEFAULT 2,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS machine_activations (
      id TEXT PRIMARY KEY,
      license_id TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      hostname TEXT NOT NULL,
      activated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (license_id) REFERENCES licenses(id),
      UNIQUE(license_id, machine_id)
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON licenses(stripe_customer_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_activations_license ON machine_activations(license_id)
  `);
}

// License operations
export async function createLicense(
  env: Env,
  license: Omit<License, 'created_at' | 'updated_at'>
): Promise<License> {
  const db = getDb(env);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO licenses (id, email, license_key, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, max_machines, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      license.id,
      license.email,
      license.license_key,
      license.stripe_customer_id,
      license.stripe_subscription_id,
      license.plan,
      license.status,
      license.current_period_end,
      license.max_machines,
      now,
      now,
    ],
  });

  return { ...license, created_at: now, updated_at: now };
}

export async function getLicenseByKey(
  env: Env,
  licenseKey: string
): Promise<License | null> {
  const db = getDb(env);
  const result = await db.execute({
    sql: 'SELECT * FROM licenses WHERE license_key = ?',
    args: [licenseKey],
  });

  if (result.rows.length === 0) return null;
  return parseLicenseRow(result.rows[0]);
}

export async function getLicenseByEmail(
  env: Env,
  email: string
): Promise<License | null> {
  const db = getDb(env);
  const result = await db.execute({
    sql: 'SELECT * FROM licenses WHERE email = ? ORDER BY created_at DESC LIMIT 1',
    args: [email],
  });

  if (result.rows.length === 0) return null;
  return parseLicenseRow(result.rows[0]);
}

export async function getLicenseByStripeCustomer(
  env: Env,
  customerId: string
): Promise<License | null> {
  const db = getDb(env);
  const result = await db.execute({
    sql: 'SELECT * FROM licenses WHERE stripe_customer_id = ?',
    args: [customerId],
  });

  if (result.rows.length === 0) return null;
  return parseLicenseRow(result.rows[0]);
}

export async function updateLicenseStatus(
  env: Env,
  licenseId: string,
  status: License['status'],
  periodEnd?: string
): Promise<void> {
  const db = getDb(env);
  const now = new Date().toISOString();

  if (periodEnd) {
    await db.execute({
      sql: 'UPDATE licenses SET status = ?, current_period_end = ?, updated_at = ? WHERE id = ?',
      args: [status, periodEnd, now, licenseId],
    });
  } else {
    await db.execute({
      sql: 'UPDATE licenses SET status = ?, updated_at = ? WHERE id = ?',
      args: [status, now, licenseId],
    });
  }
}

// Machine activation operations
export async function getActivationsForLicense(
  env: Env,
  licenseId: string
): Promise<MachineActivation[]> {
  const db = getDb(env);
  const result = await db.execute({
    sql: 'SELECT * FROM machine_activations WHERE license_id = ?',
    args: [licenseId],
  });

  return result.rows.map(parseMachineActivationRow);
}

export async function getActivation(
  env: Env,
  licenseId: string,
  machineId: string
): Promise<MachineActivation | null> {
  const db = getDb(env);
  const result = await db.execute({
    sql: 'SELECT * FROM machine_activations WHERE license_id = ? AND machine_id = ?',
    args: [licenseId, machineId],
  });

  if (result.rows.length === 0) return null;
  return parseMachineActivationRow(result.rows[0]);
}

export async function createActivation(
  env: Env,
  activation: Omit<MachineActivation, 'activated_at' | 'last_seen_at'>
): Promise<MachineActivation> {
  const db = getDb(env);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO machine_activations (id, license_id, machine_id, platform, hostname, activated_at, last_seen_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      activation.id,
      activation.license_id,
      activation.machine_id,
      activation.platform,
      activation.hostname,
      now,
      now,
    ],
  });

  return { ...activation, activated_at: now, last_seen_at: now };
}

export async function updateActivationLastSeen(
  env: Env,
  activationId: string
): Promise<void> {
  const db = getDb(env);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'UPDATE machine_activations SET last_seen_at = ? WHERE id = ?',
    args: [now, activationId],
  });
}

export async function deleteActivation(
  env: Env,
  licenseId: string,
  machineId: string
): Promise<void> {
  const db = getDb(env);
  await db.execute({
    sql: 'DELETE FROM machine_activations WHERE license_id = ? AND machine_id = ?',
    args: [licenseId, machineId],
  });
}

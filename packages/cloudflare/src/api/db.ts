import type { Env, License, MachineActivation } from './types';

// ============ Type-Safe Row Parsers ============

function getString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

function getStringOrNull(
  row: Record<string, unknown>,
  key: string
): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

function getNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number.parseInt(value, 10) || 0;
  return 0;
}

function parseLicenseRow(row: Record<string, unknown>): License {
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
    user_id: getStringOrNull(row, 'user_id'),
    created_at: getString(row, 'created_at'),
    updated_at: getString(row, 'updated_at'),
  };
}

function parseMachineActivationRow(
  row: Record<string, unknown>
): MachineActivation {
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

// ============ License Operations ============

export async function createLicense(
  env: Env,
  license: Omit<License, 'created_at' | 'updated_at' | 'user_id'> & {
    user_id?: string | null;
  }
): Promise<License> {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO licenses (id, email, license_key, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, max_machines, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      license.id,
      license.email,
      license.license_key,
      license.stripe_customer_id,
      license.stripe_subscription_id,
      license.plan,
      license.status,
      license.current_period_end,
      license.max_machines,
      license.user_id || null,
      now,
      now
    )
    .run();

  return {
    ...license,
    user_id: license.user_id || null,
    created_at: now,
    updated_at: now,
  };
}

export async function getLicenseByKey(
  env: Env,
  licenseKey: string
): Promise<License | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM licenses WHERE license_key = ?'
  )
    .bind(licenseKey)
    .first();

  if (!result) return null;
  return parseLicenseRow(result as Record<string, unknown>);
}

export async function getLicenseByEmail(
  env: Env,
  email: string
): Promise<License | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM licenses WHERE email = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(email)
    .first();

  if (!result) return null;
  return parseLicenseRow(result as Record<string, unknown>);
}

export async function getLicenseByStripeCustomer(
  env: Env,
  customerId: string
): Promise<License | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM licenses WHERE stripe_customer_id = ?'
  )
    .bind(customerId)
    .first();

  if (!result) return null;
  return parseLicenseRow(result as Record<string, unknown>);
}

export async function updateLicenseStatus(
  env: Env,
  licenseId: string,
  status: License['status'],
  periodEnd?: string
): Promise<void> {
  const now = new Date().toISOString();

  if (periodEnd) {
    await env.DB.prepare(
      'UPDATE licenses SET status = ?, current_period_end = ?, updated_at = ? WHERE id = ?'
    )
      .bind(status, periodEnd, now, licenseId)
      .run();
  } else {
    await env.DB.prepare(
      'UPDATE licenses SET status = ?, updated_at = ? WHERE id = ?'
    )
      .bind(status, now, licenseId)
      .run();
  }
}

// ============ Machine Activation Operations ============

export async function getActivationsForLicense(
  env: Env,
  licenseId: string
): Promise<MachineActivation[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM machine_activations WHERE license_id = ?'
  )
    .bind(licenseId)
    .all();

  return (result.results || []).map((row) =>
    parseMachineActivationRow(row as Record<string, unknown>)
  );
}

export async function getActivation(
  env: Env,
  licenseId: string,
  machineId: string
): Promise<MachineActivation | null> {
  const result = await env.DB.prepare(
    'SELECT * FROM machine_activations WHERE license_id = ? AND machine_id = ?'
  )
    .bind(licenseId, machineId)
    .first();

  if (!result) return null;
  return parseMachineActivationRow(result as Record<string, unknown>);
}

export async function createActivation(
  env: Env,
  activation: Omit<MachineActivation, 'activated_at' | 'last_seen_at'>
): Promise<MachineActivation> {
  const now = new Date().toISOString();

  await env.DB.prepare(
    `
    INSERT INTO machine_activations (id, license_id, machine_id, platform, hostname, activated_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      activation.id,
      activation.license_id,
      activation.machine_id,
      activation.platform,
      activation.hostname,
      now,
      now
    )
    .run();

  return { ...activation, activated_at: now, last_seen_at: now };
}

export async function updateActivationLastSeen(
  env: Env,
  activationId: string
): Promise<void> {
  const now = new Date().toISOString();

  await env.DB.prepare(
    'UPDATE machine_activations SET last_seen_at = ? WHERE id = ?'
  )
    .bind(now, activationId)
    .run();
}

export async function deleteActivation(
  env: Env,
  licenseId: string,
  machineId: string
): Promise<void> {
  await env.DB.prepare(
    'DELETE FROM machine_activations WHERE license_id = ? AND machine_id = ?'
  )
    .bind(licenseId, machineId)
    .run();
}

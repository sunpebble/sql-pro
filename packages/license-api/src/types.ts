// License types for the API
export interface License {
  id: string;
  email: string;
  license_key: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  current_period_end: string;
  max_machines: number;
  created_at: string;
  updated_at: string;
}

export interface MachineActivation {
  id: string;
  license_id: string;
  machine_id: string;
  platform: string;
  hostname: string;
  activated_at: string;
  last_seen_at: string;
}

export interface CheckoutRequest {
  email: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  successUrl: string;
  cancelUrl: string;
}

export interface ActivateRequest {
  email: string;
  licenseKey: string;
  machineId: string;
  platform: string;
  hostname: string;
}

export interface VerifyRequest {
  licenseKey: string;
  machineId: string;
}

export type VerifyResponse =
  | {
      valid: true;
      license: {
        email: string;
        plan: License['plan'];
        status: License['status'];
        expiresAt: string;
      };
    }
  | { valid: false; error: string };

// Environment bindings
export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  ENVIRONMENT: string;
  ADMIN_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

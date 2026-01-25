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
  user_id: string | null;
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

// User types for OAuth
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  provider: 'github' | 'google';
  provider_id: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface SsoToken {
  id: string;
  user_id: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

// Request/Response types
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

export interface VerifyResponse {
  valid: boolean;
  license?: {
    email: string;
    plan: string;
    status: string;
    expiresAt: string;
  };
  error?: string;
}

// OAuth types
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  // D1 Database (Cloudflare)
  DB: D1Database;

  // Stripe (Payment processing)
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // OAuth providers
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // App URL for SSO deep links (optional, defaults to sqlpro://)
  APP_URL?: string;

  // Environment
  ENVIRONMENT: string;
}

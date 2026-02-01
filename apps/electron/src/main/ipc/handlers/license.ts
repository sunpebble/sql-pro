/**
 * License IPC Handler
 *
 * Handles communication with the License API for Pro subscription management.
 */

import type {HandlerContext} from '../base/handler';
import os from 'node:os';
import process from 'node:process';
import { shell } from 'electron';
import Store from 'electron-store';
import { machineIdSync } from 'node-machine-id';
import {  IpcHandler } from '../base/handler';

// License API configuration
const LICENSE_API_URL =
  process.env.LICENSE_API_URL || 'https://sqlpro-dev.kunish-butt.workers.dev';

// Local license storage
interface LicenseCache {
  licenseKey: string;
  email: string;
  plan: string;
  status: string;
  expiresAt: string;
  lastVerified: string;
}

// API Response types
interface LicenseInfo {
  email: string;
  plan: string;
  status: string;
  expiresAt: string;
}

interface CheckoutResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

interface ActivateResponse {
  success: boolean;
  license?: LicenseInfo;
  error?: string;
}

interface VerifyResponse {
  valid: boolean;
  license?: LicenseInfo;
  error?: string;
}

interface PortalResponse {
  success: boolean;
  url?: string;
  error?: string;
}

const store = new Store<{ licenseCache?: LicenseCache }>({
  name: 'license',
  encryptionKey: 'sql-pro-license-key-v1',
});

// Get unique machine ID
function getMachineId(): string {
  try {
    return machineIdSync(true);
  } catch {
    // Fallback to hostname + platform
    return `${os.hostname()}-${os.platform()}-${os.arch()}`;
  }
}

export class LicenseHandler extends IpcHandler {
  constructor() {
    super({ name: 'license' });
  }

  register(): void {
    this.handleLegacy('license:get-machine-id', this.getMachineId.bind(this));
    this.handleLegacy(
      'license:create-checkout',
      this.createCheckout.bind(this)
    );
    this.handleLegacy('license:activate', this.activate.bind(this));
    this.handleLegacy('license:verify', this.verify.bind(this));
    this.handleLegacy('license:deactivate', this.deactivate.bind(this));
    this.handleLegacy('license:get-portal-url', this.getPortalUrl.bind(this));
  }

  private async getMachineId(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ machineId: string; platform: string; hostname: string }> {
    return {
      machineId: getMachineId(),
      platform: os.platform(),
      hostname: os.hostname(),
    };
  }

  private async createCheckout(
    request: { email: string; plan: 'monthly' | 'yearly' | 'lifetime' },
    _ctx: HandlerContext
  ): Promise<{ sessionId?: string }> {
    const response = await fetch(`${LICENSE_API_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: request.email,
        plan: request.plan,
        successUrl: 'sqlpro://license/success',
        cancelUrl: 'sqlpro://license/cancel',
      }),
    });

    const data = (await response.json()) as CheckoutResponse;
    if (data.success && data.url) {
      // Open checkout URL in default browser
      await shell.openExternal(data.url);
      return { sessionId: data.sessionId };
    }

    throw new Error(data.error || 'Failed to create checkout');
  }

  private async activate(
    request: { email: string; licenseKey: string },
    _ctx: HandlerContext
  ): Promise<{ license: LicenseInfo }> {
    const machineId = getMachineId();
    const response = await fetch(`${LICENSE_API_URL}/api/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: request.email,
        licenseKey: request.licenseKey,
        machineId,
        platform: os.platform(),
        hostname: os.hostname(),
      }),
    });

    const data = (await response.json()) as ActivateResponse;
    if (data.success && data.license) {
      // Cache license locally
      store.set('licenseCache', {
        licenseKey: request.licenseKey,
        email: request.email,
        plan: data.license.plan,
        status: data.license.status,
        expiresAt: data.license.expiresAt,
        lastVerified: new Date().toISOString(),
      });

      return { license: data.license };
    }

    throw new Error(data.error || 'Failed to activate license');
  }

  private async verify(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{
    valid: boolean;
    license?: LicenseInfo;
    cached?: boolean;
    offline?: boolean;
    error?: string;
  }> {
    try {
      const cached = store.get('licenseCache');
      if (!cached) {
        return { valid: false, error: 'No license found' };
      }

      // Check if we can use cached verification (within 7 days for offline support)
      const lastVerified = new Date(cached.lastVerified);
      const daysSinceVerification =
        (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceVerification < 7) {
        // Use cached license for offline support
        const expiresAt = new Date(cached.expiresAt);
        if (expiresAt > new Date() && cached.status === 'active') {
          return {
            valid: true,
            license: {
              email: cached.email,
              plan: cached.plan,
              status: cached.status,
              expiresAt: cached.expiresAt,
            },
            cached: true,
          };
        }
      }

      // Verify online
      const machineId = getMachineId();
      const response = await fetch(`${LICENSE_API_URL}/api/license/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: cached.licenseKey,
          machineId,
        }),
      });

      const data = (await response.json()) as VerifyResponse;
      if (data.valid && data.license) {
        // Update cache
        store.set('licenseCache', {
          ...cached,
          status: data.license.status,
          expiresAt: data.license.expiresAt,
          lastVerified: new Date().toISOString(),
        });

        return { valid: true, license: data.license, cached: false };
      }

      return { valid: false, error: data.error };
    } catch (error) {
      // If offline, use cached license
      const cached = store.get('licenseCache');
      if (cached) {
        const expiresAt = new Date(cached.expiresAt);
        if (expiresAt > new Date() && cached.status === 'active') {
          return {
            valid: true,
            license: {
              email: cached.email,
              plan: cached.plan,
              status: cached.status,
              expiresAt: cached.expiresAt,
            },
            cached: true,
            offline: true,
          };
        }
      }

      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Failed to verify license',
      };
    }
  }

  private async deactivate(
    _request: void,
    _ctx: HandlerContext
  ): Promise<{ warning?: string }> {
    const cached = store.get('licenseCache');
    if (!cached) {
      return {};
    }

    const machineId = getMachineId();
    try {
      await fetch(`${LICENSE_API_URL}/api/license/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: cached.licenseKey,
          machineId,
        }),
      });
    } catch (error) {
      // Clear local cache anyway, but include warning
      store.delete('licenseCache');
      return {
        warning:
          error instanceof Error
            ? error.message
            : 'Could not notify server, but local license was removed',
      };
    }

    // Clear local cache
    store.delete('licenseCache');

    return {};
  }

  private async getPortalUrl(
    _request: void,
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    const cached = store.get('licenseCache');
    if (!cached) {
      throw new Error('No license found');
    }

    const response = await fetch(`${LICENSE_API_URL}/api/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cached.email,
        returnUrl: 'sqlpro://license/portal-return',
      }),
    });

    const data = (await response.json()) as PortalResponse;
    if (data.success && data.url) {
      await shell.openExternal(data.url);
      return {};
    }

    throw new Error(data.error || 'Failed to get portal URL');
  }
}

// Export singleton instance
export const licenseHandler = new LicenseHandler();

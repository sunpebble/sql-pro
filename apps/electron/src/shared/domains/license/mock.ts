/**
 * Mock API definitions for the license domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  LicenseActivateRequest,
  LicenseCreateCheckoutRequest,
  ProActivateRequest,
} from './types';

export interface ProMockApi {
  getFeatures: () => Promise<unknown>;
  activate: (request: ProActivateRequest) => Promise<unknown>;
  deactivate: () => Promise<unknown>;
  getStatus: () => Promise<unknown>;
  checkStatus: () => Promise<unknown>;
}

export interface LicenseMockApi {
  getMachineId: () => Promise<unknown>;
  createCheckout: (request: LicenseCreateCheckoutRequest) => Promise<unknown>;
  activate: (request: LicenseActivateRequest) => Promise<unknown>;
  verify: () => Promise<unknown>;
  deactivate: () => Promise<unknown>;
  getPortalUrl: () => Promise<unknown>;
}

export function createProMock(_deps: SqlProApiDeps): ProMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

export function createLicenseMock(_deps: SqlProApiDeps): LicenseMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}

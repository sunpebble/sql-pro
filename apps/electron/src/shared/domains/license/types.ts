/**
 * License domain types — Pro features and license verification
 */

import type {
  ProFeature,
  ProFeatureInfo,
  ProFeatureType,
  ProStatus,
} from '../../types';

export type { ProFeature, ProFeatureInfo, ProFeatureType, ProStatus };

export interface GetProFeaturesResponse {
  success: boolean;
  features?: ProFeatureInfo[];
  isPro?: boolean;
  licenseKey?: string;
  licenseExpiresAt?: string;
  error?: string;
}

export interface ProActivateRequest {
  licenseKey: string;
  features?: ProFeatureType[];
}

export interface ProActivateResponse {
  success: boolean;
  status?: ProStatus | null;
  error?: string;
}

export interface ProDeactivateResponse {
  success: boolean;
  error?: string;
}

export interface ProGetStatusResponse {
  success: boolean;
  status?: ProStatus | null;
  error?: string;
}

export interface CheckProStatusResponse {
  success: boolean;
  isPro: boolean;
  features?: ProFeatureInfo[];
  expiresAt?: string;
  error?: string;
}

export interface LicenseActivateRequest {
  email: string;
  licenseKey: string;
}

export interface LicenseInfo {
  email: string;
  plan: string;
  status: string;
  expiresAt: string;
}

export interface LicenseActivationRecord {
  machineId: string;
  platform: string;
  hostname: string;
  activatedAt: string;
}

export interface LicenseActivateResponse {
  success: boolean;
  license?: LicenseInfo;
  error?: string;
  activations?: LicenseActivationRecord[];
}

export interface LicenseDeactivateResponse {
  success: boolean;
  warning?: string;
}

export interface LicenseVerifyResponse {
  valid: boolean;
  license?: LicenseInfo;
  cached?: boolean;
  offline?: boolean;
  error?: string;
}

export interface LicenseGetMachineIdResponse {
  success: boolean;
  machineId?: string;
  platform?: string;
  hostname?: string;
  error?: string;
}

export interface LicenseCreateCheckoutRequest {
  email: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
}

export interface LicenseCreateCheckoutResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

export interface LicenseGetPortalUrlResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * License Store
 * Manages Pro subscription license state
 */

import { create } from 'zustand';
import { sqlPro } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';

interface LicenseInfo {
  email: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  expiresAt: string;
}

interface LicenseState {
  // License info
  license: LicenseInfo | null;
  isValid: boolean;
  isLoading: boolean;
  isActivating: boolean;
  error: string | null;

  // Machine info
  machineId: string | null;
  platform: string | null;
  hostname: string | null;

  // Cached status
  isCached: boolean;
  isOffline: boolean;

  // Actions
  loadMachineId: () => Promise<void>;
  verifyLicense: () => Promise<boolean>;
  activateLicense: (email: string, licenseKey: string) => Promise<boolean>;
  deactivateLicense: () => Promise<void>;
  createCheckout: (
    email: string,
    plan: 'monthly' | 'yearly' | 'lifetime'
  ) => Promise<boolean>;
  openPortal: () => Promise<void>;
  clearError: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  // Initial state
  license: null,
  isValid: false,
  isLoading: false,
  isActivating: false,
  error: null,
  machineId: null,
  platform: null,
  hostname: null,
  isCached: false,
  isOffline: false,

  // Load machine ID
  loadMachineId: async () => {
    try {
      const result = await sqlPro.license.getMachineId();
      if (result.success) {
        set({
          machineId: result.machineId || null,
          platform: result.platform || null,
          hostname: result.hostname || null,
        });
      }
    } catch (error) {
      console.error('Failed to load machine ID:', error);
    }
  },

  // Verify license
  verifyLicense: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await sqlPro.license.verify();
      if (result.valid && result.license) {
        set({
          isValid: true,
          license: result.license as LicenseInfo,
          isCached: result.cached || false,
          isOffline: result.offline || false,
          isLoading: false,
        });
        return true;
      } else {
        set({
          isValid: false,
          license: null,
          error: result.error || null,
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        isValid: false,
        license: null,
        error: getErrorMessage(error, 'Verification failed'),
        isLoading: false,
      });
      return false;
    }
  },

  // Activate license
  activateLicense: async (email: string, licenseKey: string) => {
    set({ isActivating: true, error: null });
    try {
      const result = await sqlPro.license.activate({ email, licenseKey });
      if (result.success && result.license) {
        set({
          isValid: true,
          license: result.license as LicenseInfo,
          isActivating: false,
        });
        return true;
      } else {
        set({
          error: result.error || 'Activation failed',
          isActivating: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Activation failed'),
        isActivating: false,
      });
      return false;
    }
  },

  // Deactivate license
  deactivateLicense: async () => {
    set({ isLoading: true, error: null });
    try {
      await sqlPro.license.deactivate();
      set({
        isValid: false,
        license: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Deactivation failed'),
        isLoading: false,
      });
    }
  },

  // Create checkout
  createCheckout: async (
    email: string,
    plan: 'monthly' | 'yearly' | 'lifetime'
  ) => {
    set({ isLoading: true, error: null });
    try {
      const result = await sqlPro.license.createCheckout({ email, plan });
      set({ isLoading: false });
      return result.success;
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Checkout failed'),
        isLoading: false,
      });
      return false;
    }
  },

  // Open portal
  openPortal: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await sqlPro.license.getPortalUrl();
      if (!result.success) {
        set({ error: result.error || 'Failed to open portal' });
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to open portal'),
        isLoading: false,
      });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

// Helper to check if user has active Pro license
export function useHasProLicense(): boolean {
  const { isValid, license } = useLicenseStore();
  return isValid && license?.status === 'active';
}

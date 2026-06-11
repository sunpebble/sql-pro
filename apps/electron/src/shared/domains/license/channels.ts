import type {
  CheckProStatusResponse,
  GetProFeaturesResponse,
  LicenseActivateRequest,
  LicenseActivateResponse,
  LicenseCreateCheckoutRequest,
  LicenseCreateCheckoutResponse,
  LicenseDeactivateResponse,
  LicenseGetMachineIdResponse,
  LicenseGetPortalUrlResponse,
  LicenseVerifyResponse,
  ProActivateRequest,
  ProActivateResponse,
  ProDeactivateResponse,
  ProGetStatusResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const proChannels = {
  getFeatures: channel<void, GetProFeaturesResponse>('pro:get-features'),
  activate: channel<ProActivateRequest, ProActivateResponse>('pro:activate'),
  deactivate: channel<void, ProDeactivateResponse>('pro:deactivate'),
  getStatus: channel<void, ProGetStatusResponse>('pro:get-status'),
  checkStatus: channel<void, CheckProStatusResponse>('pro:check-status'),
} as const;

export const licenseChannels = {
  verify: channel<void, LicenseVerifyResponse>('license:verify'),
  activate: channel<LicenseActivateRequest, LicenseActivateResponse>(
    'license:activate'
  ),
  deactivate: channel<void, LicenseDeactivateResponse>('license:deactivate'),
  getMachineId: channel<void, LicenseGetMachineIdResponse>(
    'license:get-machine-id'
  ),
  createCheckout: channel<
    LicenseCreateCheckoutRequest,
    LicenseCreateCheckoutResponse
  >('license:create-checkout'),
  getPortalUrl: channel<void, LicenseGetPortalUrlResponse>(
    'license:get-portal-url'
  ),
} as const;

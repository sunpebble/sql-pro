import type { SqlProApiDeps } from '../../lib/sql-pro-api';
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
import { licenseChannels, proChannels } from './channels';

export interface ProApi {
  getFeatures: () => Promise<GetProFeaturesResponse>;
  activate: (request: ProActivateRequest) => Promise<ProActivateResponse>;
  deactivate: () => Promise<ProDeactivateResponse>;
  getStatus: () => Promise<ProGetStatusResponse>;
  checkStatus: () => Promise<CheckProStatusResponse>;
}

export interface LicenseApi {
  getMachineId: () => Promise<LicenseGetMachineIdResponse>;
  createCheckout: (
    request: LicenseCreateCheckoutRequest
  ) => Promise<LicenseCreateCheckoutResponse>;
  activate: (request: LicenseActivateRequest) => Promise<LicenseActivateResponse>;
  verify: () => Promise<LicenseVerifyResponse>;
  deactivate: () => Promise<LicenseDeactivateResponse>;
  getPortalUrl: () => Promise<LicenseGetPortalUrlResponse>;
}

export function createProApi({ invoke }: SqlProApiDeps): ProApi {
  return {
    getFeatures: () => invoke(proChannels.getFeatures.name),
    activate: (request) => invoke(proChannels.activate.name, request),
    deactivate: () => invoke(proChannels.deactivate.name),
    getStatus: () => invoke(proChannels.getStatus.name),
    checkStatus: () => invoke(proChannels.checkStatus.name),
  };
}

export function createLicenseApi({ invoke }: SqlProApiDeps): LicenseApi {
  return {
    getMachineId: () => invoke(licenseChannels.getMachineId.name),
    createCheckout: (request) =>
      invoke(licenseChannels.createCheckout.name, request),
    activate: (request) => invoke(licenseChannels.activate.name, request),
    verify: () => invoke(licenseChannels.verify.name),
    deactivate: () => invoke(licenseChannels.deactivate.name),
    getPortalUrl: () => invoke(licenseChannels.getPortalUrl.name),
  };
}

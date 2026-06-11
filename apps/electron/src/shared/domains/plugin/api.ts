import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type {
  DisablePluginResponse,
  EnablePluginResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginsResponse,
  PluginEvent,
  UninstallPluginResponse,
} from './types';
import { pluginChannels } from './channels';

export interface PluginApi {
  install: (request: InstallPluginRequest) => Promise<InstallPluginResponse>;
  uninstall: (pluginId: string) => Promise<UninstallPluginResponse>;
  enable: (pluginId: string) => Promise<EnablePluginResponse>;
  disable: (pluginId: string) => Promise<DisablePluginResponse>;
  list: () => Promise<ListPluginsResponse>;
  onEvent: (callback: (event: PluginEvent) => void) => () => void;
}

export function createPluginApi({ invoke, on, off }: SqlProApiDeps): PluginApi {
  return {
    install: (request) => invoke(pluginChannels.install.name, request),
    uninstall: (pluginId) =>
      invoke(pluginChannels.uninstall.name, { pluginId }),
    enable: (pluginId) => invoke(pluginChannels.enable.name, { pluginId }),
    disable: (pluginId) => invoke(pluginChannels.disable.name, { pluginId }),
    list: () => invoke(pluginChannels.list.name),
    onEvent: (callback) => {
      const handler = (_event: unknown, payload: PluginEvent) =>
        callback(payload);
      on(pluginChannels.onEvent.name, handler);
      return () => off(pluginChannels.onEvent.name, handler);
    },
  };
}

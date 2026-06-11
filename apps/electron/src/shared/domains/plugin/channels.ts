import type {
  DisablePluginResponse,
  EnablePluginResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginsResponse,
  PluginEvent,
  UninstallPluginResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const pluginChannels = {
  install: channel<InstallPluginRequest, InstallPluginResponse>(
    'plugin:install'
  ),
  uninstall: channel<{ pluginId: string }, UninstallPluginResponse>(
    'plugin:uninstall'
  ),
  enable: channel<{ pluginId: string }, EnablePluginResponse>('plugin:enable'),
  disable: channel<{ pluginId: string }, DisablePluginResponse>(
    'plugin:disable'
  ),
  list: channel<void, ListPluginsResponse>('plugin:list'),
  onEvent: channel<PluginEvent, void>('plugin:event'),
} as const;

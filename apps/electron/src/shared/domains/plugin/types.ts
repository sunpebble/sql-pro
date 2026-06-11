/**
 * Plugin domain types — Plugin system interfaces, ext points, hooks, lifecycle.
 * Re-exports from the existing plugin type declarations for progressive coexistence.
 */

export type {
  AfterQueryHook,
  BeforeQueryHook,
  // Command system
  CommandOptions,
  DisablePluginRequest,
  DisablePluginResponse,
  EnablePluginRequest,
  EnablePluginResponse,
  // IPC types
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginsRequest,
  ListPluginsResponse,
  // UI contributions
  MenuItemOptions,
  // Extension APIs
  MetadataAPI,
  NotificationOptions,
  PanelOptions,
  PluginAPI,
  PluginContext,
  PluginEvent,
  PluginEventType,
  PluginInfo,
  PluginInstance,
  PluginListing,
  PluginManifest,
  PluginModule,
  PluginPermission,
  PluginRegistryEntry,
  PluginState,
  // Query hooks
  QueryContext,
  QueryErrorHook,
  QueryHookResult,
  QueryLifecycleAPI,
  StorageAPI,
  UIExtensionAPI,
  UninstallPluginRequest,
  UninstallPluginResponse,
} from '../../types/plugin.d';

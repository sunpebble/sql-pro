// ============ Plugin Types (mirrored from main process for renderer usage) ============

/**
 * Plugin permission types for future granular permission system.
 */
export type PluginPermission =
  | 'query:read'
  | 'query:write'
  | 'ui:menu'
  | 'ui:panel'
  | 'ui:command'
  | 'storage:read'
  | 'storage:write'
  | 'connection:info';

/**
 * Plugin manifest schema (plugin.json).
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  permissions?: PluginPermission[];
  engines?: {
    sqlpro?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  icon?: string;
  screenshots?: string[];
  apiVersion?: string;
}

/**
 * Possible states for a plugin during its lifecycle.
 */
export type PluginState =
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'loading'
  | 'unloading';

/**
 * Stored plugin metadata including state and settings.
 */
export interface PluginInfo {
  manifest: PluginManifest;
  path: string;
  state: PluginState;
  enabled: boolean;
  installedAt: string;
  updatedAt?: string;
  error?: string;
}

/**
 * Plugin listing in the marketplace.
 */
export interface PluginListing {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  downloadUrl: string;
  iconUrl?: string;
  screenshots?: string[];
  homepage?: string;
  repository?: string;
  categories?: string[];
  downloads?: number;
  rating?: number;
  updatedAt: string;
  engineVersion?: string;
  permissions?: PluginPermission[];
}

// ============ Shared Helper Functions ============

/**
 * Type guard to check if plugin data is PluginInfo (installed plugin)
 */
export function isPluginInfo(
  plugin: PluginInfo | PluginListing
): plugin is PluginInfo {
  return 'manifest' in plugin && 'state' in plugin;
}

/**
 * Get plugin name from either PluginInfo or PluginListing
 */
export function getPluginName(plugin: PluginInfo | PluginListing): string {
  return isPluginInfo(plugin) ? plugin.manifest.name : plugin.name;
}

/**
 * Get plugin id from either PluginInfo or PluginListing
 */
export function getPluginId(plugin: PluginInfo | PluginListing): string {
  return isPluginInfo(plugin) ? plugin.manifest.id : plugin.id;
}

/**
 * Get plugin version from either PluginInfo or PluginListing
 */
export function getPluginVersion(plugin: PluginInfo | PluginListing): string {
  return isPluginInfo(plugin) ? plugin.manifest.version : plugin.version;
}

/**
 * Get plugin description from either PluginInfo or PluginListing
 */
export function getPluginDescription(
  plugin: PluginInfo | PluginListing
): string {
  return isPluginInfo(plugin)
    ? plugin.manifest.description
    : plugin.description;
}

/**
 * Get plugin author from either PluginInfo or PluginListing
 */
export function getPluginAuthor(plugin: PluginInfo | PluginListing): string {
  return isPluginInfo(plugin) ? plugin.manifest.author : plugin.author;
}

/**
 * Get plugin icon URL from either PluginInfo or PluginListing
 */
export function getPluginIcon(
  plugin: PluginInfo | PluginListing
): string | undefined {
  return isPluginInfo(plugin) ? plugin.manifest.icon : plugin.iconUrl;
}

/**
 * Get state badge variant based on plugin state
 */
export function getStateBadgeVariant(
  state: PluginState
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state) {
    case 'enabled':
      return 'default';
    case 'disabled':
    case 'installed':
      return 'secondary';
    case 'error':
      return 'destructive';
    case 'loading':
    case 'unloading':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get human-readable state label key
 */
export function getStateLabelKey(state: PluginState): string {
  switch (state) {
    case 'enabled':
      return 'pluginCard.enabled';
    case 'disabled':
      return 'pluginCard.disabled';
    case 'installed':
      return 'pluginCard.installed';
    case 'error':
      return 'pluginCard.error';
    case 'loading':
      return 'pluginCard.loading';
    case 'unloading':
      return 'pluginCard.unloading';
    default:
      return state;
  }
}

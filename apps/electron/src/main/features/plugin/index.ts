/**
 * Plugin Feature Module
 *
 * Provides plugin system functionality:
 * - Plugin loading and unloading
 * - Plugin registry management
 * - Plugin runtime sandboxing
 * - Query hook integration
 */

// Re-export plugin components
export { PluginLoader } from '../../services/plugin/PluginLoader';

export { PluginRegistry } from '../../services/plugin/PluginRegistry';
export { PluginRuntime } from '../../services/plugin/PluginRuntime';
// Re-export plugin service
export { pluginService } from '../../services/plugin/PluginService';

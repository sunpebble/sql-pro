/**
 * Plugin System for SQL Pro (Tauri Edition)
 *
 * This plugin system allows extending SQL Pro functionality through
 * JavaScript plugins. It integrates with the Tauri backend for
 * persistence and management while running plugins in the frontend context.
 *
 * For full sandbox isolation, consider using WASM or separate WebViews
 * in a future implementation.
 */

import { sqlPro } from './api';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
  permissions?: string[];
}

export interface PluginContext {
  /** Execute a SQL query on the current connection */
  executeQuery: (sql: string) => Promise<{
    success: boolean;
    rows?: Record<string, unknown>[];
    error?: string;
  }>;
  /** Get the current schema */
  getSchema: () => Promise<unknown>;
  /** Show a notification */
  showNotification: (
    message: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  /** Register a menu command */
  registerCommand: (command: PluginCommand) => void;
  /** Register a query hook */
  registerQueryHook: (hook: QueryHook) => void;
}

export interface PluginCommand {
  id: string;
  label: string;
  shortcut?: string;
  handler: () => void | Promise<void>;
}

export interface QueryHook {
  id: string;
  /** Called before a query is executed, can modify the query */
  beforeExecute?: (query: string) => string | Promise<string>;
  /** Called after a query is executed */
  afterExecute?: (query: string, result: unknown) => void | Promise<void>;
}

export interface Plugin {
  manifest: PluginManifest;
  activate: (context: PluginContext) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  instance: Plugin;
  enabled: boolean;
  commands: PluginCommand[];
  queryHooks: QueryHook[];
}

/**
 * Plugin Manager
 *
 * Manages plugins with persistence through the Tauri backend.
 */
class PluginManager {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private queryHooks: Map<string, QueryHook> = new Map();
  private initialized = false;

  /**
   * Initialize the plugin manager by loading persisted plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load persisted plugins from backend
      const result = await sqlPro.plugins.list();
      if (result.success && result.plugins) {
        for (const pluginInfo of result.plugins) {
          // Store plugin info without activating (will be activated on enable)
          const loadedPlugin: LoadedPlugin = {
            manifest: pluginInfo.manifest,
            instance: {
              manifest: pluginInfo.manifest,
              activate: () => {},
            },
            enabled: pluginInfo.enabled,
            commands: [],
            queryHooks: [],
          };
          this.plugins.set(pluginInfo.manifest.id, loadedPlugin);
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error);
    }
  }

  /**
   * Load a plugin from a manifest and module
   */
  async loadPlugin(
    manifest: PluginManifest,
    pluginModule: Plugin
  ): Promise<void> {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already loaded`);
    }

    const loadedPlugin: LoadedPlugin = {
      manifest,
      instance: pluginModule,
      enabled: false,
      commands: [],
      queryHooks: [],
    };

    this.plugins.set(manifest.id, loadedPlugin);

    // TODO: Persist to backend - API signature mismatch needs resolution
    // The install API expects { source, sourceType } not manifest
    // await sqlPro.plugins.install({ source: manifest.main, sourceType: 'directory' });
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.enabled) {
      return;
    }

    // Create a context wrapper that tracks registrations
    const pluginContext: PluginContext = {
      ...context,
      registerCommand: (command: PluginCommand) => {
        const fullId = `${pluginId}:${command.id}`;
        const registeredCommand = { ...command, id: fullId };
        plugin.commands.push(registeredCommand);
        this.commands.set(fullId, registeredCommand);
      },
      registerQueryHook: (hook: QueryHook) => {
        const fullId = `${pluginId}:${hook.id}`;
        const registeredHook = { ...hook, id: fullId };
        plugin.queryHooks.push(registeredHook);
        this.queryHooks.set(fullId, registeredHook);
      },
    };

    await plugin.instance.activate(pluginContext);
    plugin.enabled = true;

    // Persist to backend
    await sqlPro.plugins.enable({ pluginId });
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      return;
    }

    // Unregister commands and hooks
    for (const command of plugin.commands) {
      this.commands.delete(command.id);
    }
    for (const hook of plugin.queryHooks) {
      this.queryHooks.delete(hook.id);
    }
    plugin.commands = [];
    plugin.queryHooks = [];

    // Call deactivate if defined
    if (plugin.instance.deactivate) {
      await plugin.instance.deactivate();
    }

    plugin.enabled = false;

    // Persist to backend
    await sqlPro.plugins.disable({ pluginId });
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    await this.disablePlugin(pluginId);
    this.plugins.delete(pluginId);

    // Persist to backend
    await sqlPro.plugins.uninstall({ pluginId });
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all registered commands
   */
  getCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Execute all query hooks before execution
   */
  async executeBeforeHooks(query: string): Promise<string> {
    let modifiedQuery = query;
    for (const hook of this.queryHooks.values()) {
      if (hook.beforeExecute) {
        modifiedQuery = await hook.beforeExecute(modifiedQuery);
      }
    }
    return modifiedQuery;
  }

  /**
   * Execute all query hooks after execution
   */
  async executeAfterHooks(query: string, result: unknown): Promise<void> {
    for (const hook of this.queryHooks.values()) {
      if (hook.afterExecute) {
        await hook.afterExecute(query, result);
      }
    }
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

/**
 * Built-in plugin examples
 */
export const builtInPlugins: Plugin[] = [
  {
    manifest: {
      id: 'sql-pro.query-logger',
      name: 'Query Logger',
      version: '1.0.0',
      description: 'Logs all executed queries to the console',
      main: 'index.js',
    },
    activate(context) {
      context.registerQueryHook({
        id: 'logger',
        afterExecute: (query, result) => {
          // eslint-disable-next-line no-console -- Intentional logging for debug plugin
          console.log('[Query Logger]', query);
          // eslint-disable-next-line no-console -- Intentional logging for debug plugin
          console.log('[Query Logger] Result:', result);
        },
      });

      context.registerCommand({
        id: 'show-log',
        label: 'Show Query Log',
        handler: () => {
          context.showNotification(
            'Query log is available in the browser console',
            'info'
          );
        },
      });
    },
  },
];

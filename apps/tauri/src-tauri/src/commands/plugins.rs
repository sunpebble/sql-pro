//! Plugin system command handlers
//!
//! Manages plugin installation, enabling/disabling, and storage.
//! Note: This is a simplified implementation. Full sandbox isolation
//! would require WASM or separate WebViews.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "plugins-store.json";
const PLUGINS_KEY: &str = "plugins";
const PLUGIN_DATA_KEY: &str = "pluginData";

/// Plugin manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    pub main: String,
    #[serde(default)]
    pub permissions: Vec<String>,
}

/// Plugin info stored in the registry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    pub manifest: PluginManifest,
    pub path: String,
    pub enabled: bool,
    pub installed_at: String,
    #[serde(default)]
    pub state: String, // "installed", "enabled", "disabled", "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Request to install a plugin
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallPluginRequest {
    pub manifest: PluginManifest,
    pub path: String,
}

/// Request to uninstall a plugin
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UninstallPluginRequest {
    pub plugin_id: String,
    #[serde(default = "default_remove_data")]
    pub remove_data: bool,
}

fn default_remove_data() -> bool {
    true
}

/// Request to enable/disable a plugin
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TogglePluginRequest {
    pub plugin_id: String,
}

/// Request for plugin data operations
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginDataRequest {
    pub plugin_id: String,
    pub key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<serde_json::Value>,
}

/// Response for plugin operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for listing plugins
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListPluginsResponse {
    pub success: bool,
    pub plugins: Vec<PluginInfo>,
}

/// Response for getting a plugin
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetPluginResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plugin: Option<PluginInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for plugin data get
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginDataResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Get the plugins directory
fn get_plugins_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("plugins")
}

/// Get all installed plugins from store
fn get_plugins(app: &tauri::AppHandle) -> Result<HashMap<String, PluginInfo>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let plugins: HashMap<String, PluginInfo> = store
        .get(PLUGINS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    Ok(plugins)
}

/// Save plugins to store
fn save_plugins(
    app: &tauri::AppHandle,
    plugins: &HashMap<String, PluginInfo>,
) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let value = serde_json::to_value(plugins).map_err(|e| e.to_string())?;
    store.set(PLUGINS_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Get plugin data from store
fn get_plugin_data(
    app: &tauri::AppHandle,
) -> Result<HashMap<String, HashMap<String, serde_json::Value>>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let data: HashMap<String, HashMap<String, serde_json::Value>> = store
        .get(PLUGIN_DATA_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    Ok(data)
}

/// Save plugin data to store
fn save_plugin_data(
    app: &tauri::AppHandle,
    data: &HashMap<String, HashMap<String, serde_json::Value>>,
) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let value = serde_json::to_value(data).map_err(|e| e.to_string())?;
    store.set(PLUGIN_DATA_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// List all installed plugins
#[tauri::command]
pub async fn plugins_list(app: tauri::AppHandle) -> ListPluginsResponse {
    match get_plugins(&app) {
        Ok(plugins) => ListPluginsResponse {
            success: true,
            plugins: plugins.into_values().collect(),
        },
        Err(e) => {
            log::error!("Failed to list plugins: {}", e);
            ListPluginsResponse {
                success: false,
                plugins: vec![],
            }
        }
    }
}

/// Get a specific plugin
#[tauri::command]
pub async fn plugins_get(
    app: tauri::AppHandle,
    plugin_id: String,
) -> GetPluginResponse {
    match get_plugins(&app) {
        Ok(plugins) => match plugins.get(&plugin_id) {
            Some(plugin) => GetPluginResponse {
                success: true,
                plugin: Some(plugin.clone()),
                error: None,
            },
            None => GetPluginResponse {
                success: false,
                plugin: None,
                error: Some(format!("Plugin not found: {}", plugin_id)),
            },
        },
        Err(e) => GetPluginResponse {
            success: false,
            plugin: None,
            error: Some(e),
        },
    }
}

/// Install a plugin
#[tauri::command]
pub async fn plugins_install(
    app: tauri::AppHandle,
    request: InstallPluginRequest,
) -> PluginResponse {
    log::info!("Installing plugin: {}", request.manifest.id);

    let mut plugins = match get_plugins(&app) {
        Ok(p) => p,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    // Check if already installed
    if plugins.contains_key(&request.manifest.id) {
        return PluginResponse {
            success: false,
            error: Some(format!(
                "Plugin already installed: {}",
                request.manifest.id
            )),
        };
    }

    // Create plugin info
    let plugin_info = PluginInfo {
        manifest: request.manifest.clone(),
        path: request.path,
        enabled: false,
        installed_at: chrono::Utc::now().to_rfc3339(),
        state: "installed".to_string(),
        error: None,
    };

    // Add to registry
    plugins.insert(request.manifest.id.clone(), plugin_info);

    // Save
    match save_plugins(&app, &plugins) {
        Ok(()) => {
            log::info!("Plugin installed: {}", request.manifest.id);
            PluginResponse {
                success: true,
                error: None,
            }
        }
        Err(e) => PluginResponse {
            success: false,
            error: Some(e),
        },
    }
}

/// Uninstall a plugin
#[tauri::command]
pub async fn plugins_uninstall(
    app: tauri::AppHandle,
    request: UninstallPluginRequest,
) -> PluginResponse {
    log::info!("Uninstalling plugin: {}", request.plugin_id);

    let mut plugins = match get_plugins(&app) {
        Ok(p) => p,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    // Check if exists
    if !plugins.contains_key(&request.plugin_id) {
        return PluginResponse {
            success: false,
            error: Some(format!("Plugin not found: {}", request.plugin_id)),
        };
    }

    // Remove from registry
    plugins.remove(&request.plugin_id);

    // Save registry
    if let Err(e) = save_plugins(&app, &plugins) {
        return PluginResponse {
            success: false,
            error: Some(e),
        };
    }

    // Remove plugin data if requested
    if request.remove_data {
        if let Ok(mut data) = get_plugin_data(&app) {
            data.remove(&request.plugin_id);
            let _ = save_plugin_data(&app, &data);
        }
    }

    // Try to remove plugin files
    let plugins_dir = get_plugins_dir(&app);
    let plugin_dir = plugins_dir.join(&request.plugin_id);
    if plugin_dir.exists() {
        let _ = fs::remove_dir_all(&plugin_dir);
    }

    log::info!("Plugin uninstalled: {}", request.plugin_id);
    PluginResponse {
        success: true,
        error: None,
    }
}

/// Enable a plugin
#[tauri::command]
pub async fn plugins_enable(
    app: tauri::AppHandle,
    request: TogglePluginRequest,
) -> PluginResponse {
    log::info!("Enabling plugin: {}", request.plugin_id);

    let mut plugins = match get_plugins(&app) {
        Ok(p) => p,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    match plugins.get_mut(&request.plugin_id) {
        Some(plugin) => {
            plugin.enabled = true;
            plugin.state = "enabled".to_string();
            plugin.error = None;

            match save_plugins(&app, &plugins) {
                Ok(()) => {
                    log::info!("Plugin enabled: {}", request.plugin_id);
                    PluginResponse {
                        success: true,
                        error: None,
                    }
                }
                Err(e) => PluginResponse {
                    success: false,
                    error: Some(e),
                },
            }
        }
        None => PluginResponse {
            success: false,
            error: Some(format!("Plugin not found: {}", request.plugin_id)),
        },
    }
}

/// Disable a plugin
#[tauri::command]
pub async fn plugins_disable(
    app: tauri::AppHandle,
    request: TogglePluginRequest,
) -> PluginResponse {
    log::info!("Disabling plugin: {}", request.plugin_id);

    let mut plugins = match get_plugins(&app) {
        Ok(p) => p,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    match plugins.get_mut(&request.plugin_id) {
        Some(plugin) => {
            plugin.enabled = false;
            plugin.state = "disabled".to_string();

            match save_plugins(&app, &plugins) {
                Ok(()) => {
                    log::info!("Plugin disabled: {}", request.plugin_id);
                    PluginResponse {
                        success: true,
                        error: None,
                    }
                }
                Err(e) => PluginResponse {
                    success: false,
                    error: Some(e),
                },
            }
        }
        None => PluginResponse {
            success: false,
            error: Some(format!("Plugin not found: {}", request.plugin_id)),
        },
    }
}

/// Get plugin data
#[tauri::command]
pub async fn plugins_get_data(
    app: tauri::AppHandle,
    request: PluginDataRequest,
) -> PluginDataResponse {
    match get_plugin_data(&app) {
        Ok(data) => {
            let value = data
                .get(&request.plugin_id)
                .and_then(|plugin_data| plugin_data.get(&request.key))
                .cloned();

            PluginDataResponse {
                success: true,
                value,
                error: None,
            }
        }
        Err(e) => PluginDataResponse {
            success: false,
            value: None,
            error: Some(e),
        },
    }
}

/// Set plugin data
#[tauri::command]
pub async fn plugins_set_data(
    app: tauri::AppHandle,
    request: PluginDataRequest,
) -> PluginResponse {
    let mut data = match get_plugin_data(&app) {
        Ok(d) => d,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    // Get or create plugin data map
    let plugin_data = data.entry(request.plugin_id.clone()).or_default();

    // Set or remove the value
    match request.value {
        Some(value) => {
            plugin_data.insert(request.key, value);
        }
        None => {
            plugin_data.remove(&request.key);
        }
    }

    match save_plugin_data(&app, &data) {
        Ok(()) => PluginResponse {
            success: true,
            error: None,
        },
        Err(e) => PluginResponse {
            success: false,
            error: Some(e),
        },
    }
}

/// Clear all plugin data for a specific plugin
#[tauri::command]
pub async fn plugins_clear_data(
    app: tauri::AppHandle,
    plugin_id: String,
) -> PluginResponse {
    let mut data = match get_plugin_data(&app) {
        Ok(d) => d,
        Err(e) => {
            return PluginResponse {
                success: false,
                error: Some(e),
            }
        }
    };

    data.remove(&plugin_id);

    match save_plugin_data(&app, &data) {
        Ok(()) => PluginResponse {
            success: true,
            error: None,
        },
        Err(e) => PluginResponse {
            success: false,
            error: Some(e),
        },
    }
}


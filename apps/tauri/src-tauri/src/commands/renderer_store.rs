//! Renderer store commands
//!
//! Handles persistence of frontend state using tauri-plugin-store

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri_plugin_store::StoreExt;

/// Request to get renderer state
#[derive(Debug, Deserialize)]
pub struct GetRendererStateRequest {
    pub key: String,
}

/// Response for getting renderer state
#[derive(Debug, Serialize)]
pub struct GetRendererStateResponse {
    pub success: bool,
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Request to set renderer state
#[derive(Debug, Deserialize)]
pub struct SetRendererStateRequest {
    pub key: String,
    pub value: Value,
}

/// Response for setting renderer state
#[derive(Debug, Serialize)]
pub struct SetRendererStateResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Request to update renderer state (partial merge)
#[derive(Debug, Deserialize)]
pub struct UpdateRendererStateRequest {
    pub key: String,
    pub updates: Value,
}

const RENDERER_STORE_FILE: &str = "renderer-store.json";

/// Get state for a specific key from the renderer store
#[tauri::command]
pub async fn renderer_store_get(
    app: tauri::AppHandle,
    request: GetRendererStateRequest,
) -> GetRendererStateResponse {
    let store = match app.store(RENDERER_STORE_FILE) {
        Ok(s) => s,
        Err(e) => {
            return GetRendererStateResponse {
                success: false,
                data: None,
                error: Some(format!("Failed to open store: {}", e)),
            };
        }
    };

    let data = store.get(&request.key);
    GetRendererStateResponse {
        success: true,
        data,
        error: None,
    }
}

/// Set state for a specific key in the renderer store (full replace)
#[tauri::command]
pub async fn renderer_store_set(
    app: tauri::AppHandle,
    request: SetRendererStateRequest,
) -> SetRendererStateResponse {
    let store = match app.store(RENDERER_STORE_FILE) {
        Ok(s) => s,
        Err(e) => {
            return SetRendererStateResponse {
                success: false,
                error: Some(format!("Failed to open store: {}", e)),
            };
        }
    };

    store.set(&request.key, request.value);

    if let Err(e) = store.save() {
        return SetRendererStateResponse {
            success: false,
            error: Some(format!("Failed to save store: {}", e)),
        };
    }

    SetRendererStateResponse {
        success: true,
        error: None,
    }
}

/// Update state for a specific key in the renderer store (partial merge)
#[tauri::command]
pub async fn renderer_store_update(
    app: tauri::AppHandle,
    request: UpdateRendererStateRequest,
) -> SetRendererStateResponse {
    let store = match app.store(RENDERER_STORE_FILE) {
        Ok(s) => s,
        Err(e) => {
            return SetRendererStateResponse {
                success: false,
                error: Some(format!("Failed to open store: {}", e)),
            };
        }
    };

    // Get existing value and merge
    let existing = store.get(&request.key).unwrap_or(Value::Object(serde_json::Map::new()));
    
    let merged = match (existing, &request.updates) {
        (Value::Object(mut existing_obj), Value::Object(updates_obj)) => {
            for (k, v) in updates_obj {
                existing_obj.insert(k.clone(), v.clone());
            }
            Value::Object(existing_obj)
        }
        _ => request.updates.clone()
    };

    store.set(&request.key, merged);

    if let Err(e) = store.save() {
        return SetRendererStateResponse {
            success: false,
            error: Some(format!("Failed to save store: {}", e)),
        };
    }

    SetRendererStateResponse {
        success: true,
        error: None,
    }
}

/// Delete a key from the renderer store
#[tauri::command]
pub async fn renderer_store_delete(
    app: tauri::AppHandle,
    request: GetRendererStateRequest,
) -> SetRendererStateResponse {
    let store = match app.store(RENDERER_STORE_FILE) {
        Ok(s) => s,
        Err(e) => {
            return SetRendererStateResponse {
                success: false,
                error: Some(format!("Failed to open store: {}", e)),
            };
        }
    };

    store.delete(&request.key);

    if let Err(e) = store.save() {
        return SetRendererStateResponse {
            success: false,
            error: Some(format!("Failed to save store: {}", e)),
        };
    }

    SetRendererStateResponse {
        success: true,
        error: None,
    }
}

/// Reset a key to its default value (delete it)
#[tauri::command]
pub async fn renderer_store_reset(
    app: tauri::AppHandle,
    request: GetRendererStateRequest,
) -> SetRendererStateResponse {
    renderer_store_delete(app, request).await
}


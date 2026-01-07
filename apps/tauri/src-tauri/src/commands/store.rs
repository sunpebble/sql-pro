//! Store command handlers
//!
//! Handles preferences and recent connections storage using tauri-plugin-store.

use crate::types::store::*;
use chrono::Utc;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "app-store.json";
const PREFERENCES_KEY: &str = "preferences";
const RECENT_CONNECTIONS_KEY: &str = "recentConnections";

fn get_default_preferences() -> Preferences {
    Preferences {
        theme: "system".to_string(),
        default_page_size: 100,
        confirm_before_apply: true,
        recent_connections_limit: 10,
    }
}

/// Get application preferences
#[tauri::command]
pub async fn store_get_preferences(app: tauri::AppHandle) -> Result<GetPreferencesResponse, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    
    let preferences = store
        .get(PREFERENCES_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_else(get_default_preferences);

    Ok(GetPreferencesResponse {
        success: true,
        preferences: Some(preferences),
    })
}

/// Set application preferences
#[tauri::command]
pub async fn store_set_preferences(
    app: tauri::AppHandle,
    request: SetPreferencesRequest,
) -> Result<SetPreferencesResponse, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    
    let value = serde_json::to_value(&request.preferences).map_err(|e| e.to_string())?;
    store.set(PREFERENCES_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    log::info!("Preferences saved successfully");
    Ok(SetPreferencesResponse { success: true, error: None })
}

/// Get recent database connections
#[tauri::command]
pub async fn store_get_recent_connections(app: tauri::AppHandle) -> Result<GetRecentConnectionsResponse, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    
    let connections: Vec<RecentConnection> = store
        .get(RECENT_CONNECTIONS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    Ok(GetRecentConnectionsResponse {
        success: true,
        connections: Some(connections),
    })
}

/// Save a recent connection
#[tauri::command]
pub async fn store_save_recent_connection(
    app: tauri::AppHandle,
    request: SaveRecentConnectionRequest,
) -> Result<SaveRecentConnectionResponse, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    
    // Get existing connections
    let mut connections: Vec<RecentConnection> = store
        .get(RECENT_CONNECTIONS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    // Check if connection already exists (by path)
    let existing_idx = connections.iter().position(|c| c.path == request.connection.path);
    
    // Create updated connection with current timestamp
    let mut connection = request.connection;
    connection.last_opened = Utc::now().to_rfc3339();
    
    if let Some(idx) = existing_idx {
        // Update existing connection
        connections[idx] = connection;
    } else {
        // Add new connection at the beginning
        connections.insert(0, connection);
    }

    // Limit the number of recent connections
    let preferences: Preferences = store
        .get(PREFERENCES_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_else(get_default_preferences);
    
    let limit = preferences.recent_connections_limit as usize;
    if connections.len() > limit {
        connections.truncate(limit);
    }

    // Save to store
    let value = serde_json::to_value(&connections).map_err(|e| e.to_string())?;
    store.set(RECENT_CONNECTIONS_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    log::info!("Recent connection saved: {}", connections.first().map(|c| &c.path).unwrap_or(&"".to_string()));
    Ok(SaveRecentConnectionResponse { success: true, error: None })
}

/// Remove a recent connection
#[tauri::command]
pub async fn store_remove_recent_connection(
    app: tauri::AppHandle,
    request: RemoveRecentConnectionRequest,
) -> Result<RemoveRecentConnectionResponse, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    
    // Get existing connections
    let mut connections: Vec<RecentConnection> = store
        .get(RECENT_CONNECTIONS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    // Remove connection by path
    let original_len = connections.len();
    connections.retain(|c| c.path != request.path);

    if connections.len() < original_len {
        // Save updated list
        let value = serde_json::to_value(&connections).map_err(|e| e.to_string())?;
        store.set(RECENT_CONNECTIONS_KEY, value);
        store.save().map_err(|e| e.to_string())?;
        
        log::info!("Recent connection removed: {}", request.path);
    }

    Ok(RemoveRecentConnectionResponse { success: true, error: None })
}

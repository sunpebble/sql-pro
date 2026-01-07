//! Profile commands
//!
//! Handles connection profiles (saved connections)

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri_plugin_store::StoreExt;
use uuid::Uuid;
use chrono::Utc;

const PROFILES_STORE_FILE: &str = "profiles-store.json";
const PROFILES_KEY: &str = "profiles";

/// Connection profile structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub id: String,
    pub path: String,
    pub filename: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(default)]
    pub is_encrypted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_opened: Option<String>,
    #[serde(default)]
    pub read_only: bool,
    #[serde(default)]
    pub is_saved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_config: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder_id: Option<String>,
}

/// Request to save a profile
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveProfileRequest {
    pub path: Option<String>,
    pub filename: Option<String>,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub is_encrypted: Option<bool>,
    pub read_only: Option<bool>,
    pub database_type: Option<String>,
    pub config: Option<Value>,
}

/// Request to update a profile
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    pub id: String,
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub read_only: Option<bool>,
    pub config: Option<Value>,
}

/// Request to delete a profile
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteProfileRequest {
    pub id: String,
}

/// Request to update a connection
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConnectionRequest {
    pub path: Option<String>,
    pub connection_id: Option<String>,
    pub display_name: Option<String>,
    pub read_only: Option<bool>,
    pub connection_config: Option<Value>,
    pub updates: Option<UpdateConnectionUpdates>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConnectionUpdates {
    pub display_name: Option<String>,
    pub read_only: Option<bool>,
}

/// Request to remove a connection
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveConnectionRequest {
    pub path: String,
    #[serde(default)]
    pub remove_password: bool,
}

/// Generic response
#[derive(Debug, Serialize)]
pub struct ProfilesResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profiles: Option<Vec<ConnectionProfile>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile: Option<ConnectionProfile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

fn get_profiles(app: &tauri::AppHandle) -> Vec<ConnectionProfile> {
    let store = match app.store(PROFILES_STORE_FILE) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    store
        .get(PROFILES_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

fn save_profiles(app: &tauri::AppHandle, profiles: &[ConnectionProfile]) -> Result<(), String> {
    let store = app.store(PROFILES_STORE_FILE).map_err(|e| e.to_string())?;
    store.set(PROFILES_KEY, serde_json::to_value(profiles).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())
}

/// Get all connection profiles
#[tauri::command]
pub async fn profiles_get(app: tauri::AppHandle) -> ProfilesResponse {
    let profiles = get_profiles(&app);
    ProfilesResponse {
        success: true,
        profiles: Some(profiles),
        profile: None,
        error: None,
    }
}

/// Save a connection profile
#[tauri::command]
pub async fn profiles_save(
    app: tauri::AppHandle,
    request: SaveProfileRequest,
) -> ProfilesResponse {
    let profile = ConnectionProfile {
        id: Uuid::new_v4().to_string(),
        path: request.path.unwrap_or_default(),
        filename: request.filename.or(request.name.clone()).unwrap_or_default(),
        display_name: request.display_name.or(request.name),
        is_encrypted: request.is_encrypted.unwrap_or(false),
        last_opened: Some(Utc::now().to_rfc3339()),
        read_only: request.read_only.unwrap_or(false),
        is_saved: true,
        database_type: request.database_type,
        connection_config: request.config,
        folder_id: None,
    };

    let mut profiles = get_profiles(&app);
    profiles.push(profile.clone());

    if let Err(e) = save_profiles(&app, &profiles) {
        return ProfilesResponse {
            success: false,
            profiles: None,
            profile: None,
            error: Some(e),
        };
    }

    ProfilesResponse {
        success: true,
        profiles: None,
        profile: Some(profile),
        error: None,
    }
}

/// Update a connection profile
#[tauri::command]
pub async fn profiles_update(
    app: tauri::AppHandle,
    request: UpdateProfileRequest,
) -> ProfilesResponse {
    let mut profiles = get_profiles(&app);
    
    let profile_idx = profiles.iter().position(|p| p.id == request.id);
    
    if let Some(idx) = profile_idx {
        if let Some(name) = request.display_name.or(request.name) {
            profiles[idx].display_name = Some(name);
        }
        if let Some(read_only) = request.read_only {
            profiles[idx].read_only = read_only;
        }
        if let Some(config) = request.config {
            profiles[idx].connection_config = Some(config);
        }

        let profile = profiles[idx].clone();

        if let Err(e) = save_profiles(&app, &profiles) {
            return ProfilesResponse {
                success: false,
                profiles: None,
                profile: None,
                error: Some(e),
            };
        }

        return ProfilesResponse {
            success: true,
            profiles: None,
            profile: Some(profile),
            error: None,
        };
    }

    ProfilesResponse {
        success: false,
        profiles: None,
        profile: None,
        error: Some("Profile not found".to_string()),
    }
}

/// Delete a connection profile
#[tauri::command]
pub async fn profiles_delete(
    app: tauri::AppHandle,
    request: DeleteProfileRequest,
) -> ProfilesResponse {
    let mut profiles = get_profiles(&app);
    profiles.retain(|p| p.id != request.id);

    if let Err(e) = save_profiles(&app, &profiles) {
        return ProfilesResponse {
            success: false,
            profiles: None,
            profile: None,
            error: Some(e),
        };
    }

    ProfilesResponse {
        success: true,
        profiles: None,
        profile: None,
        error: None,
    }
}

/// Update a connection (in profiles or recent connections)
#[tauri::command]
pub async fn connection_update(
    app: tauri::AppHandle,
    request: UpdateConnectionRequest,
) -> ProfilesResponse {
    let mut profiles = get_profiles(&app);
    
    let profile_idx = profiles.iter().position(|p| {
        Some(&p.path) == request.path.as_ref() || 
        Some(&p.id) == request.connection_id.as_ref()
    });
    
    if let Some(idx) = profile_idx {
        if let Some(ref updates) = request.updates {
            if let Some(ref name) = updates.display_name {
                profiles[idx].display_name = Some(name.clone());
            }
            if let Some(read_only) = updates.read_only {
                profiles[idx].read_only = read_only;
            }
        }
        if let Some(ref name) = request.display_name {
            profiles[idx].display_name = Some(name.clone());
        }
        if let Some(read_only) = request.read_only {
            profiles[idx].read_only = read_only;
        }
        if let Some(ref config) = request.connection_config {
            profiles[idx].connection_config = Some(config.clone());
        }

        let profile = profiles[idx].clone();

        if let Err(e) = save_profiles(&app, &profiles) {
            return ProfilesResponse {
                success: false,
                profiles: None,
                profile: None,
                error: Some(e),
            };
        }

        return ProfilesResponse {
            success: true,
            profiles: None,
            profile: Some(profile),
            error: None,
        };
    }

    ProfilesResponse {
        success: false,
        profiles: None,
        profile: None,
        error: Some("Connection not found".to_string()),
    }
}

/// Remove a connection from profiles
#[tauri::command]
pub async fn connection_remove(
    app: tauri::AppHandle,
    request: RemoveConnectionRequest,
) -> ProfilesResponse {
    let mut profiles = get_profiles(&app);
    profiles.retain(|p| p.path != request.path);

    if let Err(e) = save_profiles(&app, &profiles) {
        return ProfilesResponse {
            success: false,
            profiles: None,
            profile: None,
            error: Some(e),
        };
    }

    // Remove saved password if requested
    if request.remove_password {
        let _ = crate::services::password::PasswordService::remove(&request.path);
    }

    ProfilesResponse {
        success: true,
        profiles: None,
        profile: None,
        error: None,
    }
}


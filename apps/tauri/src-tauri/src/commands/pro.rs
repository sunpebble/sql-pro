//! Pro license command handlers
//!
//! Handles Pro version activation, status checking, and deactivation.

use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "app-store.json";
const PRO_STATUS_KEY: &str = "proStatus";

/// Pro activation status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProStatus {
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
}

impl Default for ProStatus {
    fn default() -> Self {
        Self {
            is_active: false,
            activation_date: None,
            license_key: None,
            expires_at: None,
        }
    }
}

/// Request to activate Pro
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProActivateRequest {
    pub license_key: String,
}

/// Response for Pro operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for getting Pro status
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProStatusResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<ProStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Get Pro status from store
fn get_pro_status(app: &tauri::AppHandle) -> Result<ProStatus, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let status = store
        .get(PRO_STATUS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    Ok(status)
}

/// Save Pro status to store
fn save_pro_status(app: &tauri::AppHandle, status: &ProStatus) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;

    let value = serde_json::to_value(status).map_err(|e| e.to_string())?;
    store.set(PRO_STATUS_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// Activate Pro license
#[tauri::command]
pub async fn pro_activate(app: tauri::AppHandle, request: ProActivateRequest) -> ProResponse {
    log::info!("Activating Pro license...");

    // In a real implementation, you would validate the license key with a server
    // For now, we'll just accept any non-empty key
    if request.license_key.is_empty() {
        return ProResponse {
            success: false,
            error: Some("License key cannot be empty".to_string()),
        };
    }

    let status = ProStatus {
        is_active: true,
        activation_date: Some(chrono::Utc::now().to_rfc3339()),
        license_key: Some(request.license_key),
        expires_at: None, // Set this based on license validation
    };

    match save_pro_status(&app, &status) {
        Ok(()) => {
            log::info!("Pro license activated successfully");
            ProResponse {
                success: true,
                error: None,
            }
        }
        Err(e) => {
            log::error!("Failed to save Pro status: {}", e);
            ProResponse {
                success: false,
                error: Some(e),
            }
        }
    }
}

/// Get Pro status
#[tauri::command]
pub async fn pro_get_status(app: tauri::AppHandle) -> ProStatusResponse {
    match get_pro_status(&app) {
        Ok(status) => ProStatusResponse {
            success: true,
            status: Some(status),
            error: None,
        },
        Err(e) => {
            log::error!("Failed to get Pro status: {}", e);
            ProStatusResponse {
                success: false,
                status: None,
                error: Some(e),
            }
        }
    }
}

/// Clear Pro status (deactivate)
#[tauri::command]
pub async fn pro_clear_status(app: tauri::AppHandle) -> ProResponse {
    log::info!("Clearing Pro status...");

    let status = ProStatus::default();

    match save_pro_status(&app, &status) {
        Ok(()) => {
            log::info!("Pro status cleared successfully");
            ProResponse {
                success: true,
                error: None,
            }
        }
        Err(e) => {
            log::error!("Failed to clear Pro status: {}", e);
            ProResponse {
                success: false,
                error: Some(e),
            }
        }
    }
}


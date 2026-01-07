//! Updater command handlers
//!
//! Handles automatic update checking using tauri-plugin-updater.
//! The actual download and install is handled via the JavaScript API
//! for better progress tracking and user experience.

use serde::Serialize;
use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

/// Update status enum matching Electron's structure
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum UpdateStatus {
    NotAvailable,
    Checking,
    Available {
        #[serde(skip_serializing_if = "Option::is_none")]
        info: Option<UpdateInfo>,
    },
    Downloading {
        #[serde(skip_serializing_if = "Option::is_none")]
        progress: Option<DownloadProgress>,
    },
    Downloaded {
        #[serde(skip_serializing_if = "Option::is_none")]
        info: Option<UpdateInfo>,
    },
    Error {
        #[serde(skip_serializing_if = "Option::is_none")]
        error: Option<String>,
    },
}

/// Update information
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub release_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub release_notes: Option<String>,
}

/// Download progress
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub percent: f64,
    pub bytes_per_second: u64,
    pub total: u64,
    pub transferred: u64,
}

/// Response for update check
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckUpdateResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub update_available: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub info: Option<UpdateInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for update operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for get status
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetStatusResponse {
    pub success: bool,
    pub status: UpdateStatus,
}

/// Check for updates
#[tauri::command]
pub async fn updates_check(app: tauri::AppHandle) -> CheckUpdateResponse {
    log::info!("Checking for updates...");

    // Emit checking status
    let _ = app.emit("update-status", UpdateStatus::Checking);

    match app.updater() {
        Ok(updater) => match updater.check().await {
            Ok(Some(update)) => {
                let info = UpdateInfo {
                    version: update.version.clone(),
                    release_date: update.date.map(|d| d.to_string()),
                    release_notes: update.body.clone(),
                };

                // Emit available status
                let _ = app.emit(
                    "update-status",
                    UpdateStatus::Available {
                        info: Some(info.clone()),
                    },
                );

                log::info!("Update available: {}", info.version);

                CheckUpdateResponse {
                    success: true,
                    update_available: Some(true),
                    info: Some(info),
                    error: None,
                }
            }
            Ok(None) => {
                // Emit not available status
                let _ = app.emit("update-status", UpdateStatus::NotAvailable);

                log::info!("No updates available");

                CheckUpdateResponse {
                    success: true,
                    update_available: Some(false),
                    info: None,
                    error: None,
                }
            }
            Err(e) => {
                let error_msg = e.to_string();

                // Emit error status
                let _ = app.emit(
                    "update-status",
                    UpdateStatus::Error {
                        error: Some(error_msg.clone()),
                    },
                );

                log::error!("Failed to check for updates: {}", error_msg);

                CheckUpdateResponse {
                    success: false,
                    update_available: None,
                    info: None,
                    error: Some(error_msg),
                }
            }
        },
        Err(e) => {
            let error_msg = format!("Updater not available: {}", e);
            log::error!("{}", error_msg);

            CheckUpdateResponse {
                success: false,
                update_available: None,
                info: None,
                error: Some(error_msg),
            }
        }
    }
}

/// Download update - placeholder, actual download handled via JS API
/// The @tauri-apps/plugin-updater JS library provides better download/install UX
#[tauri::command]
pub async fn updates_download(_app: tauri::AppHandle) -> UpdateResponse {
    log::info!("Download requested - use @tauri-apps/plugin-updater JS API for downloads");

    // For actual downloads with progress, use the JavaScript API:
    // import { check } from '@tauri-apps/plugin-updater';
    // const update = await check();
    // await update.downloadAndInstall(progressCallback);

    UpdateResponse {
        success: true,
        error: Some("Use the JavaScript API for downloads: @tauri-apps/plugin-updater".to_string()),
    }
}

/// Install the downloaded update - triggers restart
#[tauri::command]
pub async fn updates_install(app: tauri::AppHandle) -> UpdateResponse {
    log::info!("Restarting to complete update...");

    // Restart the app to apply the update
    app.restart();

    // Note: This code is unreachable as the app restarts above
    #[allow(unreachable_code)]
    UpdateResponse {
        success: true,
        error: None,
    }
}

/// Get current update status
#[tauri::command]
pub async fn updates_get_status() -> GetStatusResponse {
    // Status is tracked via events, return not available as default
    GetStatusResponse {
        success: true,
        status: UpdateStatus::NotAvailable,
    }
}

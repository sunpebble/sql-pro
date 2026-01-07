//! Password storage command handlers
//!
//! Handles password storage using Tauri store for persistence.

use crate::services::password::PasswordService;
use crate::types::password::*;
use std::collections::HashMap;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "passwords.json";
const PASSWORDS_KEY: &str = "passwords";

/// Helper to persist passwords to store
fn persist_passwords(app: &tauri::AppHandle) -> Result<(), String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let passwords = PasswordService::get_all();
    let value = serde_json::to_value(&passwords).map_err(|e| e.to_string())?;
    store.set(PASSWORDS_KEY, value);
    store.save().map_err(|e| e.to_string())?;
    log::info!("Passwords persisted to store");
    Ok(())
}

/// Initialize password service from stored data
pub fn init_password_service(app: &tauri::AppHandle) {
    if let Ok(store) = app.store(STORE_FILE) {
        let passwords: Option<HashMap<String, String>> = store
            .get(PASSWORDS_KEY)
            .and_then(|v| serde_json::from_value(v).ok());
        PasswordService::init(passwords);
    } else {
        PasswordService::init(None);
    }
}

/// Check if password storage is available on this system
#[tauri::command]
pub async fn password_is_available() -> Result<IsPasswordStorageAvailableResponse, String> {
    Ok(IsPasswordStorageAvailableResponse {
        success: true,
        available: PasswordService::is_available(),
    })
}

/// Save a password
#[tauri::command]
pub async fn password_save(
    app: tauri::AppHandle,
    request: SavePasswordRequest,
) -> Result<SavePasswordResponse, String> {
    let identifier = request
        .identifier
        .or(request.db_path)
        .ok_or("No identifier provided")?;

    match PasswordService::save(&identifier, &request.password) {
        Ok(_) => {
            // Persist to store
            if let Err(e) = persist_passwords(&app) {
                log::error!("Failed to persist passwords: {}", e);
            }
            Ok(SavePasswordResponse {
                success: true,
                error: None,
            })
        }
        Err(e) => Ok(SavePasswordResponse {
            success: false,
            error: Some(e),
        }),
    }
}

/// Get a password
#[tauri::command]
pub async fn password_get(request: GetPasswordRequest) -> Result<GetPasswordResponse, String> {
    let identifier = request
        .identifier
        .or(request.db_path)
        .ok_or("No identifier provided")?;

    match PasswordService::get(&identifier) {
        Ok(password) => Ok(GetPasswordResponse {
            success: true,
            password: Some(password),
            error: None,
        }),
        Err(e) => Ok(GetPasswordResponse {
            success: false,
            password: None,
            error: Some(e),
        }),
    }
}

/// Check if a password exists
#[tauri::command]
pub async fn password_has(request: HasPasswordRequest) -> Result<HasPasswordResponse, String> {
    let identifier = request
        .identifier
        .or(request.db_path)
        .ok_or("No identifier provided")?;

    Ok(HasPasswordResponse {
        success: true,
        has_password: PasswordService::has(&identifier),
    })
}

/// Remove a password
#[tauri::command]
pub async fn password_remove(
    app: tauri::AppHandle,
    request: RemovePasswordRequest,
) -> Result<RemovePasswordResponse, String> {
    let identifier = request
        .identifier
        .or(request.db_path)
        .ok_or("No identifier provided")?;

    match PasswordService::remove(&identifier) {
        Ok(_) => {
            // Persist to store
            if let Err(e) = persist_passwords(&app) {
                log::error!("Failed to persist passwords: {}", e);
            }
            Ok(RemovePasswordResponse {
                success: true,
                error: None,
            })
        }
        Err(e) => Ok(RemovePasswordResponse {
            success: false,
            error: Some(e),
        }),
    }
}


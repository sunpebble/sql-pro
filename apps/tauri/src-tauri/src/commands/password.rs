//! Password storage command handlers
//!
//! Handles secure password storage using the system keychain.

use crate::services::password::PasswordService;
use crate::types::password::*;

/// Check if password storage is available on this system
#[tauri::command]
pub async fn password_is_available() -> Result<IsPasswordStorageAvailableResponse, String> {
    Ok(IsPasswordStorageAvailableResponse {
        success: true,
        available: PasswordService::is_available(),
    })
}

/// Save a password to the system keychain
#[tauri::command]
pub async fn password_save(request: SavePasswordRequest) -> Result<SavePasswordResponse, String> {
    let identifier = request.identifier.or(request.db_path).ok_or("No identifier provided")?;
    
    match PasswordService::save(&identifier, &request.password) {
        Ok(_) => Ok(SavePasswordResponse { success: true, error: None }),
        Err(e) => Ok(SavePasswordResponse {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Get a password from the system keychain
#[tauri::command]
pub async fn password_get(request: GetPasswordRequest) -> Result<GetPasswordResponse, String> {
    let identifier = request.identifier.or(request.db_path).ok_or("No identifier provided")?;
    
    match PasswordService::get(&identifier) {
        Ok(password) => Ok(GetPasswordResponse {
            success: true,
            password: Some(password),
            error: None,
        }),
        Err(e) => Ok(GetPasswordResponse {
            success: false,
            password: None,
            error: Some(e.to_string()),
        }),
    }
}

/// Check if a password exists in the system keychain
#[tauri::command]
pub async fn password_has(request: HasPasswordRequest) -> Result<HasPasswordResponse, String> {
    let identifier = request.identifier.or(request.db_path).ok_or("No identifier provided")?;
    
    Ok(HasPasswordResponse {
        success: true,
        has_password: PasswordService::has(&identifier),
    })
}

/// Remove a password from the system keychain
#[tauri::command]
pub async fn password_remove(
    request: RemovePasswordRequest,
) -> Result<RemovePasswordResponse, String> {
    let identifier = request.identifier.or(request.db_path).ok_or("No identifier provided")?;
    
    match PasswordService::remove(&identifier) {
        Ok(_) => Ok(RemovePasswordResponse { success: true, error: None }),
        Err(e) => Ok(RemovePasswordResponse {
            success: false,
            error: Some(e.to_string()),
        }),
    }
}


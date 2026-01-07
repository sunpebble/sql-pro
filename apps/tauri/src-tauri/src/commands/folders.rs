//! Folder commands
//!
//! Handles folder organization for connections

use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;
use uuid::Uuid;

const FOLDERS_STORE_FILE: &str = "folders-store.json";
const FOLDERS_KEY: &str = "folders";

/// Folder structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

/// Request to save a folder
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFolderRequest {
    pub name: Option<String>,
    pub alias: Option<String>,
    pub parent_id: Option<String>,
}

/// Request to update a folder
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderRequest {
    pub id: Option<String>,
    pub path: Option<String>,
    pub name: Option<String>,
    pub alias: Option<String>,
}

/// Request to delete a folder
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteFolderRequest {
    pub id: Option<String>,
    pub path: Option<String>,
}

/// Generic response
#[derive(Debug, Serialize)]
pub struct FoldersResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folders: Option<Vec<Folder>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<Folder>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

fn get_folders(app: &tauri::AppHandle) -> Vec<Folder> {
    let store = match app.store(FOLDERS_STORE_FILE) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    store
        .get(FOLDERS_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default()
}

fn save_folders(app: &tauri::AppHandle, folders: &[Folder]) -> Result<(), String> {
    let store = app.store(FOLDERS_STORE_FILE).map_err(|e| e.to_string())?;
    store.set(FOLDERS_KEY, serde_json::to_value(folders).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())
}

/// Get all folders
#[tauri::command]
pub async fn folders_get(app: tauri::AppHandle) -> FoldersResponse {
    let folders = get_folders(&app);
    FoldersResponse {
        success: true,
        folders: Some(folders),
        folder: None,
        error: None,
    }
}

/// Save a folder
#[tauri::command]
pub async fn folders_save(
    app: tauri::AppHandle,
    request: SaveFolderRequest,
) -> FoldersResponse {
    let folder = Folder {
        id: Uuid::new_v4().to_string(),
        name: request.name.or(request.alias).unwrap_or_else(|| "New Folder".to_string()),
        parent_id: request.parent_id,
    };

    let mut folders = get_folders(&app);
    folders.push(folder.clone());

    if let Err(e) = save_folders(&app, &folders) {
        return FoldersResponse {
            success: false,
            folders: None,
            folder: None,
            error: Some(e),
        };
    }

    FoldersResponse {
        success: true,
        folders: None,
        folder: Some(folder),
        error: None,
    }
}

/// Update a folder
#[tauri::command]
pub async fn folders_update(
    app: tauri::AppHandle,
    request: UpdateFolderRequest,
) -> FoldersResponse {
    let mut folders = get_folders(&app);
    
    let folder_id = request.id.or(request.path).unwrap_or_default();
    let folder_idx = folders.iter().position(|f| f.id == folder_id);
    
    if let Some(idx) = folder_idx {
        if let Some(name) = request.name.or(request.alias) {
            folders[idx].name = name;
        }

        let folder = folders[idx].clone();

        if let Err(e) = save_folders(&app, &folders) {
            return FoldersResponse {
                success: false,
                folders: None,
                folder: None,
                error: Some(e),
            };
        }

        return FoldersResponse {
            success: true,
            folders: None,
            folder: Some(folder),
            error: None,
        };
    }

    FoldersResponse {
        success: false,
        folders: None,
        folder: None,
        error: Some("Folder not found".to_string()),
    }
}

/// Delete a folder
#[tauri::command]
pub async fn folders_delete(
    app: tauri::AppHandle,
    request: DeleteFolderRequest,
) -> FoldersResponse {
    let folder_id = request.id.or(request.path).unwrap_or_default();
    let mut folders = get_folders(&app);
    folders.retain(|f| f.id != folder_id);

    if let Err(e) = save_folders(&app, &folders) {
        return FoldersResponse {
            success: false,
            folders: None,
            folder: None,
            error: Some(e),
        };
    }

    FoldersResponse {
        success: true,
        folders: None,
        folder: None,
        error: None,
    }
}


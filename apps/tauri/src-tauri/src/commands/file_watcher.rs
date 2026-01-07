//! File watcher command handlers
//!
//! Provides commands to manage database file watching.

use crate::services::file_watcher::FILE_WATCHER;
use serde::{Deserialize, Serialize};

/// Request to start watching a file
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchFileRequest {
    pub connection_id: String,
    pub db_path: String,
}

/// Request to stop watching a file
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnwatchFileRequest {
    pub connection_id: String,
}

/// Request to ignore file changes temporarily
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IgnoreChangesRequest {
    pub db_path: String,
    #[serde(default = "default_duration")]
    pub duration_ms: u64,
}

fn default_duration() -> u64 {
    1000
}

/// Response for file watcher operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileWatcherResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Start watching a database file
#[tauri::command]
pub async fn file_watcher_watch(request: WatchFileRequest) -> FileWatcherResponse {
    match FILE_WATCHER.watch(&request.connection_id, &request.db_path) {
        Ok(()) => FileWatcherResponse {
            success: true,
            error: None,
        },
        Err(e) => FileWatcherResponse {
            success: false,
            error: Some(e),
        },
    }
}

/// Stop watching a database file
#[tauri::command]
pub async fn file_watcher_unwatch(request: UnwatchFileRequest) -> FileWatcherResponse {
    match FILE_WATCHER.unwatch(&request.connection_id) {
        Ok(()) => FileWatcherResponse {
            success: true,
            error: None,
        },
        Err(e) => FileWatcherResponse {
            success: false,
            error: Some(e),
        },
    }
}

/// Temporarily ignore changes to a file (for our own writes)
#[tauri::command]
pub async fn file_watcher_ignore(request: IgnoreChangesRequest) -> FileWatcherResponse {
    FILE_WATCHER.ignore_changes(&request.db_path, request.duration_ms);
    FileWatcherResponse {
        success: true,
        error: None,
    }
}


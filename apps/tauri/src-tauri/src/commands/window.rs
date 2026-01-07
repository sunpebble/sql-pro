//! Window command handlers
//!
//! Handles window management operations.

use serde::{Deserialize, Serialize};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWindowResponse {
    pub success: bool,
    pub window_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseWindowRequest {
    pub window_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseWindowResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAllWindowsResponse {
    pub success: bool,
    pub window_ids: Option<Vec<String>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCurrentWindowResponse {
    pub success: bool,
    pub window_id: Option<String>,
    pub error: Option<String>,
}

/// Create a new window
#[tauri::command]
pub async fn window_create(app: tauri::AppHandle) -> Result<CreateWindowResponse, String> {
    let window_id = format!("window_{}", uuid::Uuid::new_v4());
    
    match WebviewWindowBuilder::new(&app, &window_id, WebviewUrl::App("index.html".into()))
        .title("SQL Pro")
        .inner_size(1200.0, 800.0)
        .min_inner_size(900.0, 600.0)
        .resizable(true)
        .center()
        .decorations(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .build()
    {
        Ok(_) => Ok(CreateWindowResponse {
            success: true,
            window_id: Some(window_id),
            error: None,
        }),
        Err(e) => Ok(CreateWindowResponse {
            success: false,
            window_id: None,
            error: Some(e.to_string()),
        }),
    }
}

/// Close a window
#[tauri::command]
pub async fn window_close(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    request: Option<CloseWindowRequest>,
) -> Result<CloseWindowResponse, String> {
    let window_to_close = if let Some(req) = request {
        if let Some(id) = req.window_id {
            app.get_webview_window(&id)
        } else {
            Some(window)
        }
    } else {
        Some(window)
    };

    match window_to_close {
        Some(w) => match w.close() {
            Ok(_) => Ok(CloseWindowResponse {
                success: true,
                error: None,
            }),
            Err(e) => Ok(CloseWindowResponse {
                success: false,
                error: Some(e.to_string()),
            }),
        },
        None => Ok(CloseWindowResponse {
            success: false,
            error: Some("Window not found".to_string()),
        }),
    }
}

/// Get all window IDs
#[tauri::command]
pub async fn window_get_all(app: tauri::AppHandle) -> Result<GetAllWindowsResponse, String> {
    let windows: Vec<String> = app
        .webview_windows()
        .keys()
        .map(|k| k.to_string())
        .collect();

    Ok(GetAllWindowsResponse {
        success: true,
        window_ids: Some(windows),
        error: None,
    })
}

/// Get the current window ID
#[tauri::command]
pub async fn window_get_current(window: tauri::WebviewWindow) -> Result<GetCurrentWindowResponse, String> {
    Ok(GetCurrentWindowResponse {
        success: true,
        window_id: Some(window.label().to_string()),
        error: None,
    })
}


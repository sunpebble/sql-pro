//! Menu command handlers
//!
//! Handles dynamic menu updates including shortcut changes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::AppHandle;

/// Shortcut preset mapping action names to key bindings
pub type ShortcutPreset = HashMap<String, String>;

/// Request to update menu shortcuts
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateShortcutsRequest {
    pub shortcuts: ShortcutPreset,
}

/// Response for menu operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Get accelerator for a shortcut action from the preset
fn get_accelerator<'a>(shortcuts: &'a ShortcutPreset, action: &str) -> Option<&'a str> {
    shortcuts.get(action).and_then(|s| {
        if s.is_empty() {
            None
        } else {
            Some(s.as_str())
        }
    })
}

/// Create the application menu with the given shortcuts
fn create_menu_with_shortcuts(
    app: &AppHandle,
    shortcuts: &ShortcutPreset,
) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let menu = Menu::new(app)?;

    // Helper macro for getting accelerators
    macro_rules! accel {
        ($action:expr) => {
            get_accelerator(shortcuts, $action)
        };
    }

    // File menu
    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(
                app,
                "open_database",
                "Open Database...",
                true,
                accel!("action.open-database"),
            )?,
            &MenuItem::with_id(
                app,
                "close_database",
                "Close Database",
                true,
                Some("CmdOrCtrl+W"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "new_window",
                "New Window",
                true,
                accel!("action.new-window"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "export_data",
                "Export Data...",
                true,
                Some("CmdOrCtrl+Shift+E"),
            )?,
            &MenuItem::with_id(app, "import_data", "Import Data...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quit SQL Pro"))?,
        ],
    )?;

    // Edit menu
    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )?;

    // View menu
    let view_menu = Submenu::with_items(
        app,
        "View",
        true,
        &[
            &MenuItem::with_id(
                app,
                "data_browser",
                "Data Browser",
                true,
                accel!("nav.data-browser"),
            )?,
            &MenuItem::with_id(
                app,
                "query_editor",
                "Query Editor",
                true,
                accel!("nav.query-editor"),
            )?,
            &MenuItem::with_id(app, "er_diagram", "ER Diagram", true, Some("CmdOrCtrl+3"))?,
            &MenuItem::with_id(
                app,
                "schema_compare",
                "Schema Compare",
                true,
                accel!("nav.schema-compare"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "toggle_sidebar",
                "Toggle Sidebar",
                true,
                Some("CmdOrCtrl+B"),
            )?,
            &MenuItem::with_id(
                app,
                "toggle_history",
                "Toggle History",
                true,
                accel!("view.toggle-history"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "refresh_schema",
                "Refresh Schema",
                true,
                accel!("action.refresh-schema"),
            )?,
        ],
    )?;

    // Query menu
    let query_menu = Submenu::with_items(
        app,
        "Query",
        true,
        &[
            &MenuItem::with_id(
                app,
                "execute_query",
                "Execute Query",
                true,
                accel!("action.execute-query"),
            )?,
            &MenuItem::with_id(
                app,
                "format_query",
                "Format Query",
                true,
                Some("CmdOrCtrl+Shift+F"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "explain_query", "Explain Query", true, None::<&str>)?,
        ],
    )?;

    // Window menu
    let window_menu = Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;

    // Help menu
    let help_menu = Submenu::with_items(
        app,
        "Help",
        true,
        &[
            &MenuItem::with_id(app, "documentation", "Documentation", true, None::<&str>)?,
            &MenuItem::with_id(
                app,
                "keyboard_shortcuts",
                "Keyboard Shortcuts",
                true,
                Some("CmdOrCtrl+/"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "check_updates",
                "Check for Updates...",
                true,
                None::<&str>,
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "about", "About SQL Pro", true, None::<&str>)?,
        ],
    )?;

    // Add all menus
    menu.append(&file_menu)?;
    menu.append(&edit_menu)?;
    menu.append(&view_menu)?;
    menu.append(&query_menu)?;
    menu.append(&window_menu)?;
    menu.append(&help_menu)?;

    Ok(menu)
}

/// Update menu shortcuts
#[tauri::command]
pub async fn menu_update_shortcuts(
    app: AppHandle,
    request: UpdateShortcutsRequest,
) -> MenuResponse {
    log::info!("Updating menu shortcuts...");

    match create_menu_with_shortcuts(&app, &request.shortcuts) {
        Ok(menu) => {
            if let Err(e) = app.set_menu(menu) {
                log::error!("Failed to set menu: {}", e);
                return MenuResponse {
                    success: false,
                    error: Some(format!("Failed to set menu: {}", e)),
                };
            }

            log::info!("Menu shortcuts updated successfully");
            MenuResponse {
                success: true,
                error: None,
            }
        }
        Err(e) => {
            log::error!("Failed to create menu: {}", e);
            MenuResponse {
                success: false,
                error: Some(format!("Failed to create menu: {}", e)),
            }
        }
    }
}


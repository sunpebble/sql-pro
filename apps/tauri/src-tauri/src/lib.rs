//! SQL Pro - Professional SQLite database manager
//!
//! This is the main library for the SQL Pro Tauri application.
//! It provides database management capabilities with support for:
//! - SQLite and SQLCipher databases
//! - MySQL and PostgreSQL (planned)
//! - AI-powered query assistance
//! - Plugin system

pub mod commands;
pub mod services;
pub mod types;

use commands::sql_log::SqlLogger;
use services::database::DatabaseManager;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter, Manager,
};

// Note: tauri_plugin_updater::UpdaterExt is used via the updater commands

/// Create the application menu
fn create_menu(app: &tauri::AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let menu = Menu::new(app)?;

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
                Some("CmdOrCtrl+O"),
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
                Some("CmdOrCtrl+Shift+N"),
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
                Some("CmdOrCtrl+1"),
            )?,
            &MenuItem::with_id(
                app,
                "query_editor",
                "Query Editor",
                true,
                Some("CmdOrCtrl+2"),
            )?,
            &MenuItem::with_id(app, "er_diagram", "ER Diagram", true, Some("CmdOrCtrl+3"))?,
            &MenuItem::with_id(
                app,
                "schema_compare",
                "Schema Compare",
                true,
                Some("CmdOrCtrl+4"),
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
                Some("CmdOrCtrl+H"),
            )?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                "refresh_schema",
                "Refresh Schema",
                true,
                Some("CmdOrCtrl+Shift+R"),
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
                Some("CmdOrCtrl+Enter"),
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

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::init();

    tauri::Builder::default()
        // Register plugins
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        // Updater plugin - requires proper signing for production builds
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Initialize application state
        .setup(|app| {
            // Initialize the database manager
            // Initialize the SQL logger (shared between DatabaseManager and Tauri state)
            let sql_logger = Arc::new(SqlLogger::new());
            app.manage(sql_logger.clone());

            // Initialize database manager with shared logger
            let database_manager = DatabaseManager::new(sql_logger);
            database_manager.set_app_handle(app.handle().clone());
            app.manage(database_manager);

            // Initialize password service from stored data
            commands::password::init_password_service(app.handle());

            // Initialize file watcher service
            services::file_watcher::init_file_watcher(app.handle());

            // Create and set the application menu
            let menu = create_menu(app.handle())?;
            app.set_menu(menu)?;

            // Log startup
            log::info!("SQL Pro started successfully");

            Ok(())
        })
        // Handle menu events
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            log::info!("Menu event: {}", id);

            // Emit event to frontend for handling
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit("menu-action", id);
            }
        })
        // Register commands
        .invoke_handler(tauri::generate_handler![
            // Database commands
            commands::database::db_open,
            commands::database::db_close,
            commands::database::db_get_schema,
            commands::database::db_get_schema_list,
            commands::database::db_get_table_details,
            commands::database::db_get_table_data,
            commands::database::db_execute_query,
            commands::database::db_validate_changes,
            commands::database::db_apply_changes,
            commands::database::db_analyze_plan,
            commands::database::db_test_connection,
            commands::database::db_change_password,
            // Store commands
            commands::store::store_get_preferences,
            commands::store::store_set_preferences,
            commands::store::store_get_recent_connections,
            commands::store::store_save_recent_connection,
            commands::store::store_remove_recent_connection,
            // Renderer store commands
            commands::renderer_store::renderer_store_get,
            commands::renderer_store::renderer_store_set,
            commands::renderer_store::renderer_store_update,
            commands::renderer_store::renderer_store_delete,
            commands::renderer_store::renderer_store_reset,
            // Password commands
            commands::password::password_is_available,
            commands::password::password_save,
            commands::password::password_get,
            commands::password::password_has,
            commands::password::password_remove,
            // History commands
            commands::history::history_get,
            commands::history::history_save,
            commands::history::history_delete,
            commands::history::history_clear,
            // Export commands
            commands::export::export_data,
            commands::export::export_schema,
            // Import commands
            commands::import::import_bundle,
            commands::import::import_schema,
            // Window commands
            commands::window::window_create,
            commands::window::window_close,
            commands::window::window_get_all,
            commands::window::window_get_current,
            // AI commands
            commands::ai::ai_get_settings,
            commands::ai::ai_save_settings,
            commands::ai::ai_fetch_completion,
            // Schema commands
            commands::schema::schema_get_snapshots,
            commands::schema::schema_get_snapshot,
            commands::schema::schema_save_snapshot,
            commands::schema::schema_delete_snapshot,
            commands::schema::schema_compare_snapshots,
            commands::schema::schema_compare_connections,
            commands::schema::schema_compare_connection_to_snapshot,
            commands::schema::table_compare,
            commands::schema::migration_generate_sql,
            commands::schema::migration_generate_sync_sql,
            // Profile commands
            commands::profiles::profiles_get,
            commands::profiles::profiles_save,
            commands::profiles::profiles_update,
            commands::profiles::profiles_delete,
            commands::profiles::connection_update,
            commands::profiles::connection_remove,
            // Folder commands
            commands::folders::folders_get,
            commands::folders::folders_save,
            commands::folders::folders_update,
            commands::folders::folders_delete,
            // SQL Log commands
            commands::sql_log::sql_log_get,
            commands::sql_log::sql_log_clear,
            // System commands
            commands::system::system_focus_window,
            commands::system::check_unsaved_changes,
            commands::system::memory_get_stats,
            commands::system::memory_subscribe,
            commands::system::memory_unsubscribe,
            commands::system::memory_trigger_gc,
            // Font commands
            commands::fonts::get_system_fonts,
            // Updater commands
            commands::updater::updates_check,
            commands::updater::updates_download,
            commands::updater::updates_install,
            commands::updater::updates_get_status,
            // File watcher commands
            commands::file_watcher::file_watcher_watch,
            commands::file_watcher::file_watcher_unwatch,
            commands::file_watcher::file_watcher_ignore,
            // Menu commands
            commands::menu::menu_update_shortcuts,
            // Pro license commands
            commands::pro::pro_activate,
            commands::pro::pro_get_status,
            commands::pro::pro_clear_status,
            // File commands
            commands::file::file_write,
            commands::file::file_read,
            // Plugin commands
            commands::plugins::plugins_list,
            commands::plugins::plugins_get,
            commands::plugins::plugins_install,
            commands::plugins::plugins_uninstall,
            commands::plugins::plugins_enable,
            commands::plugins::plugins_disable,
            commands::plugins::plugins_get_data,
            commands::plugins::plugins_set_data,
            commands::plugins::plugins_clear_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

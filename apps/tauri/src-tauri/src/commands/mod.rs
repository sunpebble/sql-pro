//! Tauri command handlers
//!
//! This module contains all the command handlers that can be invoked
//! from the frontend via Tauri's invoke system.

pub mod ai;
pub mod database;
pub mod export;
pub mod file;
pub mod file_watcher;
pub mod folders;
pub mod menu;
pub mod fonts;
pub mod history;
pub mod import;
pub mod password;
pub mod plugins;
pub mod pro;
pub mod profiles;
pub mod renderer_store;
pub mod schema;
pub mod sql_log;
pub mod store;
pub mod system;
pub mod updater;
pub mod window;

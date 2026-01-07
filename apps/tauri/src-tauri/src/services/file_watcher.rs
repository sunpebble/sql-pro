//! File watcher service
//!
//! Watches SQLite database files for external changes and notifies the frontend
//! so that the schema and data can be reloaded.

use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// File change event sent to the frontend
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChangeEvent {
    pub connection_id: String,
    pub db_path: String,
    pub event_type: String, // "change" or "rename"
}

/// Internal state for the file watcher
struct WatcherState {
    /// Map of connection ID to file path
    watched_files: HashMap<String, PathBuf>,
    /// Reverse map of file path to connection IDs (multiple connections can share a file)
    path_to_connections: HashMap<PathBuf, HashSet<String>>,
    /// Set of paths to temporarily ignore (for our own writes)
    ignored_paths: HashSet<PathBuf>,
    /// Debounce timers - tracks last event time per connection
    last_event_times: HashMap<String, std::time::Instant>,
}

/// File watcher service
pub struct FileWatcherService {
    state: Arc<Mutex<WatcherState>>,
    watcher: Arc<Mutex<Option<RecommendedWatcher>>>,
    app_handle: Arc<Mutex<Option<AppHandle>>>,
}

impl Default for FileWatcherService {
    fn default() -> Self {
        Self::new()
    }
}

impl FileWatcherService {
    /// Create a new file watcher service
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(WatcherState {
                watched_files: HashMap::new(),
                path_to_connections: HashMap::new(),
                ignored_paths: HashSet::new(),
                last_event_times: HashMap::new(),
            })),
            watcher: Arc::new(Mutex::new(None)),
            app_handle: Arc::new(Mutex::new(None)),
        }
    }

    /// Set the app handle for emitting events
    pub fn set_app_handle(&self, handle: AppHandle) {
        let mut app_handle = self.app_handle.lock().unwrap();
        *app_handle = Some(handle);
    }

    /// Initialize the watcher with a channel for events
    pub fn init(&self) -> Result<(), String> {
        let state = self.state.clone();
        let app_handle = self.app_handle.clone();

        // Create a standard library channel for notify events
        let (tx, rx) = mpsc::channel::<notify::Result<Event>>();

        // Create the watcher
        let watcher = RecommendedWatcher::new(
            move |res: notify::Result<Event>| {
                let _ = tx.send(res);
            },
            Config::default().with_poll_interval(Duration::from_millis(500)),
        )
        .map_err(|e| format!("Failed to create file watcher: {}", e))?;

        // Store the watcher
        {
            let mut watcher_guard = self.watcher.lock().unwrap();
            *watcher_guard = Some(watcher);
        }

        // Spawn a standard thread to handle events
        thread::spawn(move || {
            let debounce_duration = Duration::from_millis(500);

            // Process events from the channel
            while let Ok(result) = rx.recv() {
                match result {
                    Ok(event) => {
                        // Get paths from the event
                        for path in event.paths {
                            let state_guard = state.lock().unwrap();

                            // Check if this path is being ignored
                            if state_guard.ignored_paths.contains(&path) {
                                continue;
                            }

                            // For WAL/SHM/Journal files, convert to the main db path for lookup
                            let lookup_path = if let Some(path_str) = path.to_str() {
                                if path_str.ends_with("-wal") || path_str.ends_with("-shm") || path_str.ends_with("-journal") {
                                    // Strip the -wal, -shm, or -journal suffix
                                    let main_path = path_str
                                        .trim_end_matches("-wal")
                                        .trim_end_matches("-shm")
                                        .trim_end_matches("-journal");
                                    PathBuf::from(main_path)
                                } else {
                                    path.clone()
                                }
                            } else {
                                path.clone()
                            };

                            // Find connections watching this path
                            if let Some(connection_ids) =
                                state_guard.path_to_connections.get(&lookup_path)
                            {
                                let event_type = match event.kind {
                                    notify::EventKind::Modify(_) => "change",
                                    notify::EventKind::Remove(_) => "rename",
                                    notify::EventKind::Create(_) => "change",
                                    _ => continue,
                                };

                                // Clone what we need before dropping the lock
                                let connections: Vec<String> =
                                    connection_ids.iter().cloned().collect();
                                let path_str = path.to_string_lossy().to_string();
                                drop(state_guard);

                                // Check debounce for each connection
                                for connection_id in connections {
                                    let should_notify = {
                                        let mut state_guard = state.lock().unwrap();
                                        let now = std::time::Instant::now();
                                        let last_time = state_guard
                                            .last_event_times
                                            .get(&connection_id)
                                            .copied();

                                        let should_notify = match last_time {
                                            Some(last) => {
                                                now.duration_since(last) > debounce_duration
                                            }
                                            None => true,
                                        };

                                        if should_notify {
                                            state_guard
                                                .last_event_times
                                                .insert(connection_id.clone(), now);
                                        }
                                        should_notify
                                    };

                                    if should_notify {
                                        // Emit event to frontend
                                        if let Some(handle) =
                                            app_handle.lock().unwrap().as_ref()
                                        {
                                            let file_event = FileChangeEvent {
                                                connection_id: connection_id.clone(),
                                                db_path: path_str.clone(),
                                                event_type: event_type.to_string(),
                                            };
                                            // Use emit_to to send to the main webview window
                                            let _ = handle.emit_to("main", "db-file-changed", file_event);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        log::warn!("File watcher error: {:?}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Start watching a database file
    pub fn watch(&self, connection_id: &str, db_path: &str) -> Result<(), String> {
        let path = PathBuf::from(db_path);
        
        // Also watch WAL, SHM, and Journal files for SQLite databases
        let wal_path = PathBuf::from(format!("{}-wal", db_path));
        let shm_path = PathBuf::from(format!("{}-shm", db_path));
        let journal_path = PathBuf::from(format!("{}-journal", db_path));

        // Add to state
        {
            let mut state = self.state.lock().unwrap();

            // Check if already watching this connection
            if state.watched_files.contains_key(connection_id) {
                return Ok(());
            }

            // Add to watched files (main db path)
            state
                .watched_files
                .insert(connection_id.to_string(), path.clone());

            // Add to path_to_connections for all related paths
            for p in [&path, &wal_path, &shm_path, &journal_path] {
                state
                    .path_to_connections
                    .entry(p.clone())
                    .or_default()
                    .insert(connection_id.to_string());
            }
        }

        // Add paths to watcher - watch the parent directory to catch all changes
        {
            let mut watcher_guard = self.watcher.lock().unwrap();
            if let Some(watcher) = watcher_guard.as_mut() {
                // Watch the main db file
                watcher
                    .watch(&path, RecursiveMode::NonRecursive)
                    .map_err(|e| format!("Failed to watch file: {}", e))?;
                
                // Also watch the parent directory to catch WAL/SHM file changes
                if let Some(parent) = path.parent() {
                    let _ = watcher.watch(parent, RecursiveMode::NonRecursive);
                }
            }
        }

        log::info!(
            "Started watching: {} for connection {}",
            db_path,
            connection_id
        );
        Ok(())
    }

    /// Stop watching a database file
    pub fn unwatch(&self, connection_id: &str) -> Result<(), String> {
        let path_to_unwatch: Option<PathBuf>;
        let should_remove_watch: bool;

        // Update state
        {
            let mut state = self.state.lock().unwrap();

            // Get the path for this connection
            path_to_unwatch = state.watched_files.remove(connection_id);

            if let Some(ref path) = path_to_unwatch {
                // Remove from path_to_connections
                if let Some(connections) = state.path_to_connections.get_mut(path) {
                    connections.remove(connection_id);

                    // If no more connections are watching this path, remove it
                    should_remove_watch = connections.is_empty();
                    if should_remove_watch {
                        state.path_to_connections.remove(path);
                    }
                } else {
                    should_remove_watch = false;
                }

                // Remove from last_event_times
                state.last_event_times.remove(connection_id);
            } else {
                should_remove_watch = false;
            }
        }

        // Remove from watcher if no more connections are watching this path
        if should_remove_watch {
            if let Some(ref path) = path_to_unwatch {
                let mut watcher_guard = self.watcher.lock().unwrap();
                if let Some(watcher) = watcher_guard.as_mut() {
                    let _ = watcher.unwatch(path);
                }
            }
        }

        if let Some(path) = path_to_unwatch {
            log::info!(
                "Stopped watching: {} for connection {}",
                path.display(),
                connection_id
            );
        }

        Ok(())
    }

    /// Temporarily ignore changes to a database file (for our own writes)
    pub fn ignore_changes(&self, db_path: &str, duration_ms: u64) {
        let path = PathBuf::from(db_path);
        let state = self.state.clone();

        // Add to ignored paths
        {
            let mut state_guard = state.lock().unwrap();
            state_guard.ignored_paths.insert(path.clone());
        }

        // Remove from ignored paths after duration using a standard thread
        thread::spawn(move || {
            thread::sleep(Duration::from_millis(duration_ms));
            let mut state_guard = state.lock().unwrap();
            state_guard.ignored_paths.remove(&path);
        });
    }

    /// Stop watching all files
    pub fn unwatch_all(&self) {
        let mut state = self.state.lock().unwrap();
        state.watched_files.clear();
        state.path_to_connections.clear();
        state.ignored_paths.clear();
        state.last_event_times.clear();

        // Clear the watcher
        let mut watcher_guard = self.watcher.lock().unwrap();
        *watcher_guard = None;
    }
}

// Lazy static for global file watcher service
lazy_static::lazy_static! {
    pub static ref FILE_WATCHER: FileWatcherService = FileWatcherService::new();
}

/// Initialize the file watcher service
pub fn init_file_watcher(app: &AppHandle) {
    FILE_WATCHER.set_app_handle(app.clone());
    if let Err(e) = FILE_WATCHER.init() {
        log::error!("Failed to initialize file watcher: {}", e);
    }
}

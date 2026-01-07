//! System commands
//!
//! Handles system-level operations like window focus and memory stats

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{atomic::{AtomicU64, Ordering}, Arc, Mutex};
use std::time::Duration;
use tauri::{Emitter, Manager};
use tokio::sync::oneshot;

// Memory subscription tracking
static SUBSCRIPTION_COUNTER: AtomicU64 = AtomicU64::new(0);

lazy_static::lazy_static! {
    static ref ACTIVE_SUBSCRIPTIONS: Arc<Mutex<HashMap<String, oneshot::Sender<()>>>> = 
        Arc::new(Mutex::new(HashMap::new()));
}

/// Request to focus a window
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusWindowRequest {
    pub window_id: Option<String>,
}

/// Request to check unsaved changes
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckUnsavedChangesRequest {
    pub connection_id: Option<String>,
}

/// System response
#[derive(Debug, Serialize)]
pub struct SystemResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub has_changes: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Memory stats response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryStatsResponse {
    pub success: bool,
    pub stats: MemoryStats,
}

/// Process memory usage
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessMemory {
    pub rss: u64,
    pub heap_total: u64,
    pub heap_used: u64,
    pub external: u64,
    pub array_buffers: u64,
}

/// Heap statistics
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HeapStats {
    pub total_heap_size: u64,
    pub total_heap_size_executable: u64,
    pub total_physical_size: u64,
    pub total_available_size: u64,
    pub used_heap_size: u64,
    pub heap_size_limit: u64,
    pub malloced_memory: u64,
    pub peak_malloced_memory: u64,
    pub number_of_native_contexts: u64,
    pub number_of_detached_contexts: u64,
    pub does_zap_garbage: u64,
    pub external_memory: u64,
}

/// Calculated metrics
#[derive(Debug, Clone, Serialize)]
pub struct MemoryMetrics {
    #[serde(rename = "heapUsagePercent")]
    pub heap_usage_percent: f64,
    #[serde(rename = "totalMemoryMB")]
    pub total_memory_mb: f64,
    #[serde(rename = "usedHeapMB")]
    pub used_heap_mb: f64,
    #[serde(rename = "availableHeapMB")]
    pub available_heap_mb: f64,
}

/// Full memory stats matching Electron's structure
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryStats {
    pub process: ProcessMemory,
    pub heap: HeapStats,
    pub metrics: MemoryMetrics,
    pub timestamp: u64,
}

/// Focus a window
#[tauri::command]
pub async fn system_focus_window(
    app: tauri::AppHandle,
    request: FocusWindowRequest,
) -> SystemResponse {
    let window_label = request.window_id.as_deref().unwrap_or("main");
    
    if let Some(window) = app.get_webview_window(window_label) {
        if let Err(e) = window.set_focus() {
            return SystemResponse {
                success: false,
                has_changes: None,
                error: Some(format!("Failed to focus window: {}", e)),
            };
        }
        SystemResponse {
            success: true,
            has_changes: None,
            error: None,
        }
    } else {
        SystemResponse {
            success: false,
            has_changes: None,
            error: Some("Window not found".to_string()),
        }
    }
}

/// Check for unsaved changes (frontend-managed in Tauri)
#[tauri::command]
pub async fn check_unsaved_changes(
    _request: CheckUnsavedChangesRequest,
) -> SystemResponse {
    // In Tauri, unsaved changes are tracked in the frontend
    // This is a placeholder that always returns no changes
    SystemResponse {
        success: true,
        has_changes: Some(false),
        error: None,
    }
}

/// Memory subscribe request
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySubscribeRequest {
    pub interval_ms: Option<u64>,
}

/// Memory subscribe response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySubscribeResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subscription_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Memory unsubscribe request
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryUnsubscribeRequest {
    pub subscription_id: String,
}

/// Memory trigger GC request
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryTriggerGCRequest {
    pub aggressive: Option<bool>,
}

/// Memory stats update event
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryStatsUpdateEvent {
    pub stats: MemoryStats,
    pub pressure_level: String,
}

/// Memory pressure change event
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryPressureChangeEvent {
    pub previous_level: String,
    pub current_level: String,
}

/// Get process memory usage on macOS
#[cfg(target_os = "macos")]
#[allow(deprecated)]
fn get_process_memory() -> (u64, u64) {
    use std::mem::MaybeUninit;

    // Use mach task_info to get memory usage
    // Note: mach_task_self is deprecated but still functional
    unsafe {
        let task = libc::mach_task_self();
        let mut info: MaybeUninit<libc::mach_task_basic_info> = MaybeUninit::uninit();
        let mut count = (std::mem::size_of::<libc::mach_task_basic_info>() / std::mem::size_of::<libc::natural_t>()) as u32;
        
        let result = libc::task_info(
            task,
            libc::MACH_TASK_BASIC_INFO,
            info.as_mut_ptr() as *mut i32,
            &mut count,
        );
        
        if result == libc::KERN_SUCCESS {
            let info = info.assume_init();
            // resident_size is in bytes
            return (info.resident_size as u64, info.virtual_size as u64);
        }
    }
    (0, 0)
}

/// Get process memory usage on Linux
#[cfg(target_os = "linux")]
fn get_process_memory() -> (u64, u64) {
    // Read from /proc/self/statm
    if let Ok(content) = std::fs::read_to_string("/proc/self/statm") {
        let parts: Vec<&str> = content.split_whitespace().collect();
        if parts.len() >= 2 {
            let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) as u64 };
            let virt_pages: u64 = parts[0].parse().unwrap_or(0);
            let rss_pages: u64 = parts[1].parse().unwrap_or(0);
            return (rss_pages * page_size, virt_pages * page_size);
        }
    }
    (0, 0)
}

/// Get process memory usage on Windows
#[cfg(target_os = "windows")]
fn get_process_memory() -> (u64, u64) {
    // Windows implementation - return zeros for now
    // Would need windows-sys crate for GetProcessMemoryInfo
    (0, 0)
}

/// Get current memory statistics
fn get_current_memory_stats() -> MemoryStats {
    // Get process-specific memory (not system-wide)
    let (rss, virtual_size) = get_process_memory();
    
    // Get system memory info for calculating available memory
    let (_system_total, system_available) = if let Ok(info) = sys_info::mem_info() {
        (info.total * 1024, info.avail * 1024) // Convert KB to bytes
    } else {
        (0, 0)
    };
    
    // For a native app, heap is essentially the RSS
    let heap_used = rss;
    let heap_total = virtual_size.max(rss);
    let heap_available = system_available; // Available system memory
    
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    
    // Calculate metrics - use reasonable limits for percentage
    // Assume 2GB as a reasonable heap limit for calculating percentage
    let heap_limit = 2 * 1024 * 1024 * 1024_u64; // 2GB
    let heap_usage_percent = if heap_limit > 0 {
        (heap_used as f64 / heap_limit as f64) * 100.0
    } else {
        0.0
    };
    
    let total_memory_mb = rss as f64 / (1024.0 * 1024.0);
    let used_heap_mb = heap_used as f64 / (1024.0 * 1024.0);
    let available_heap_mb = (heap_limit.saturating_sub(heap_used)) as f64 / (1024.0 * 1024.0);
    
    MemoryStats {
        process: ProcessMemory {
            rss,
            heap_total,
            heap_used,
            external: 0,
            array_buffers: 0,
        },
        heap: HeapStats {
            total_heap_size: heap_total,
            total_heap_size_executable: 0,
            total_physical_size: rss,
            total_available_size: heap_available,
            used_heap_size: heap_used,
            heap_size_limit: heap_limit,
            malloced_memory: 0,
            peak_malloced_memory: 0,
            number_of_native_contexts: 0,
            number_of_detached_contexts: 0,
            does_zap_garbage: 0,
            external_memory: 0,
        },
        metrics: MemoryMetrics {
            heap_usage_percent,
            total_memory_mb,
            used_heap_mb,
            available_heap_mb,
        },
        timestamp,
    }
}

/// Determine pressure level from memory stats
fn get_pressure_level(stats: &MemoryStats) -> String {
    let usage_percent = stats.metrics.heap_usage_percent;
    
    if usage_percent > 90.0 {
        "critical".to_string()
    } else if usage_percent > 70.0 {
        "warning".to_string()
    } else {
        "normal".to_string()
    }
}

/// Get memory statistics
#[tauri::command]
pub async fn memory_get_stats() -> MemoryStatsResponse {
    MemoryStatsResponse {
        success: true,
        stats: get_current_memory_stats(),
    }
}

/// Subscribe to memory updates
#[tauri::command]
pub async fn memory_subscribe(
    app: tauri::AppHandle,
    request: MemorySubscribeRequest,
) -> MemorySubscribeResponse {
    let interval_ms = request.interval_ms.unwrap_or(5000);
    let subscription_id = format!("mem-sub-{}", SUBSCRIPTION_COUNTER.fetch_add(1, Ordering::SeqCst));
    
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();
    
    // Store the shutdown sender
    {
        let mut subs = ACTIVE_SUBSCRIPTIONS.lock().unwrap();
        subs.insert(subscription_id.clone(), shutdown_tx);
    }
    
    let sub_id = subscription_id.clone();
    let app_handle = app.clone();
    
    // Spawn a background task to emit memory stats
    tokio::spawn(async move {
        let mut last_pressure_level = "normal".to_string();
        
        loop {
            tokio::select! {
                _ = tokio::time::sleep(Duration::from_millis(interval_ms)) => {
                    let stats = get_current_memory_stats();
                    let pressure_level = get_pressure_level(&stats);
                    
                    // Emit stats update
                    let _ = app_handle.emit("memory-stats-update", MemoryStatsUpdateEvent {
                        stats: stats.clone(),
                        pressure_level: pressure_level.clone(),
                    });
                    
                    // Emit pressure change if level changed
                    if pressure_level != last_pressure_level {
                        let _ = app_handle.emit("memory-pressure-change", MemoryPressureChangeEvent {
                            previous_level: last_pressure_level.clone(),
                            current_level: pressure_level.clone(),
                        });
                        last_pressure_level = pressure_level;
                    }
                }
                _ = &mut shutdown_rx => {
                    // Subscription cancelled
                    break;
                }
            }
        }
        
        // Clean up subscription
        let mut subs = ACTIVE_SUBSCRIPTIONS.lock().unwrap();
        subs.remove(&sub_id);
    });
    
    MemorySubscribeResponse {
        success: true,
        subscription_id: Some(subscription_id),
        error: None,
    }
}

/// Unsubscribe from memory updates
#[tauri::command]
pub async fn memory_unsubscribe(
    request: MemoryUnsubscribeRequest,
) -> SystemResponse {
    let mut subs = ACTIVE_SUBSCRIPTIONS.lock().unwrap();
    
    if let Some(shutdown_tx) = subs.remove(&request.subscription_id) {
        let _ = shutdown_tx.send(());
        SystemResponse {
            success: true,
            has_changes: None,
            error: None,
        }
    } else {
        SystemResponse {
            success: false,
            has_changes: None,
            error: Some("Subscription not found".to_string()),
        }
    }
}

/// Trigger garbage collection (no-op in Rust, but we can clear caches)
#[tauri::command]
pub async fn memory_trigger_gc(
    _request: MemoryTriggerGCRequest,
) -> SystemResponse {
    // Rust doesn't have a manual GC like Node.js
    // But we can hint to the allocator to release memory
    // For now, this is a no-op
    SystemResponse {
        success: true,
        has_changes: None,
        error: None,
    }
}


//! SQL Log commands
//!
//! Handles SQL query logging for debugging and auditing

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

const MAX_LOGS: usize = 1000;

/// SQL log entry - matches frontend SqlLogEntry interface
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlLogEntry {
    pub id: String,
    pub timestamp: String,
    pub connection_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub db_path: Option<String>,
    pub operation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sql: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_count: Option<usize>,
    /// Log level for filtering
    pub level: String,
}

/// SQL logger state
pub struct SqlLogger {
    logs: Mutex<VecDeque<SqlLogEntry>>,
}

impl SqlLogger {
    pub fn new() -> Self {
        Self {
            logs: Mutex::new(VecDeque::with_capacity(MAX_LOGS)),
        }
    }

    pub fn add_log(&self, entry: SqlLogEntry) {
        let mut logs = self.logs.lock().unwrap();
        if logs.len() >= MAX_LOGS {
            logs.pop_front();
        }
        logs.push_back(entry);
    }

    pub fn get_logs(
        &self,
        limit: Option<usize>,
        connection_id: Option<&str>,
        level: Option<&str>,
    ) -> Vec<SqlLogEntry> {
        let logs = self.logs.lock().unwrap();
        let limit = limit.unwrap_or(500);

        logs.iter()
            .filter(|log| {
                let conn_match = connection_id.map_or(true, |id| log.connection_id == id);
                let level_match = level.map_or(true, |l| log.level == l);
                conn_match && level_match
            })
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    pub fn clear_logs(&self, connection_id: Option<&str>) {
        let mut logs = self.logs.lock().unwrap();
        if let Some(id) = connection_id {
            logs.retain(|log| log.connection_id != id);
        } else {
            logs.clear();
        }
    }
}

impl Default for SqlLogger {
    fn default() -> Self {
        Self::new()
    }
}

/// Request to get SQL logs
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSqlLogsRequest {
    pub limit: Option<usize>,
    pub connection_id: Option<String>,
    pub level: Option<String>,
}

/// Request to clear SQL logs
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClearSqlLogsRequest {
    pub connection_id: Option<String>,
}

/// Response for SQL log operations
#[derive(Debug, Serialize)]
pub struct SqlLogResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logs: Option<Vec<SqlLogEntry>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Get SQL logs
#[tauri::command]
pub fn sql_log_get(
    logger: State<'_, Arc<SqlLogger>>,
    request: GetSqlLogsRequest,
) -> SqlLogResponse {
    let logs = logger.get_logs(
        request.limit,
        request.connection_id.as_deref(),
        request.level.as_deref(),
    );

    log::info!("SQL Log Get: returning {} logs", logs.len());

    SqlLogResponse {
        success: true,
        logs: Some(logs),
        error: None,
    }
}

/// Clear SQL logs
#[tauri::command]
pub fn sql_log_clear(
    logger: State<'_, Arc<SqlLogger>>,
    request: ClearSqlLogsRequest,
) -> SqlLogResponse {
    logger.clear_logs(request.connection_id.as_deref());

    SqlLogResponse {
        success: true,
        logs: None,
        error: None,
    }
}

/// Log a SQL execution (called internally, not via IPC)
/// Also emits a 'sql-log-entry' event to the frontend
pub fn log_sql_with_emit(
    app: &tauri::AppHandle,
    logger: &SqlLogger,
    connection_id: &str,
    operation: &str,
    sql: Option<&str>,
    duration_ms: Option<u64>,
    error: Option<&str>,
) {
    let success = error.is_none();
    let entry = SqlLogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        connection_id: connection_id.to_string(),
        db_path: None,
        operation: operation.to_string(),
        sql: sql.map(|s| s.to_string()),
        duration_ms,
        success,
        error: error.map(|e| e.to_string()),
        row_count: None,
        level: if success {
            "info".to_string()
        } else {
            "error".to_string()
        },
    };

    log::info!("SQL Log: {} - {} - {:?}", operation, connection_id, sql);

    // Emit event to frontend
    if let Err(e) = app.emit("sql-log-entry", &entry) {
        log::warn!("Failed to emit sql-log-entry event: {}", e);
    }

    logger.add_log(entry);
}

/// Log a SQL execution without emitting events (used when app handle not available)
pub fn log_sql(
    logger: &SqlLogger,
    connection_id: &str,
    operation: &str,
    sql: Option<&str>,
    duration_ms: Option<u64>,
    error: Option<&str>,
) {
    let success = error.is_none();
    let entry = SqlLogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        connection_id: connection_id.to_string(),
        db_path: None,
        operation: operation.to_string(),
        sql: sql.map(|s| s.to_string()),
        duration_ms,
        success,
        error: error.map(|e| e.to_string()),
        row_count: None,
        level: if success {
            "info".to_string()
        } else {
            "error".to_string()
        },
    };

    log::info!("SQL Log: {} - {} - {:?}", operation, connection_id, sql);
    logger.add_log(entry);
}

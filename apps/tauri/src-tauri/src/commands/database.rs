//! Database command handlers
//!
//! Handles all database-related operations including connection management,
//! schema queries, data retrieval, and query execution.

use crate::services::database::DatabaseManager;
use crate::types::database::*;
use crate::types::store::RecentConnection;
use chrono::Utc;
use tauri::State;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "app-store.json";
const RECENT_CONNECTIONS_KEY: &str = "recentConnections";

/// Open a database connection
#[tauri::command]
pub async fn db_open(
    app: tauri::AppHandle,
    state: State<'_, DatabaseManager>,
    request: OpenDatabaseRequest,
) -> Result<OpenDatabaseResponse, String> {
    let result = state.open(request.clone()).await?;
    
    // Save to recent connections if successful
    if result.success {
        if let Some(ref conn) = result.connection {
            if let Ok(store) = app.store(STORE_FILE) {
                // Get existing connections
                let mut connections: Vec<RecentConnection> = store
                    .get(RECENT_CONNECTIONS_KEY)
                    .and_then(|v| serde_json::from_value(v).ok())
                    .unwrap_or_default();

                // Create recent connection entry
                let db_type_str = conn.database_type.as_ref()
                    .map(|dt| format!("{:?}", dt).to_lowercase())
                    .unwrap_or_else(|| "sqlite".to_string());
                    
                let recent = RecentConnection {
                    path: conn.path.clone(),
                    filename: conn.filename.clone(),
                    is_encrypted: conn.is_encrypted,
                    last_opened: Utc::now().to_rfc3339(),
                    display_name: request.config.as_ref().and_then(|c| c.name.clone()),
                    read_only: Some(request.read_only.unwrap_or(false)),
                    created_at: Some(Utc::now().to_rfc3339()),
                    database_type: Some(db_type_str),
                    connection_config: request.config.clone(),
                };

                // Check if connection already exists (by path)
                let existing_idx = connections.iter().position(|c| c.path == recent.path);
                
                if let Some(idx) = existing_idx {
                    // Update existing connection
                    connections[idx] = recent;
                } else {
                    // Add new connection at the beginning
                    connections.insert(0, recent);
                }

                // Limit to 10 recent connections
                if connections.len() > 10 {
                    connections.truncate(10);
                }

                // Save to store
                if let Ok(value) = serde_json::to_value(&connections) {
                    store.set(RECENT_CONNECTIONS_KEY, value);
                    let _ = store.save();
                    log::info!("Saved recent connection: {}", conn.path);
                }
            }
        }
    }
    
    Ok(result)
}

/// Close a database connection
#[tauri::command]
pub async fn db_close(
    state: State<'_, DatabaseManager>,
    request: CloseDatabaseRequest,
) -> Result<CloseDatabaseResponse, String> {
    state.close(&request.connection_id).await
}

/// Get the full schema of a database
#[tauri::command]
pub async fn db_get_schema(
    state: State<'_, DatabaseManager>,
    request: GetSchemaRequest,
) -> Result<GetSchemaResponse, String> {
    state.get_schema(&request.connection_id).await
}

/// Get a lightweight schema list (table/view names only)
#[tauri::command]
pub async fn db_get_schema_list(
    state: State<'_, DatabaseManager>,
    request: GetSchemaListRequest,
) -> Result<GetSchemaListResponse, String> {
    state.get_schema_list(&request.connection_id).await
}

/// Get detailed information for a specific table
#[tauri::command]
pub async fn db_get_table_details(
    state: State<'_, DatabaseManager>,
    request: GetTableDetailsRequest,
) -> Result<GetTableDetailsResponse, String> {
    state
        .get_table_details(
            &request.connection_id,
            &request.table_name,
            request.schema.as_deref(),
        )
        .await
}

/// Get paginated table data
#[tauri::command]
pub async fn db_get_table_data(
    state: State<'_, DatabaseManager>,
    request: GetTableDataRequest,
) -> Result<GetTableDataResponse, String> {
    state.get_table_data(request).await
}

/// Execute a SQL query
#[tauri::command]
pub async fn db_execute_query(
    state: State<'_, DatabaseManager>,
    request: ExecuteQueryRequest,
) -> Result<ExecuteQueryResponse, String> {
    state
        .execute_query(&request.connection_id, &request.query)
        .await
}

/// Validate pending changes before applying
#[tauri::command]
pub async fn db_validate_changes(
    state: State<'_, DatabaseManager>,
    request: ValidateChangesRequest,
) -> Result<ValidateChangesResponse, String> {
    state
        .validate_changes(&request.connection_id, &request.changes)
        .await
}

/// Apply pending changes to the database
#[tauri::command]
pub async fn db_apply_changes(
    state: State<'_, DatabaseManager>,
    request: ApplyChangesRequest,
) -> Result<ApplyChangesResponse, String> {
    state
        .apply_changes(&request.connection_id, &request.changes)
        .await
}

/// Analyze a query execution plan
#[tauri::command]
pub async fn db_analyze_plan(
    state: State<'_, DatabaseManager>,
    request: AnalyzeQueryPlanRequest,
) -> Result<AnalyzeQueryPlanResponse, String> {
    state
        .analyze_query_plan(&request.connection_id, &request.query)
        .await
}

/// Test a database connection without persisting it
#[tauri::command]
pub async fn db_test_connection(
    state: State<'_, DatabaseManager>,
    request: TestConnectionRequest,
) -> Result<TestConnectionResponse, String> {
    state.test_connection(request).await
}

/// Change the encryption password of a database
#[tauri::command]
pub async fn db_change_password(
    state: State<'_, DatabaseManager>,
    request: ChangePasswordRequest,
) -> Result<ChangePasswordResponse, String> {
    state
        .change_password(
            &request.connection_id,
            request.current_password.as_deref(),
            &request.new_password,
        )
        .await
}


//! Database types
//!
//! Types for database operations, schema information, and query execution.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============ Error Types ============

/// Error codes for categorizing different types of errors
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    SqlSyntaxError,
    SqlConstraintError,
    TableNotFound,
    ColumnNotFound,
    ConstraintViolation,
    TypeMismatch,
    ConnectionError,
    PermissionError,
    FileNotFound,
    EncryptionError,
    QueryExecutionError,
    UnknownError,
}

/// Position information for errors in SQL
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPosition {
    pub line: u32,
    pub column: u32,
}

// ============ Connection Types ============

/// Supported database types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DatabaseType {
    Sqlite,
    Mysql,
    Postgresql,
    Supabase,
}

/// Database connection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseConnectionConfig {
    #[serde(rename = "type")]
    pub db_type: DatabaseType,
    pub name: Option<String>,
    pub path: Option<String>,
    pub password: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub database: Option<String>,
    pub username: Option<String>,
    pub supabase_url: Option<String>,
    pub supabase_key: Option<String>,
    pub ssl: Option<SslConfig>,
    pub read_only: Option<bool>,
}

/// SSL configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SslConfig {
    Simple(bool),
    Detailed {
        reject_unauthorized: Option<bool>,
        ca: Option<String>,
        cert: Option<String>,
        key: Option<String>,
    },
}

// ============ Open/Close Database ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDatabaseRequest {
    pub path: Option<String>,
    pub password: Option<String>,
    pub read_only: Option<bool>,
    pub config: Option<DatabaseConnectionConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub id: String,
    pub path: String,
    pub filename: String,
    pub is_encrypted: bool,
    pub is_read_only: bool,
    pub database_type: Option<DatabaseType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDatabaseResponse {
    pub success: bool,
    pub connection: Option<ConnectionInfo>,
    pub error: Option<String>,
    pub needs_password: Option<bool>,
    pub error_code: Option<ErrorCode>,
    pub troubleshooting_steps: Option<Vec<String>>,
    pub documentation_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseDatabaseRequest {
    pub connection_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloseDatabaseResponse {
    pub success: bool,
    pub error: Option<String>,
}

// ============ Schema Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfo {
    pub name: String,
    #[serde(rename = "type")]
    pub column_type: String,
    pub nullable: bool,
    pub default_value: Option<String>,
    pub is_primary_key: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexInfo {
    pub name: String,
    pub columns: Vec<String>,
    pub is_unique: bool,
    pub sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ForeignKeyInfo {
    pub column: String,
    pub referenced_table: String,
    pub referenced_column: String,
    pub on_delete: Option<String>,
    pub on_update: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TriggerInfo {
    pub name: String,
    pub table_name: String,
    pub timing: String,
    pub event: String,
    pub sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableInfo {
    pub name: String,
    pub schema: String,
    #[serde(rename = "type")]
    pub table_type: String,
    pub columns: Vec<ColumnInfo>,
    pub primary_key: Vec<String>,
    pub foreign_keys: Vec<ForeignKeyInfo>,
    pub indexes: Vec<IndexInfo>,
    pub triggers: Vec<TriggerInfo>,
    pub row_count: Option<u64>,
    pub sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableListItem {
    pub name: String,
    pub schema: String,
    #[serde(rename = "type")]
    pub table_type: String,
    pub row_count: Option<u64>,
    pub sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaInfo {
    pub name: String,
    pub tables: Vec<TableInfo>,
    pub views: Vec<TableInfo>,
    pub is_lazy: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaListInfo {
    pub name: String,
    pub tables: Vec<TableListItem>,
    pub views: Vec<TableListItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSchemaRequest {
    pub connection_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSchemaResponse {
    pub success: bool,
    pub schemas: Option<Vec<SchemaInfo>>,
    pub tables: Option<Vec<TableInfo>>,
    pub views: Option<Vec<TableInfo>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSchemaListRequest {
    pub connection_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSchemaListResponse {
    pub success: bool,
    pub schemas: Option<Vec<SchemaListInfo>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTableDetailsRequest {
    pub connection_id: String,
    pub table_name: String,
    pub schema: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTableDetailsResponse {
    pub success: bool,
    pub table: Option<TableInfo>,
    pub error: Option<String>,
}

// ============ Table Data Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableFilter {
    pub column: String,
    pub operator: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTableDataRequest {
    pub connection_id: String,
    pub schema: Option<String>,
    pub table: String,
    pub page: u32,
    pub page_size: u32,
    pub sort_column: Option<String>,
    pub sort_direction: Option<String>,
    pub filters: Option<Vec<TableFilter>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTableDataResponse {
    pub success: bool,
    pub columns: Option<Vec<ColumnInfo>>,
    pub rows: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub total_rows: Option<u64>,
    pub error: Option<String>,
    pub error_code: Option<ErrorCode>,
    pub suggestions: Option<Vec<String>>,
}

// ============ Query Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteQueryRequest {
    pub connection_id: String,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResultSet {
    pub columns: Vec<String>,
    pub rows: Vec<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteQueryResponse {
    pub success: bool,
    pub columns: Option<Vec<String>>,
    pub rows: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub result_sets: Option<Vec<QueryResultSet>>,
    pub rows_affected: Option<u64>,
    pub last_insert_row_id: Option<i64>,
    pub execution_time: Option<u64>,
    pub executed_statements: Option<u32>,
    pub total_changes: Option<u64>,
    pub error: Option<String>,
    pub error_code: Option<ErrorCode>,
    pub error_position: Option<ErrorPosition>,
    pub suggestions: Option<Vec<String>>,
    pub documentation_url: Option<String>,
}

// ============ Change Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Insert,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingChangeInfo {
    pub id: String,
    pub table: String,
    pub schema: Option<String>,
    pub row_id: serde_json::Value,
    #[serde(rename = "type")]
    pub change_type: ChangeType,
    pub old_values: Option<HashMap<String, serde_json::Value>>,
    pub new_values: Option<HashMap<String, serde_json::Value>>,
    pub primary_key_column: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub change_id: Option<String>,
    pub is_valid: Option<bool>,
    pub valid: Option<bool>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateChangesRequest {
    pub connection_id: String,
    pub changes: Vec<PendingChangeInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateChangesResponse {
    pub success: bool,
    pub results: Option<Vec<ValidationResult>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyChangesRequest {
    pub connection_id: String,
    pub changes: Vec<PendingChangeInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyChangesResponse {
    pub success: bool,
    pub applied_count: Option<u32>,
    pub error: Option<String>,
    pub error_code: Option<ErrorCode>,
    pub suggestions: Option<Vec<String>>,
    pub documentation_url: Option<String>,
}

// ============ Query Plan Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryPlanNode {
    pub id: i32,
    pub parent: i32,
    pub not_used: i32,
    pub detail: String,
    pub children: Option<Vec<QueryPlanNode>>,
    pub estimated_cost: Option<f64>,
    pub estimated_rows: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryPlanStats {
    pub execution_time: Option<u64>,
    pub rows_examined: Option<u64>,
    pub rows_returned: Option<u64>,
    pub indexes_used: Option<Vec<String>>,
    pub tables_accessed: Option<Vec<String>>,
    pub total_nodes: Option<u32>,
    pub depth: Option<u32>,
    pub has_scan: Option<bool>,
    pub has_sort: Option<bool>,
    pub has_index: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeQueryPlanRequest {
    pub connection_id: String,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeQueryPlanResponse {
    pub success: bool,
    pub plan: Option<Vec<QueryPlanNode>>,
    pub stats: Option<QueryPlanStats>,
    pub error: Option<String>,
}

// ============ Test Connection Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionRequest {
    pub config: DatabaseConnectionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResponse {
    pub success: bool,
    pub latency_ms: Option<u64>,
    pub server_version: Option<String>,
    pub error: Option<String>,
    pub error_code: Option<ErrorCode>,
    pub troubleshooting_steps: Option<Vec<String>>,
}

// ============ Change Password Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordRequest {
    pub connection_id: String,
    pub current_password: Option<String>,
    pub new_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePasswordResponse {
    pub success: bool,
    pub error: Option<String>,
    pub error_code: Option<ErrorCode>,
}


//! Export types
//!
//! Types for data and schema export operations.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Csv,
    Json,
    Sql,
    Xlsx,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDataRequest {
    pub connection_id: String,
    pub table: String,
    pub format: ExportFormat,
    pub file_path: String,
    pub schema: Option<String>,
    pub columns: Option<Vec<String>>,
    pub include_headers: Option<bool>,
    pub delimiter: Option<String>,
    pub pretty_print: Option<bool>,
    pub sheet_name: Option<String>,
    pub rows: Option<Vec<HashMap<String, serde_json::Value>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDataResponse {
    pub success: bool,
    pub rows_exported: Option<u64>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSchemaRequest {
    pub connection_id: Option<String>,
    pub snapshot_id: Option<String>,
    pub file_path: Option<String>,
    pub format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSchemaResponse {
    pub success: bool,
    pub file_path: Option<String>,
    pub error: Option<String>,
}


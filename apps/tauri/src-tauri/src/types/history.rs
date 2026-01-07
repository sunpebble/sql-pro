//! Query history types
//!
//! Types for query history storage and retrieval.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryHistoryEntry {
    pub id: String,
    pub db_path: String,
    pub query_text: Option<String>,
    pub query: Option<String>,
    pub executed_at: Option<String>,
    pub timestamp: Option<String>,
    pub duration_ms: Option<u64>,
    pub success: Option<bool>,
    pub error: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetQueryHistoryRequest {
    pub db_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetQueryHistoryResponse {
    pub success: bool,
    pub history: Option<Vec<QueryHistoryEntry>>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveQueryHistoryRequest {
    pub entry: Option<QueryHistoryEntry>,
    pub query: Option<String>,
    pub connection_path: Option<String>,
    pub timestamp: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveQueryHistoryResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteQueryHistoryRequest {
    pub db_path: Option<String>,
    pub entry_id: Option<String>,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteQueryHistoryResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClearQueryHistoryRequest {
    pub db_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClearQueryHistoryResponse {
    pub success: bool,
    pub error: Option<String>,
}


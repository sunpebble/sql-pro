//! Store types
//!
//! Types for preferences and recent connections storage.

use serde::{Deserialize, Serialize};

use super::database::DatabaseConnectionConfig;

// ============ Preferences Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
    pub theme: String,
    pub default_page_size: u32,
    pub confirm_before_apply: bool,
    pub recent_connections_limit: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetPreferencesResponse {
    pub success: bool,
    pub preferences: Option<Preferences>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetPreferencesRequest {
    pub preferences: Preferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetPreferencesResponse {
    pub success: bool,
    pub error: Option<String>,
}

// ============ Recent Connections Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentConnection {
    pub path: String,
    pub filename: String,
    pub is_encrypted: bool,
    pub last_opened: String,
    pub display_name: Option<String>,
    pub read_only: Option<bool>,
    pub created_at: Option<String>,
    pub database_type: Option<String>,
    pub connection_config: Option<DatabaseConnectionConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentConnectionsResponse {
    pub success: bool,
    pub connections: Option<Vec<RecentConnection>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveRecentConnectionRequest {
    pub connection: RecentConnection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveRecentConnectionResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveRecentConnectionRequest {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveRecentConnectionResponse {
    pub success: bool,
    pub error: Option<String>,
}


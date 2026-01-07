//! Import commands
//!
//! Handles importing bundles and schemas

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Request to import a bundle
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportBundleRequest {
    pub data: String,
}

/// Request to import a schema
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSchemaRequest {
    pub data: String,
}

/// Import response
#[derive(Debug, Serialize)]
pub struct ImportResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub queries: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schemas: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Import a bundle (queries and schemas)
#[tauri::command]
pub async fn import_bundle(request: ImportBundleRequest) -> ImportResponse {
    // Try to parse the bundle data as JSON
    match serde_json::from_str::<Value>(&request.data) {
        Ok(bundle) => {
            let queries = bundle.get("queries")
                .and_then(|v| v.as_array())
                .map(|arr| arr.clone());
            
            let schemas = bundle.get("schemas")
                .and_then(|v| v.as_array())
                .map(|arr| arr.clone());

            ImportResponse {
                success: true,
                queries,
                schemas,
                error: None,
            }
        }
        Err(e) => ImportResponse {
            success: false,
            queries: None,
            schemas: None,
            error: Some(format!("Failed to parse bundle: {}", e)),
        },
    }
}

/// Import a schema
#[tauri::command]
pub async fn import_schema(request: ImportSchemaRequest) -> ImportResponse {
    // Try to parse the schema data as JSON
    match serde_json::from_str::<Value>(&request.data) {
        Ok(schema_data) => {
            let schemas = if schema_data.is_array() {
                Some(schema_data.as_array().unwrap().clone())
            } else if schema_data.get("schemas").is_some() {
                schema_data.get("schemas")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.clone())
            } else {
                Some(vec![schema_data])
            };

            ImportResponse {
                success: true,
                queries: None,
                schemas,
                error: None,
            }
        }
        Err(e) => ImportResponse {
            success: false,
            queries: None,
            schemas: None,
            error: Some(format!("Failed to parse schema: {}", e)),
        },
    }
}


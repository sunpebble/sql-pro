//! AI command handlers
//!
//! Handles AI-related operations including settings and API calls.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AISettings {
    pub provider: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: Option<String>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAISettingsResponse {
    pub success: bool,
    pub settings: Option<AISettings>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAISettingsRequest {
    pub settings: AISettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAISettingsResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIFetchRequest {
    pub api_key: String,
    pub base_url: Option<String>,
    pub model: String,
    pub system: Option<String>,
    pub messages: Vec<AIMessage>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIFetchResponse {
    pub success: bool,
    pub message: Option<AIMessage>,
    pub content: Option<String>,
    pub error: Option<String>,
}

/// Get AI settings
#[tauri::command]
pub async fn ai_get_settings() -> Result<GetAISettingsResponse, String> {
    // TODO: Implement using tauri-plugin-store
    Ok(GetAISettingsResponse {
        success: true,
        settings: Some(AISettings {
            provider: "anthropic".to_string(),
            api_key: None,
            base_url: None,
            model: Some("claude-3-5-sonnet-20241022".to_string()),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }),
        error: None,
    })
}

/// Save AI settings
#[tauri::command]
pub async fn ai_save_settings(
    request: SaveAISettingsRequest,
) -> Result<SaveAISettingsResponse, String> {
    // TODO: Implement using tauri-plugin-store
    log::info!("Saving AI settings: {:?}", request.settings.provider);
    Ok(SaveAISettingsResponse {
        success: true,
        error: None,
    })
}

/// Fetch AI completion
#[tauri::command]
pub async fn ai_fetch_completion(request: AIFetchRequest) -> Result<AIFetchResponse, String> {
    // Use reqwest to call the AI API
    let client = reqwest::Client::new();

    // Determine the endpoint based on provider (inferred from base_url or default)
    let base_url = request
        .base_url
        .unwrap_or_else(|| "https://api.anthropic.com".to_string());

    // For Anthropic API
    if base_url.contains("anthropic") {
        let url = format!("{}/v1/messages", base_url);

        let messages_json: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let body = serde_json::json!({
            "model": request.model,
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "messages": messages_json,
            "system": request.system
        });

        match client
            .post(&url)
            .header("x-api-key", &request.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<serde_json::Value>().await {
                        Ok(json) => {
                            let content = json["content"][0]["text"]
                                .as_str()
                                .unwrap_or("")
                                .to_string();
                            Ok(AIFetchResponse {
                                success: true,
                                message: Some(AIMessage {
                                    role: "assistant".to_string(),
                                    content: content.clone(),
                                }),
                                content: Some(content),
                                error: None,
                            })
                        }
                        Err(e) => Ok(AIFetchResponse {
                            success: false,
                            message: None,
                            content: None,
                            error: Some(format!("Failed to parse response: {}", e)),
                        }),
                    }
                } else {
                    let status = response.status();
                    let error_text = response.text().await.unwrap_or_default();
                    Ok(AIFetchResponse {
                        success: false,
                        message: None,
                        content: None,
                        error: Some(format!("API error {}: {}", status, error_text)),
                    })
                }
            }
            Err(e) => Ok(AIFetchResponse {
                success: false,
                message: None,
                content: None,
                error: Some(format!("Request failed: {}", e)),
            }),
        }
    } else {
        // OpenAI-compatible API
        let url = format!("{}/chat/completions", base_url);

        let messages_json: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let body = serde_json::json!({
            "model": request.model,
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "temperature": request.temperature.unwrap_or(0.7),
            "messages": messages_json
        });

        match client
            .post(&url)
            .header("Authorization", format!("Bearer {}", request.api_key))
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<serde_json::Value>().await {
                        Ok(json) => {
                            let content = json["choices"][0]["message"]["content"]
                                .as_str()
                                .unwrap_or("")
                                .to_string();
                            Ok(AIFetchResponse {
                                success: true,
                                message: Some(AIMessage {
                                    role: "assistant".to_string(),
                                    content: content.clone(),
                                }),
                                content: Some(content),
                                error: None,
                            })
                        }
                        Err(e) => Ok(AIFetchResponse {
                            success: false,
                            message: None,
                            content: None,
                            error: Some(format!("Failed to parse response: {}", e)),
                        }),
                    }
                } else {
                    let status = response.status();
                    let error_text = response.text().await.unwrap_or_default();
                    Ok(AIFetchResponse {
                        success: false,
                        message: None,
                        content: None,
                        error: Some(format!("API error {}: {}", status, error_text)),
                    })
                }
            }
            Err(e) => Ok(AIFetchResponse {
                success: false,
                message: None,
                content: None,
                error: Some(format!("Request failed: {}", e)),
            }),
        }
    }
}


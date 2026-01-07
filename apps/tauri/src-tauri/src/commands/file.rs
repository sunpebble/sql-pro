//! File command handlers
//!
//! Handles file operations including atomic write.

use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use uuid::Uuid;

/// Request to write a file
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteFileRequest {
    pub file_path: String,
    pub content: String,
    #[serde(default = "default_encoding")]
    pub encoding: String,
    #[serde(default = "default_atomic")]
    pub atomic: bool,
}

fn default_encoding() -> String {
    "utf8".to_string()
}

fn default_atomic() -> bool {
    true
}

/// Response for file write operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteFileResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytes_written: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Map file system errors to user-friendly messages
fn get_file_write_error_message(error: &std::io::Error) -> String {
    match error.kind() {
        std::io::ErrorKind::PermissionDenied => {
            "Permission denied. Check that you have write access to this location.".to_string()
        }
        std::io::ErrorKind::NotFound => {
            "The directory does not exist. Please choose a valid location.".to_string()
        }
        std::io::ErrorKind::AlreadyExists => {
            "A file with this name already exists.".to_string()
        }
        std::io::ErrorKind::InvalidInput => {
            "Invalid file path or content.".to_string()
        }
        std::io::ErrorKind::OutOfMemory => {
            "Not enough memory to complete the operation.".to_string()
        }
        _ => {
            // Check for specific error codes on Unix systems
            #[cfg(unix)]
            {
                if let Some(code) = error.raw_os_error() {
                    match code {
                        28 => return "Not enough disk space to save the file.".to_string(),
                        30 => return "Cannot write to a read-only file system.".to_string(),
                        21 => {
                            return "Cannot write to a directory. Please specify a file path."
                                .to_string()
                        }
                        24 | 23 => {
                            return "Too many open files. Please close some applications and try again.".to_string()
                        }
                        18 => {
                            return "Cannot move file across different file systems.".to_string()
                        }
                        _ => {}
                    }
                }
            }
            error.to_string()
        }
    }
}

/// Write a file with optional atomic write support
#[tauri::command]
pub async fn file_write(request: WriteFileRequest) -> WriteFileResponse {
    let file_path = PathBuf::from(&request.file_path);
    let content_bytes = request.content.as_bytes();

    if request.atomic {
        // Atomic write: write to temp file, then rename
        let parent = match file_path.parent() {
            Some(p) => p,
            None => {
                return WriteFileResponse {
                    success: false,
                    bytes_written: None,
                    error: Some("Invalid file path".to_string()),
                };
            }
        };

        // Generate a unique temp filename in the same directory
        let temp_file_name = format!(".tmp_{}_{}", Uuid::new_v4(), std::process::id());
        let temp_path = parent.join(temp_file_name);

        // Write to temp file
        match fs::File::create(&temp_path) {
            Ok(mut file) => {
                if let Err(e) = file.write_all(content_bytes) {
                    // Clean up temp file on error
                    let _ = fs::remove_file(&temp_path);
                    return WriteFileResponse {
                        success: false,
                        bytes_written: None,
                        error: Some(get_file_write_error_message(&e)),
                    };
                }

                // Sync to disk before rename
                if let Err(e) = file.sync_all() {
                    let _ = fs::remove_file(&temp_path);
                    return WriteFileResponse {
                        success: false,
                        bytes_written: None,
                        error: Some(get_file_write_error_message(&e)),
                    };
                }
            }
            Err(e) => {
                return WriteFileResponse {
                    success: false,
                    bytes_written: None,
                    error: Some(get_file_write_error_message(&e)),
                };
            }
        }

        // Atomically rename temp file to target file
        match fs::rename(&temp_path, &file_path) {
            Ok(()) => {
                log::info!("File written atomically: {}", request.file_path);
                WriteFileResponse {
                    success: true,
                    bytes_written: Some(content_bytes.len()),
                    error: None,
                }
            }
            Err(e) => {
                // Clean up temp file
                let _ = fs::remove_file(&temp_path);
                WriteFileResponse {
                    success: false,
                    bytes_written: None,
                    error: Some(get_file_write_error_message(&e)),
                }
            }
        }
    } else {
        // Non-atomic write: write directly to target
        match fs::write(&file_path, content_bytes) {
            Ok(()) => {
                log::info!("File written: {}", request.file_path);
                WriteFileResponse {
                    success: true,
                    bytes_written: Some(content_bytes.len()),
                    error: None,
                }
            }
            Err(e) => WriteFileResponse {
                success: false,
                bytes_written: None,
                error: Some(get_file_write_error_message(&e)),
            },
        }
    }
}

/// Read a file
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFileRequest {
    pub file_path: String,
    #[serde(default = "default_encoding")]
    pub encoding: String,
}

/// Response for file read operations
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadFileResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Read a file
#[tauri::command]
pub async fn file_read(request: ReadFileRequest) -> ReadFileResponse {
    match fs::read_to_string(&request.file_path) {
        Ok(content) => {
            log::info!("File read: {}", request.file_path);
            ReadFileResponse {
                success: true,
                content: Some(content),
                error: None,
            }
        }
        Err(e) => {
            log::error!("Failed to read file: {}", e);
            ReadFileResponse {
                success: false,
                content: None,
                error: Some(e.to_string()),
            }
        }
    }
}


//! Password storage service
//!
//! Provides password storage using Tauri's store plugin.
//! Passwords are stored with base64 encoding for basic obfuscation.
//! 
//! Note: This is less secure than system keychain but more reliable
//! across different platforms and Tauri versions.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use std::collections::HashMap;
use std::sync::RwLock;

/// In-memory cache for passwords (also persisted to store)
static PASSWORDS: RwLock<Option<HashMap<String, String>>> = RwLock::new(None);

/// Password storage service using Tauri store
pub struct PasswordService;

impl PasswordService {
    /// Check if password storage is available on this system
    pub fn is_available() -> bool {
        true // Always available with store-based approach
    }

    /// Initialize the password cache from stored data
    pub fn init(stored_passwords: Option<HashMap<String, String>>) {
        let mut cache = PASSWORDS.write().unwrap();
        *cache = Some(stored_passwords.unwrap_or_default());
        log::info!("Password service initialized");
    }

    /// Get all passwords (for persistence)
    pub fn get_all() -> HashMap<String, String> {
        let cache = PASSWORDS.read().unwrap();
        cache.clone().unwrap_or_default()
    }

    /// Save a password
    pub fn save(identifier: &str, password: &str) -> Result<(), String> {
        log::info!("Saving password for identifier: {}", identifier);
        
        // Encode password with base64
        let encoded = BASE64.encode(password.as_bytes());
        
        let mut cache = PASSWORDS.write().map_err(|e| e.to_string())?;
        let passwords = cache.get_or_insert_with(HashMap::new);
        passwords.insert(identifier.to_string(), encoded);
        
        log::info!("Password saved successfully for: {}", identifier);
        Ok(())
    }

    /// Get a password
    pub fn get(identifier: &str) -> Result<String, String> {
        log::info!("Getting password for identifier: {}", identifier);
        
        let cache = PASSWORDS.read().map_err(|e| e.to_string())?;
        let passwords = cache.as_ref().ok_or("Password cache not initialized")?;
        
        let encoded = passwords
            .get(identifier)
            .ok_or("No matching entry found in secure storage")?;
        
        // Decode from base64
        let decoded_bytes = BASE64
            .decode(encoded)
            .map_err(|e| format!("Failed to decode password: {}", e))?;
        
        let password = String::from_utf8(decoded_bytes)
            .map_err(|e| format!("Invalid UTF-8 in password: {}", e))?;
        
        log::info!("Password retrieved successfully for: {}", identifier);
        Ok(password)
    }

    /// Check if a password exists
    pub fn has(identifier: &str) -> bool {
        let cache = PASSWORDS.read().ok();
        cache
            .and_then(|c| c.as_ref().map(|p| p.contains_key(identifier)))
            .unwrap_or(false)
    }

    /// Remove a password
    pub fn remove(identifier: &str) -> Result<(), String> {
        log::info!("Removing password for identifier: {}", identifier);
        
        let mut cache = PASSWORDS.write().map_err(|e| e.to_string())?;
        if let Some(passwords) = cache.as_mut() {
            passwords.remove(identifier);
        }
        
        log::info!("Password removed successfully for: {}", identifier);
        Ok(())
    }
}


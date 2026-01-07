//! Password storage service
//!
//! Provides secure password storage using the system keychain.

use keyring::Entry;

const SERVICE_NAME: &str = "com.sqlpro.app";

/// Password storage service using the system keychain
pub struct PasswordService;

impl PasswordService {
    /// Check if password storage is available on this system
    pub fn is_available() -> bool {
        // Try to create an entry to test availability
        Entry::new(SERVICE_NAME, "test").is_ok()
    }

    /// Save a password to the system keychain
    pub fn save(identifier: &str, password: &str) -> Result<(), keyring::Error> {
        let entry = Entry::new(SERVICE_NAME, identifier)?;
        entry.set_password(password)
    }

    /// Get a password from the system keychain
    pub fn get(identifier: &str) -> Result<String, keyring::Error> {
        let entry = Entry::new(SERVICE_NAME, identifier)?;
        entry.get_password()
    }

    /// Check if a password exists in the system keychain
    pub fn has(identifier: &str) -> bool {
        if let Ok(entry) = Entry::new(SERVICE_NAME, identifier) {
            entry.get_password().is_ok()
        } else {
            false
        }
    }

    /// Remove a password from the system keychain
    pub fn remove(identifier: &str) -> Result<(), keyring::Error> {
        let entry = Entry::new(SERVICE_NAME, identifier)?;
        entry.delete_credential()
    }
}


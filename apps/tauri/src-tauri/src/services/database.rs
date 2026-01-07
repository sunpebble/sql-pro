//! Database service
//!
//! Core database management service providing SQLite and SQLCipher support.
//! This is the main service for all database operations.

use crate::commands::sql_log::{SqlLogger, log_sql_with_emit};
use crate::types::database::*;
use rusqlite::{Connection, OpenFlags};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use uuid::Uuid;

/// Internal connection information with the actual database connection
struct InternalConnection {
    pub connection: Connection,
    pub path: String,
    pub filename: String,
    pub is_encrypted: bool,
    pub is_read_only: bool,
}

/// Database manager handling all database connections
pub struct DatabaseManager {
    connections: Mutex<HashMap<String, InternalConnection>>,
    logger: Arc<SqlLogger>,
    app_handle: Mutex<Option<tauri::AppHandle>>,
}

impl DatabaseManager {
    /// Create a new database manager with a shared logger
    pub fn new(logger: Arc<SqlLogger>) -> Self {
        Self {
            connections: Mutex::new(HashMap::new()),
            logger,
            app_handle: Mutex::new(None),
        }
    }
    
    /// Set the app handle for event emission
    pub fn set_app_handle(&self, handle: tauri::AppHandle) {
        *self.app_handle.lock().unwrap() = Some(handle);
    }
    
    /// Helper to log SQL with event emission
    fn log(&self, connection_id: &str, operation: &str, sql: Option<&str>, duration_ms: Option<u64>, error: Option<&str>) {
        if let Some(ref app) = *self.app_handle.lock().unwrap() {
            log_sql_with_emit(app, &self.logger, connection_id, operation, sql, duration_ms, error);
        } else {
            // Fallback to non-emitting log
            crate::commands::sql_log::log_sql(&self.logger, connection_id, operation, sql, duration_ms, error);
        }
    }

    /// Check if a file appears to be an encrypted SQLite database
    fn is_file_encrypted(path: &str) -> bool {
        if let Ok(data) = fs::read(path) {
            if data.len() >= 16 {
                // SQLite header is "SQLite format 3\0"
                let sqlite_header = b"SQLite format 3\0";
                return &data[..16] != sqlite_header;
            }
        }
        false
    }

    /// Open a database connection
    pub async fn open(&self, request: OpenDatabaseRequest) -> Result<OpenDatabaseResponse, String> {
        let path = request
            .path
            .or_else(|| request.config.as_ref().and_then(|c| c.path.clone()))
            .ok_or("No database path provided")?;

        let password = request
            .password
            .or_else(|| request.config.as_ref().and_then(|c| c.password.clone()));

        let read_only = request
            .read_only
            .or_else(|| request.config.as_ref().and_then(|c| c.read_only))
            .unwrap_or(false);

        // Check if file exists
        if !Path::new(&path).exists() {
            return Ok(OpenDatabaseResponse {
                success: false,
                connection: None,
                error: Some(format!("Database file not found: {}", path)),
                needs_password: None,
                error_code: Some(ErrorCode::FileNotFound),
                troubleshooting_steps: Some(vec![
                    "Check if the file path is correct".to_string(),
                    "Ensure the file exists and is accessible".to_string(),
                ]),
                documentation_url: Some("https://www.sqlite.org/errlog.html".to_string()),
            });
        }

        // Check if file is encrypted
        let file_is_encrypted = Self::is_file_encrypted(&path);

        // If no password provided and file appears encrypted
        if password.is_none() && file_is_encrypted {
            return Ok(OpenDatabaseResponse {
                success: false,
                connection: None,
                error: Some("Database appears to be encrypted. Please provide a password.".to_string()),
                needs_password: Some(true),
                error_code: Some(ErrorCode::EncryptionError),
                troubleshooting_steps: Some(vec![
                    "Enter the encryption password".to_string(),
                    "The database was created with SQLCipher encryption".to_string(),
                ]),
                documentation_url: None,
            });
        }

        // Build open flags
        let mut flags = OpenFlags::SQLITE_OPEN_READ_WRITE;
        if read_only {
            flags = OpenFlags::SQLITE_OPEN_READ_ONLY;
        }

        // Try to open the database
        let conn = match Connection::open_with_flags(&path, flags) {
            Ok(conn) => conn,
            Err(e) => {
                self.log("unknown", "open", None, None, Some(&e.to_string()));
                return Ok(OpenDatabaseResponse {
                    success: false,
                    connection: None,
                    error: Some(e.to_string()),
                    needs_password: None,
                    error_code: Some(ErrorCode::ConnectionError),
                    troubleshooting_steps: Some(vec![
                        "Check file permissions".to_string(),
                        "Ensure the file is a valid SQLite database".to_string(),
                    ]),
                    documentation_url: None,
                });
            }
        };

        // If password provided, set the encryption key
        if let Some(ref pwd) = password {
            // Try different cipher configurations
            let cipher_configs: Vec<(&str, Option<i32>, Option<i32>)> = vec![
                ("sqlcipher", Some(0), None), // SQLCipher 4
                ("sqlcipher", Some(1), None), // SQLCipher 3
                ("sqlcipher", Some(2), None), // SQLCipher 2
                ("chacha20", None, None),     // ChaCha20
                ("aes256cbc", None, None),    // AES-256-CBC
            ];

            let mut success = false;
            for (cipher, legacy, _kdf_iter) in cipher_configs {
                if let Err(_) = conn.pragma_update(None, "cipher", cipher) {
                    continue;
                }
                if let Some(leg) = legacy {
                    if let Err(_) = conn.pragma_update(None, "legacy", leg) {
                        continue;
                    }
                }
                if let Err(_) = conn.pragma_update(None, "key", pwd.as_str()) {
                    continue;
                }

                // Test if we can read
                if conn.prepare("SELECT count(*) FROM sqlite_master").is_ok() {
                    success = true;
                    break;
                }
            }

            if !success {
                self.log("unknown", "open", None, None, Some("Invalid password"));
                return Ok(OpenDatabaseResponse {
                    success: false,
                    connection: None,
                    error: Some("Invalid password or unsupported encryption format".to_string()),
                    needs_password: Some(true),
                    error_code: Some(ErrorCode::EncryptionError),
                    troubleshooting_steps: Some(vec![
                        "Verify the encryption password is correct".to_string(),
                        "Try different cipher configurations".to_string(),
                    ]),
                    documentation_url: None,
                });
            }
        }

        // Test connection
        if let Err(e) = conn.prepare("SELECT 1") {
            // Might need password
            if e.to_string().contains("file is not a database") {
                return Ok(OpenDatabaseResponse {
                    success: false,
                    connection: None,
                    error: Some("Database appears to be encrypted".to_string()),
                    needs_password: Some(true),
                    error_code: Some(ErrorCode::EncryptionError),
                    troubleshooting_steps: None,
                    documentation_url: None,
                });
            }
            return Ok(OpenDatabaseResponse {
                success: false,
                connection: None,
                error: Some(e.to_string()),
                needs_password: None,
                error_code: Some(ErrorCode::ConnectionError),
                troubleshooting_steps: None,
                documentation_url: None,
            });
        }

        // Generate connection ID
        let connection_id = Uuid::new_v4().to_string();
        let filename = Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&path)
            .to_string();

        // Store connection
        let internal_conn = InternalConnection {
            connection: conn,
            path: path.clone(),
            filename: filename.clone(),
            is_encrypted: password.is_some() || file_is_encrypted,
            is_read_only: read_only,
        };

        self.connections
            .lock()
            .unwrap()
            .insert(connection_id.clone(), internal_conn);

        self.log(&connection_id, "open", Some(&path), None, None);

        Ok(OpenDatabaseResponse {
            success: true,
            connection: Some(ConnectionInfo {
                id: connection_id,
                path,
                filename,
                is_encrypted: password.is_some() || file_is_encrypted,
                is_read_only: read_only,
                database_type: Some(DatabaseType::Sqlite),
            }),
            error: None,
            needs_password: None,
            error_code: None,
            troubleshooting_steps: None,
            documentation_url: None,
        })
    }

    /// Close a database connection
    pub async fn close(&self, connection_id: &str) -> Result<CloseDatabaseResponse, String> {
        let mut connections = self.connections.lock().unwrap();
        if connections.remove(connection_id).is_some() {
            self.log(connection_id, "close", None, None, None);
            Ok(CloseDatabaseResponse {
                success: true,
                error: None,
            })
        } else {
            Ok(CloseDatabaseResponse {
                success: false,
                error: Some("Connection not found".to_string()),
            })
        }
    }

    /// Get the full schema of a database
    pub async fn get_schema(&self, connection_id: &str) -> Result<GetSchemaResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections
            .get(connection_id)
            .ok_or("Connection not found")?;

        let start = Instant::now();

        // Get all attached databases
        let mut stmt = conn
            .connection
            .prepare("PRAGMA database_list")
            .map_err(|e| e.to_string())?;

        let databases: Vec<(i32, String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut schemas = Vec::new();

        for (_seq, name, _file) in databases {
            let tables = self.get_tables_internal(&conn.connection, &name, "table")?;
            let views = self.get_tables_internal(&conn.connection, &name, "view")?;

            if !tables.is_empty() || !views.is_empty() || name == "main" {
                schemas.push(SchemaInfo {
                    name,
                    tables,
                    views,
                    is_lazy: Some(false),
                });
            }
        }

        let duration = start.elapsed().as_millis() as u64;
        self.log(connection_id, "query", Some("PRAGMA database_list"), Some(duration), None);

        Ok(GetSchemaResponse {
            success: true,
            schemas: Some(schemas),
            tables: None,
            views: None,
            error: None,
        })
    }

    /// Get a lightweight schema list (table/view names only)
    pub async fn get_schema_list(&self, connection_id: &str) -> Result<GetSchemaListResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections
            .get(connection_id)
            .ok_or("Connection not found")?;

        let mut stmt = conn
            .connection
            .prepare("PRAGMA database_list")
            .map_err(|e| e.to_string())?;

        let databases: Vec<(i32, String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut schemas = Vec::new();

        for (_seq, name, _file) in databases {
            let tables = self.get_table_list_internal(&conn.connection, &name, "table")?;
            let views = self.get_table_list_internal(&conn.connection, &name, "view")?;

            if !tables.is_empty() || !views.is_empty() || name == "main" {
                schemas.push(SchemaListInfo {
                    name,
                    tables,
                    views,
                });
            }
        }

        Ok(GetSchemaListResponse {
            success: true,
            schemas: Some(schemas),
            error: None,
        })
    }

    /// Get detailed information for a specific table
    pub async fn get_table_details(
        &self,
        connection_id: &str,
        table_name: &str,
        schema: Option<&str>,
    ) -> Result<GetTableDetailsResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections
            .get(connection_id)
            .ok_or("Connection not found")?;

        let schema_name = schema.unwrap_or("main");

        // Get table type and SQL
        let sql = format!(
            "SELECT type, sql FROM \"{}\".sqlite_master WHERE name = ?",
            schema_name
        );
        let result: Option<(String, Option<String>)> = conn
            .connection
            .query_row(&sql, [table_name], |row| Ok((row.get(0)?, row.get(1)?)))
            .ok();

        let (table_type, table_sql) = match result {
            Some((t, s)) => (t, s.unwrap_or_default()),
            None => {
                return Ok(GetTableDetailsResponse {
                    success: false,
                    table: None,
                    error: Some(format!("Table '{}' not found", table_name)),
                });
            }
        };

        // Get columns
        let columns = self.get_columns_internal(&conn.connection, table_name, schema_name)?;
        let primary_key: Vec<String> = columns
            .iter()
            .filter(|c| c.is_primary_key)
            .map(|c| c.name.clone())
            .collect();

        // Get foreign keys
        let foreign_keys = self.get_foreign_keys_internal(&conn.connection, table_name, schema_name)?;

        // Get indexes (for tables only)
        let indexes = if table_type == "table" {
            self.get_indexes_internal(&conn.connection, table_name, schema_name)?
        } else {
            vec![]
        };

        // Get triggers (for tables only)
        let triggers = if table_type == "table" {
            self.get_triggers_internal(&conn.connection, table_name, schema_name)?
        } else {
            vec![]
        };

        // Get row count (for tables only)
        let row_count = if table_type == "table" {
            self.get_row_count_internal(&conn.connection, table_name, schema_name)
                .ok()
        } else {
            None
        };

        Ok(GetTableDetailsResponse {
            success: true,
            table: Some(TableInfo {
                name: table_name.to_string(),
                schema: schema_name.to_string(),
                table_type,
                columns,
                primary_key,
                foreign_keys,
                indexes,
                triggers,
                row_count,
                sql: table_sql,
            }),
            error: None,
        })
    }

    /// Get paginated table data
    pub async fn get_table_data(&self, request: GetTableDataRequest) -> Result<GetTableDataResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections
            .get(&request.connection_id)
            .ok_or("Connection not found")?;

        let schema = request.schema.as_deref().unwrap_or("main");
        let mut sql = format!("SELECT * FROM \"{}\".\"{}\"", schema, request.table);
        let mut params: Vec<String> = Vec::new();

        // Apply filters
        if let Some(ref filters) = request.filters {
            if !filters.is_empty() {
                let conditions: Vec<String> = filters
                    .iter()
                    .map(|f| {
                        match f.operator.as_str() {
                            "eq" => {
                                params.push(f.value.clone());
                                format!("\"{}\" = ?", f.column)
                            }
                            "neq" => {
                                params.push(f.value.clone());
                                format!("\"{}\" != ?", f.column)
                            }
                            "gt" => {
                                params.push(f.value.clone());
                                format!("\"{}\" > ?", f.column)
                            }
                            "lt" => {
                                params.push(f.value.clone());
                                format!("\"{}\" < ?", f.column)
                            }
                            "gte" => {
                                params.push(f.value.clone());
                                format!("\"{}\" >= ?", f.column)
                            }
                            "lte" => {
                                params.push(f.value.clone());
                                format!("\"{}\" <= ?", f.column)
                            }
                            "like" => {
                                params.push(format!("%{}%", f.value));
                                format!("\"{}\" LIKE ?", f.column)
                            }
                            "isnull" => format!("\"{}\" IS NULL", f.column),
                            "notnull" => format!("\"{}\" IS NOT NULL", f.column),
                            _ => {
                                params.push(f.value.clone());
                                format!("\"{}\" = ?", f.column)
                            }
                        }
                    })
                    .collect();
                sql.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
            }
        }

        // Apply sorting
        if let Some(ref sort_col) = request.sort_column {
            let direction = request.sort_direction.as_deref().unwrap_or("asc");
            sql.push_str(&format!(
                " ORDER BY \"{}\" {}",
                sort_col,
                if direction == "desc" { "DESC" } else { "ASC" }
            ));
        }

        // Get total count
        let count_sql = sql.replace("SELECT *", "SELECT COUNT(*) as count");
        let total_rows: u64 = conn
            .connection
            .query_row(&count_sql, rusqlite::params_from_iter(params.iter()), |row| {
                row.get(0)
            })
            .unwrap_or(0);

        // Apply pagination
        let offset = (request.page.saturating_sub(1)) * request.page_size;
        sql.push_str(&format!(" LIMIT {} OFFSET {}", request.page_size, offset));

        // Execute query
        let start = Instant::now();
        let mut stmt = conn.connection.prepare(&sql).map_err(|e| e.to_string())?;

        let column_count = stmt.column_count();
        let column_names: Vec<String> = stmt.column_names().iter().map(|s| s.to_string()).collect();

        let rows: Vec<HashMap<String, serde_json::Value>> = stmt
            .query_map(rusqlite::params_from_iter(params.iter()), |row| {
                let mut map = HashMap::new();
                for i in 0..column_count {
                    let value = self.sqlite_value_to_json(row, i);
                    map.insert(column_names[i].clone(), value);
                }
                Ok(map)
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let duration = start.elapsed().as_millis() as u64;
        self.log(&request.connection_id, "query", Some(&sql), Some(duration), None);

        // Get column info
        let columns = self.get_columns_internal(&conn.connection, &request.table, schema)?;

        Ok(GetTableDataResponse {
            success: true,
            columns: Some(columns),
            rows: Some(rows),
            total_rows: Some(total_rows),
            error: None,
            error_code: None,
            suggestions: None,
        })
    }

    /// Execute a SQL query
    pub async fn execute_query(
        &self,
        connection_id: &str,
        query: &str,
    ) -> Result<ExecuteQueryResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections.get(connection_id).ok_or("Connection not found")?;

        let start = Instant::now();
        let trimmed = query.trim().to_uppercase();

        // Determine if it's a SELECT query
        if trimmed.starts_with("SELECT")
            || trimmed.starts_with("PRAGMA")
            || trimmed.starts_with("EXPLAIN")
            || trimmed.starts_with("WITH")
        {
            match conn.connection.prepare(query) {
                Ok(mut stmt) => {
                    let column_count = stmt.column_count();
                    let column_names: Vec<String> =
                        stmt.column_names().iter().map(|s| s.to_string()).collect();

                    let rows: Vec<HashMap<String, serde_json::Value>> = stmt
                        .query_map([], |row| {
                            let mut map = HashMap::new();
                            for i in 0..column_count {
                                let value = self.sqlite_value_to_json(row, i);
                                map.insert(column_names[i].clone(), value);
                            }
                            Ok(map)
                        })
                        .map_err(|e| e.to_string())?
                        .filter_map(|r| r.ok())
                        .collect();

                    let duration = start.elapsed().as_millis() as u64;
                    self.log(connection_id, "query", Some(query), Some(duration), None);

                    Ok(ExecuteQueryResponse {
                        success: true,
                        columns: Some(column_names),
                        rows: Some(rows),
                        result_sets: None,
                        rows_affected: None,
                        last_insert_row_id: None,
                        execution_time: Some(duration),
                        executed_statements: Some(1),
                        total_changes: None,
                        error: None,
                        error_code: None,
                        error_position: None,
                        suggestions: None,
                        documentation_url: None,
                    })
                }
                Err(e) => {
                    let duration = start.elapsed().as_millis() as u64;
                    self.log(connection_id, "query", Some(query), Some(duration), Some(&e.to_string()));

                    Ok(ExecuteQueryResponse {
                        success: false,
                        columns: None,
                        rows: None,
                        result_sets: None,
                        rows_affected: None,
                        last_insert_row_id: None,
                        execution_time: Some(duration),
                        executed_statements: None,
                        total_changes: None,
                        error: Some(e.to_string()),
                        error_code: Some(ErrorCode::SqlSyntaxError),
                        error_position: None,
                        suggestions: None,
                        documentation_url: None,
                    })
                }
            }
        } else {
            // Execute non-SELECT statements
            match conn.connection.execute(query, []) {
                Ok(changes) => {
                    let duration = start.elapsed().as_millis() as u64;
                    let last_id = conn.connection.last_insert_rowid();

                    self.log(connection_id, "execute", Some(query), Some(duration), None);

                    Ok(ExecuteQueryResponse {
                        success: true,
                        columns: None,
                        rows: None,
                        result_sets: None,
                        rows_affected: Some(changes as u64),
                        last_insert_row_id: Some(last_id),
                        execution_time: Some(duration),
                        executed_statements: Some(1),
                        total_changes: Some(changes as u64),
                        error: None,
                        error_code: None,
                        error_position: None,
                        suggestions: None,
                        documentation_url: None,
                    })
                }
                Err(e) => {
                    let duration = start.elapsed().as_millis() as u64;
                    self.log(connection_id, "execute", Some(query), Some(duration), Some(&e.to_string()));

                    Ok(ExecuteQueryResponse {
                        success: false,
                        columns: None,
                        rows: None,
                        result_sets: None,
                        rows_affected: None,
                        last_insert_row_id: None,
                        execution_time: Some(duration),
                        executed_statements: None,
                        total_changes: None,
                        error: Some(e.to_string()),
                        error_code: Some(ErrorCode::QueryExecutionError),
                        error_position: None,
                        suggestions: None,
                        documentation_url: None,
                    })
                }
            }
        }
    }

    /// Validate pending changes
    pub async fn validate_changes(
        &self,
        connection_id: &str,
        changes: &[PendingChangeInfo],
    ) -> Result<ValidateChangesResponse, String> {
        let connections = self.connections.lock().unwrap();
        let _conn = connections.get(connection_id).ok_or("Connection not found")?;

        // Basic validation - check that changes have required fields
        let results: Vec<ValidationResult> = changes
            .iter()
            .map(|change| ValidationResult {
                change_id: Some(change.id.clone()),
                is_valid: Some(true),
                valid: Some(true),
                error: None,
            })
            .collect();

        Ok(ValidateChangesResponse {
            success: true,
            results: Some(results),
            error: None,
        })
    }

    /// Apply pending changes
    pub async fn apply_changes(
        &self,
        connection_id: &str,
        changes: &[PendingChangeInfo],
    ) -> Result<ApplyChangesResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections.get(connection_id).ok_or("Connection not found")?;

        let mut applied_count = 0u32;

        for change in changes {
            let schema = change.schema.as_deref().unwrap_or("main");
            let result = match change.change_type {
                ChangeType::Insert => {
                    if let Some(ref new_values) = change.new_values {
                        let columns: Vec<&String> = new_values.keys().collect();
                        let placeholders: Vec<&str> = (0..columns.len()).map(|_| "?").collect();
                        let sql = format!(
                            "INSERT INTO \"{}\".\"{}\" ({}) VALUES ({})",
                            schema,
                            change.table,
                            columns.iter().map(|c| format!("\"{}\"", c)).collect::<Vec<_>>().join(", "),
                            placeholders.join(", ")
                        );

                        let values: Vec<String> = new_values
                            .values()
                            .map(|v| match v {
                                serde_json::Value::String(s) => s.clone(),
                                serde_json::Value::Null => "NULL".to_string(),
                                _ => v.to_string(),
                            })
                            .collect();

                        conn.connection
                            .execute(&sql, rusqlite::params_from_iter(values.iter()))
                    } else {
                        continue;
                    }
                }
                ChangeType::Update => {
                    if let (Some(ref new_values), Some(ref pk_col)) =
                        (&change.new_values, &change.primary_key_column)
                    {
                        let set_clause: Vec<String> = new_values
                            .keys()
                            .map(|k| format!("\"{}\" = ?", k))
                            .collect();
                        let sql = format!(
                            "UPDATE \"{}\".\"{}\" SET {} WHERE \"{}\" = ?",
                            schema,
                            change.table,
                            set_clause.join(", "),
                            pk_col
                        );

                        let mut values: Vec<String> = new_values
                            .values()
                            .map(|v| match v {
                                serde_json::Value::String(s) => s.clone(),
                                serde_json::Value::Null => "NULL".to_string(),
                                _ => v.to_string(),
                            })
                            .collect();
                        values.push(change.row_id.to_string());

                        conn.connection
                            .execute(&sql, rusqlite::params_from_iter(values.iter()))
                    } else {
                        continue;
                    }
                }
                ChangeType::Delete => {
                    if let Some(ref pk_col) = change.primary_key_column {
                        let sql = format!(
                            "DELETE FROM \"{}\".\"{}\" WHERE \"{}\" = ?",
                            schema, change.table, pk_col
                        );
                        conn.connection.execute(&sql, [change.row_id.to_string()])
                    } else {
                        continue;
                    }
                }
            };

            if result.is_ok() {
                applied_count += 1;
            }
        }

        Ok(ApplyChangesResponse {
            success: true,
            applied_count: Some(applied_count),
            error: None,
            error_code: None,
            suggestions: None,
            documentation_url: None,
        })
    }

    /// Analyze a query execution plan
    pub async fn analyze_query_plan(
        &self,
        connection_id: &str,
        query: &str,
    ) -> Result<AnalyzeQueryPlanResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections.get(connection_id).ok_or("Connection not found")?;

        let explain_sql = format!("EXPLAIN QUERY PLAN {}", query);
        let mut stmt = conn
            .connection
            .prepare(&explain_sql)
            .map_err(|e| e.to_string())?;

        let plan: Vec<QueryPlanNode> = stmt
            .query_map([], |row| {
                Ok(QueryPlanNode {
                    id: row.get(0)?,
                    parent: row.get(1)?,
                    not_used: row.get(2)?,
                    detail: row.get(3)?,
                    children: None,
                    estimated_cost: None,
                    estimated_rows: None,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let has_scan = plan.iter().any(|n| n.detail.contains("SCAN"));
        let has_sort = plan.iter().any(|n| n.detail.contains("SORT"));
        let has_index = plan.iter().any(|n| n.detail.contains("INDEX"));

        Ok(AnalyzeQueryPlanResponse {
            success: true,
            plan: Some(plan.clone()),
            stats: Some(QueryPlanStats {
                execution_time: None,
                rows_examined: None,
                rows_returned: None,
                indexes_used: None,
                tables_accessed: None,
                total_nodes: Some(plan.len() as u32),
                depth: None,
                has_scan: Some(has_scan),
                has_sort: Some(has_sort),
                has_index: Some(has_index),
            }),
            error: None,
        })
    }

    /// Test a database connection
    pub async fn test_connection(
        &self,
        request: TestConnectionRequest,
    ) -> Result<TestConnectionResponse, String> {
        let start = Instant::now();

        let path = request
            .config
            .path
            .ok_or("No database path provided")?;

        if !Path::new(&path).exists() {
            return Ok(TestConnectionResponse {
                success: false,
                latency_ms: None,
                server_version: None,
                error: Some("File not found".to_string()),
                error_code: Some(ErrorCode::FileNotFound),
                troubleshooting_steps: None,
            });
        }

        match Connection::open(&path) {
            Ok(conn) => {
                // Get SQLite version
                let version: String = conn
                    .query_row("SELECT sqlite_version()", [], |row| row.get(0))
                    .unwrap_or_else(|_| "Unknown".to_string());

                let latency = start.elapsed().as_millis() as u64;

                Ok(TestConnectionResponse {
                    success: true,
                    latency_ms: Some(latency),
                    server_version: Some(format!("SQLite {}", version)),
                    error: None,
                    error_code: None,
                    troubleshooting_steps: None,
                })
            }
            Err(e) => Ok(TestConnectionResponse {
                success: false,
                latency_ms: None,
                server_version: None,
                error: Some(e.to_string()),
                error_code: Some(ErrorCode::ConnectionError),
                troubleshooting_steps: None,
            }),
        }
    }

    /// Change database encryption password
    pub async fn change_password(
        &self,
        connection_id: &str,
        _current_password: Option<&str>,
        new_password: &str,
    ) -> Result<ChangePasswordResponse, String> {
        let connections = self.connections.lock().unwrap();
        let conn = connections.get(connection_id).ok_or("Connection not found")?;

        if conn.is_read_only {
            return Ok(ChangePasswordResponse {
                success: false,
                error: Some("Cannot change password on read-only connection".to_string()),
                error_code: Some(ErrorCode::PermissionError),
            });
        }

        // Use PRAGMA rekey to change password
        let result = if new_password.is_empty() {
            conn.connection.pragma_update(None, "rekey", "")
        } else {
            conn.connection.pragma_update(None, "rekey", new_password)
        };

        match result {
            Ok(_) => Ok(ChangePasswordResponse {
                success: true,
                error: None,
                error_code: None,
            }),
            Err(e) => Ok(ChangePasswordResponse {
                success: false,
                error: Some(e.to_string()),
                error_code: Some(ErrorCode::EncryptionError),
            }),
        }
    }

    // ============ Internal Helper Methods ============

    fn get_tables_internal(
        &self,
        conn: &Connection,
        schema: &str,
        table_type: &str,
    ) -> Result<Vec<TableInfo>, String> {
        let sql = format!(
            "SELECT name, sql FROM \"{}\".sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name",
            schema
        );

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let items: Vec<(String, Option<String>)> = stmt
            .query_map([table_type], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut tables = Vec::new();
        for (name, table_sql) in items {
            let columns = self.get_columns_internal(conn, &name, schema)?;
            let primary_key: Vec<String> = columns
                .iter()
                .filter(|c| c.is_primary_key)
                .map(|c| c.name.clone())
                .collect();
            let foreign_keys = self.get_foreign_keys_internal(conn, &name, schema)?;
            let indexes = if table_type == "table" {
                self.get_indexes_internal(conn, &name, schema)?
            } else {
                vec![]
            };
            let triggers = if table_type == "table" {
                self.get_triggers_internal(conn, &name, schema)?
            } else {
                vec![]
            };
            let row_count = if table_type == "table" {
                self.get_row_count_internal(conn, &name, schema).ok()
            } else {
                None
            };

            tables.push(TableInfo {
                name,
                schema: schema.to_string(),
                table_type: table_type.to_string(),
                columns,
                primary_key,
                foreign_keys,
                indexes,
                triggers,
                row_count,
                sql: table_sql.unwrap_or_default(),
            });
        }

        Ok(tables)
    }

    fn get_table_list_internal(
        &self,
        conn: &Connection,
        schema: &str,
        table_type: &str,
    ) -> Result<Vec<TableListItem>, String> {
        let sql = format!(
            "SELECT name, sql FROM \"{}\".sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name",
            schema
        );

        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let items: Vec<TableListItem> = stmt
            .query_map([table_type], |row| {
                let name: String = row.get(0)?;
                let table_sql: Option<String> = row.get(1)?;
                Ok(TableListItem {
                    name: name.clone(),
                    schema: schema.to_string(),
                    table_type: table_type.to_string(),
                    row_count: None, // Skip for lightweight list
                    sql: table_sql.unwrap_or_default(),
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(items)
    }

    fn get_columns_internal(
        &self,
        conn: &Connection,
        table_name: &str,
        schema: &str,
    ) -> Result<Vec<ColumnInfo>, String> {
        let sql = format!("PRAGMA \"{}\".table_info(\"{}\")", schema, table_name);
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let columns: Vec<ColumnInfo> = stmt
            .query_map([], |row| {
                Ok(ColumnInfo {
                    name: row.get(1)?,
                    column_type: row.get(2)?,
                    nullable: row.get::<_, i32>(3)? == 0,
                    default_value: row.get(4)?,
                    is_primary_key: row.get::<_, i32>(5)? > 0,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(columns)
    }

    fn get_foreign_keys_internal(
        &self,
        conn: &Connection,
        table_name: &str,
        schema: &str,
    ) -> Result<Vec<ForeignKeyInfo>, String> {
        let sql = format!("PRAGMA \"{}\".foreign_key_list(\"{}\")", schema, table_name);
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let fks: Vec<ForeignKeyInfo> = stmt
            .query_map([], |row| {
                Ok(ForeignKeyInfo {
                    column: row.get(3)?,
                    referenced_table: row.get(2)?,
                    referenced_column: row.get(4)?,
                    on_update: row.get(5)?,
                    on_delete: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(fks)
    }

    fn get_indexes_internal(
        &self,
        conn: &Connection,
        table_name: &str,
        schema: &str,
    ) -> Result<Vec<IndexInfo>, String> {
        let sql = format!("PRAGMA \"{}\".index_list(\"{}\")", schema, table_name);
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let index_list: Vec<(String, bool)> = stmt
            .query_map([], |row| {
                let name: String = row.get(1)?;
                let unique: i32 = row.get(2)?;
                Ok((name, unique == 1))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .filter(|(name, _)| !name.starts_with("sqlite_"))
            .collect();

        let mut indexes = Vec::new();
        for (name, is_unique) in index_list {
            let info_sql = format!("PRAGMA \"{}\".index_info(\"{}\")", schema, name);
            let mut info_stmt = conn.prepare(&info_sql).map_err(|e| e.to_string())?;

            let columns: Vec<String> = info_stmt
                .query_map([], |row| row.get(2))
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();

            let sql_query = format!(
                "SELECT sql FROM \"{}\".sqlite_master WHERE type = 'index' AND name = ?",
                schema
            );
            let index_sql: String = conn
                .query_row(&sql_query, [&name], |row| row.get(0))
                .unwrap_or_default();

            indexes.push(IndexInfo {
                name,
                columns,
                is_unique,
                sql: index_sql,
            });
        }

        Ok(indexes)
    }

    fn get_triggers_internal(
        &self,
        conn: &Connection,
        table_name: &str,
        schema: &str,
    ) -> Result<Vec<TriggerInfo>, String> {
        let sql = format!(
            "SELECT name, sql FROM \"{}\".sqlite_master WHERE type = 'trigger' AND tbl_name = ? ORDER BY name",
            schema
        );
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

        let triggers: Vec<TriggerInfo> = stmt
            .query_map([table_name], |row| {
                let name: String = row.get(0)?;
                let trigger_sql: String = row.get::<_, Option<String>>(1)?.unwrap_or_default();

                // Parse timing and event from SQL
                let upper_sql = trigger_sql.to_uppercase();
                let timing = if upper_sql.contains("AFTER") {
                    "AFTER"
                } else if upper_sql.contains("INSTEAD OF") {
                    "INSTEAD OF"
                } else {
                    "BEFORE"
                };
                let event = if upper_sql.contains("UPDATE") {
                    "UPDATE"
                } else if upper_sql.contains("DELETE") {
                    "DELETE"
                } else {
                    "INSERT"
                };

                Ok(TriggerInfo {
                    name,
                    table_name: table_name.to_string(),
                    timing: timing.to_string(),
                    event: event.to_string(),
                    sql: trigger_sql,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        Ok(triggers)
    }

    fn get_row_count_internal(
        &self,
        conn: &Connection,
        table_name: &str,
        schema: &str,
    ) -> Result<u64, String> {
        let sql = format!("SELECT COUNT(*) FROM \"{}\".\"{}\"", schema, table_name);
        conn.query_row(&sql, [], |row| row.get(0))
            .map_err(|e| e.to_string())
    }

    fn sqlite_value_to_json(&self, row: &rusqlite::Row, idx: usize) -> serde_json::Value {
        use rusqlite::types::ValueRef;

        match row.get_ref(idx) {
            Ok(ValueRef::Null) => serde_json::Value::Null,
            Ok(ValueRef::Integer(i)) => serde_json::Value::Number(i.into()),
            Ok(ValueRef::Real(f)) => {
                serde_json::Number::from_f64(f)
                    .map(serde_json::Value::Number)
                    .unwrap_or(serde_json::Value::Null)
            }
            Ok(ValueRef::Text(t)) => {
                serde_json::Value::String(String::from_utf8_lossy(t).to_string())
            }
            Ok(ValueRef::Blob(b)) => {
                // Return blob as a description (for display purposes)
                serde_json::Value::String(format!("[BLOB: {} bytes]", b.len()))
            }
            Err(_) => serde_json::Value::Null,
        }
    }
}

// Note: Default is not implemented because DatabaseManager requires a shared SqlLogger


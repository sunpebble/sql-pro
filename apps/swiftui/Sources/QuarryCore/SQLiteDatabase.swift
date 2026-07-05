import Foundation
import SQLite3

public struct DatabaseTable: Equatable, Hashable, Identifiable {
  public let name: String
  public let type: String

  public var id: String { "\(type):\(name)" }

  public init(name: String, type: String) {
    self.name = name
    self.type = type
  }
}

public struct QueryResult: Equatable {
  public let columns: [String]
  public let rows: [[String]]

  public init(columns: [String], rows: [[String]]) {
    self.columns = columns
    self.rows = rows
  }
}

public struct QueryPlanStep: Equatable, Identifiable {
  public let id: Int
  public let parent: Int
  public let detail: String

  public init(id: Int, parent: Int, detail: String) {
    self.id = id
    self.parent = parent
    self.detail = detail
  }
}

public struct DatabaseInfoItem: Equatable, Identifiable {
  public let name: String
  public let value: String

  public var id: String { name }

  public init(name: String, value: String) {
    self.name = name
    self.value = value
  }
}

public struct DatabaseColumn: Equatable, Hashable, Identifiable {
  public let name: String
  public let type: String
  public let isPrimaryKey: Bool
  public let isRequired: Bool

  public var id: String { name }

  public init(name: String, type: String, isPrimaryKey: Bool, isRequired: Bool) {
    self.name = name
    self.type = type
    self.isPrimaryKey = isPrimaryKey
    self.isRequired = isRequired
  }
}

public struct TableDataRow: Equatable, Identifiable {
  public let rowID: Int64?
  public var values: [String]

  public var id: String { rowID.map(String.init) ?? values.joined(separator: "\u{1f}") }

  public init(rowID: Int64?, values: [String]) {
    self.rowID = rowID
    self.values = values
  }
}

public struct TableData: Equatable {
  public let table: DatabaseTable
  public let columns: [DatabaseColumn]
  public var rows: [TableDataRow]
  public let editable: Bool

  public init(table: DatabaseTable, columns: [DatabaseColumn], rows: [TableDataRow], editable: Bool) {
    self.table = table
    self.columns = columns
    self.rows = rows
    self.editable = editable
  }
}

public struct DatabaseIndex: Equatable, Identifiable {
  public let name: String
  public let isUnique: Bool
  public let columns: [String]

  public var id: String { name }

  public init(name: String, isUnique: Bool, columns: [String]) {
    self.name = name
    self.isUnique = isUnique
    self.columns = columns
  }
}

public struct DatabaseForeignKey: Equatable, Identifiable {
  public let id: String
  public let table: String
  public let fromColumn: String
  public let toColumn: String
  public let onUpdate: String
  public let onDelete: String

  public init(id: String, table: String, fromColumn: String, toColumn: String, onUpdate: String, onDelete: String) {
    self.id = id
    self.table = table
    self.fromColumn = fromColumn
    self.toColumn = toColumn
    self.onUpdate = onUpdate
    self.onDelete = onDelete
  }
}

public struct TableSchema: Equatable {
  public let table: DatabaseTable
  public let columns: [DatabaseColumn]
  public let indexes: [DatabaseIndex]
  public let foreignKeys: [DatabaseForeignKey]
  public let createSQL: String

  public init(table: DatabaseTable, columns: [DatabaseColumn], indexes: [DatabaseIndex], foreignKeys: [DatabaseForeignKey], createSQL: String) {
    self.table = table
    self.columns = columns
    self.indexes = indexes
    self.foreignKeys = foreignKeys
    self.createSQL = createSQL
  }
}

public struct DatabaseRelationship: Equatable, Identifiable {
  public let fromTable: String
  public let fromColumn: String
  public let toTable: String
  public let toColumn: String

  public var id: String { "\(fromTable).\(fromColumn)->\(toTable).\(toColumn)" }

  public init(fromTable: String, fromColumn: String, toTable: String, toColumn: String) {
    self.fromTable = fromTable
    self.fromColumn = fromColumn
    self.toTable = toTable
    self.toColumn = toColumn
  }
}

public struct DatabaseDiagram: Equatable {
  public let tables: [DatabaseTable]
  public let relationships: [DatabaseRelationship]

  public init(tables: [DatabaseTable], relationships: [DatabaseRelationship]) {
    self.tables = tables
    self.relationships = relationships
  }
}

public struct DatabaseSearchMatch: Equatable, Identifiable {
  public let tableName: String
  public let rowID: Int64?
  public let rowIndex: Int
  public let columnName: String
  public let value: String

  public var id: String {
    "\(tableName):\(rowID.map(String.init) ?? String(rowIndex)):\(columnName):\(value)"
  }

  public init(tableName: String, rowID: Int64?, rowIndex: Int, columnName: String, value: String) {
    self.tableName = tableName
    self.rowID = rowID
    self.rowIndex = rowIndex
    self.columnName = columnName
    self.value = value
  }
}

public struct TableCellChange: Equatable, Identifiable {
  public let tableName: String
  public let rowID: Int64
  public let columnName: String
  public let oldValue: String
  public let newValue: String

  public var id: String { "\(tableName):\(rowID):\(columnName)" }

  public init(tableName: String, rowID: Int64, columnName: String, oldValue: String, newValue: String) {
    self.tableName = tableName
    self.rowID = rowID
    self.columnName = columnName
    self.oldValue = oldValue
    self.newValue = newValue
  }
}

public enum SQLiteDatabaseError: Error, Equatable, LocalizedError {
  case openFailed(String)
  case passwordRequired
  case prepareFailed(String)
  case stepFailed(String)
  case executeFailed(String)
  case backupFailed(String)

  public var errorDescription: String? {
    switch self {
    case let .openFailed(message):
      return "Open failed: \(message)"
    case .passwordRequired:
      return "Database appears encrypted. Open it with a password."
    case let .prepareFailed(message):
      return "Prepare failed: \(message)"
    case let .stepFailed(message):
      return "Query failed: \(message)"
    case let .executeFailed(message):
      return "Execute failed: \(message)"
    case let .backupFailed(message):
      return "Backup failed: \(message)"
    }
  }
}

public final class SQLiteDatabase {
  public let url: URL
  private var handle: OpaquePointer?

  public init(url: URL, readOnly: Bool = true, password: String? = nil) throws {
    self.url = url
    if Self.appearsEncrypted(at: url), (password ?? "").isEmpty {
      throw SQLiteDatabaseError.passwordRequired
    }

    let flags = readOnly ? SQLITE_OPEN_READONLY : SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE
    var openedHandle: OpaquePointer?

    if sqlite3_open_v2(url.path, &openedHandle, flags, nil) != SQLITE_OK {
      let message = openedHandle.map { String(cString: sqlite3_errmsg($0)) } ?? "Unknown SQLite error"
      sqlite3_close(openedHandle)
      throw SQLiteDatabaseError.openFailed(message)
    }

    handle = openedHandle
    if let password, !password.isEmpty {
      do {
        try execute("pragma key = '\(Self.sqlString(password))'")
        _ = try query("select count(*) from sqlite_master", limit: 1)
      } catch {
        sqlite3_close(handle)
        handle = nil
        throw error
      }
    }
  }

  deinit {
    sqlite3_close(handle)
  }

  public func close() {
    sqlite3_close(handle)
    handle = nil
  }

  public func listTables() throws -> [DatabaseTable] {
    let sql = """
      select name, type
      from sqlite_schema
      where type in ('table', 'view')
        and name not like 'sqlite_%'
      order by type, name
      """

    let result = try query(sql, limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 2 else { return nil }
      return DatabaseTable(name: row[0], type: row[1])
    }
  }

  public func columns(in table: DatabaseTable) throws -> [DatabaseColumn] {
    let result = try query("pragma table_info(\(quotedIdentifier(table.name)))", limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 6 else { return nil }
      return DatabaseColumn(
        name: row[1],
        type: row[2],
        isPrimaryKey: row[5] != "0",
        isRequired: row[3] != "0"
      )
    }
  }

  public func tableData(
    _ table: DatabaseTable,
    filter: String = "",
    sortColumn: String? = nil,
    sortAscending: Bool = true,
    limit: Int = 500,
    offset: Int = 0
  ) throws -> TableData {
    let columns = try columns(in: table)
    if table.type == "table", let data = try? rowIDTableData(
      table,
      columns: columns,
      filter: filter,
      sortColumn: sortColumn,
      sortAscending: sortAscending,
      limit: limit,
      offset: offset
    ) {
      return data
    }

    let result = try filteredQuery(
      table: table,
      columns: columns,
      filter: filter,
      sortColumn: sortColumn,
      sortAscending: sortAscending,
      limit: limit,
      offset: offset
    )
    return TableData(
      table: table,
      columns: columns.isEmpty ? result.columns.map { DatabaseColumn(name: $0, type: "", isPrimaryKey: false, isRequired: false) } : columns,
      rows: result.rows.map { TableDataRow(rowID: nil, values: $0) },
      editable: false
    )
  }

  public func tableSchema(_ table: DatabaseTable) throws -> TableSchema {
    TableSchema(
      table: table,
      columns: try columns(in: table),
      indexes: try indexes(in: table),
      foreignKeys: try foreignKeys(in: table),
      createSQL: try createSQL(for: table)
    )
  }

  public func diagram() throws -> DatabaseDiagram {
    let tables = try listTables().filter { $0.type == "table" }
    let relationships = try tables.flatMap { table in
      try foreignKeys(in: table).map {
        DatabaseRelationship(
          fromTable: table.name,
          fromColumn: $0.fromColumn,
          toTable: $0.table,
          toColumn: $0.toColumn
        )
      }
    }
    return DatabaseDiagram(tables: tables, relationships: relationships)
  }

  public func schemaSummary() throws -> String {
    try listTables()
      .map { table in
        let schema = try tableSchema(table)
        if !schema.createSQL.isEmpty {
          return schema.createSQL
        }
        return "\(table.type) \(table.name)(\(schema.columns.map(\.name).joined(separator: ", ")))"
      }
      .joined(separator: "\n\n")
  }

  public func searchAllTables(_ term: String, limitPerTable: Int = 50) throws -> [DatabaseSearchMatch] {
    let searchTerm = term.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !searchTerm.isEmpty else { return [] }

    var matches: [DatabaseSearchMatch] = []
    for table in try listTables() {
      let data = try tableData(table, filter: searchTerm, limit: limitPerTable)
      for (rowIndex, row) in data.rows.enumerated() {
        for (columnIndex, value) in row.values.enumerated() where value.range(
          of: searchTerm,
          options: [.caseInsensitive, .diacriticInsensitive]
        ) != nil {
          let columnName = data.columns.indices.contains(columnIndex) ? data.columns[columnIndex].name : "column \(columnIndex + 1)"
          matches.append(DatabaseSearchMatch(
            tableName: table.name,
            rowID: row.rowID,
            rowIndex: rowIndex,
            columnName: columnName,
            value: value
          ))
        }
      }
    }
    return matches
  }

  public func query(_ sql: String, limit: Int = 500) throws -> QueryResult {
    let statement = try prepare(sql)
    defer { sqlite3_finalize(statement) }

    let columnCount = sqlite3_column_count(statement)
    let columns = (0..<columnCount).map { index in
      String(cString: sqlite3_column_name(statement, index))
    }

    var rows: [[String]] = []
    let maxRows = max(0, limit)

    while rows.count < maxRows {
      let status = sqlite3_step(statement)
      if status == SQLITE_DONE {
        break
      }
      if status != SQLITE_ROW {
        throw SQLiteDatabaseError.stepFailed(errorMessage())
      }

      rows.append((0..<columnCount).map { valueString(statement: statement, column: $0) })
    }

    return QueryResult(columns: columns, rows: rows)
  }

  public func explainQueryPlan(_ sql: String) throws -> [QueryPlanStep] {
    let result = try query("explain query plan \(sql)", limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 4, let id = Int(row[0]), let parent = Int(row[1]) else { return nil }
      return QueryPlanStep(id: id, parent: parent, detail: row[3])
    }
  }

  public func databaseInfo() throws -> [DatabaseInfoItem] {
    var items: [DatabaseInfoItem] = []
    let pragmas = [
      ("Page Count", "pragma page_count"),
      ("Page Size", "pragma page_size"),
      ("Freelist Count", "pragma freelist_count"),
      ("Journal Mode", "pragma journal_mode"),
      ("Foreign Keys", "pragma foreign_keys"),
      ("Auto Vacuum", "pragma auto_vacuum"),
      ("Encoding", "pragma encoding"),
      ("User Version", "pragma user_version"),
      ("Application ID", "pragma application_id"),
    ]

    for (name, sql) in pragmas {
      if let value = try query(sql, limit: 1).rows.first?.first {
        items.append(DatabaseInfoItem(name: name, value: value))
      }
    }

    if let cipherVersion = try? query("pragma cipher_version", limit: 1).rows.first?.first,
       !cipherVersion.isEmpty {
      items.append(DatabaseInfoItem(name: "SQLCipher", value: cipherVersion))
    }

    let databases = try query("pragma database_list", limit: Int.max)
    for row in databases.rows where row.count >= 3 {
      items.append(DatabaseInfoItem(name: "Database \(row[1])", value: row[2]))
    }

    return items
  }

  public func integrityCheck() throws -> [String] {
    try pragmaMessages("pragma integrity_check")
  }

  public func quickCheck() throws -> [String] {
    try pragmaMessages("pragma quick_check")
  }

  public func optimize() throws -> [String] {
    let messages = try pragmaMessages("pragma optimize")
    return messages.isEmpty ? ["Optimization complete."] : messages
  }

  public func vacuum() throws {
    try execute("vacuum")
  }

  public func insertBlankRow(into table: DatabaseTable) throws {
    let insertableColumns = try columns(in: table).filter { !$0.isPrimaryKey }
    if insertableColumns.isEmpty {
      try execute("insert into \(quotedIdentifier(table.name)) default values")
      return
    }

    let headers = insertableColumns.map(\.name)
    let placeholders = Array(repeating: "?", count: headers.count).joined(separator: ", ")
    let sql = """
      insert into \(quotedIdentifier(table.name))
      (\(headers.map(quotedIdentifier).joined(separator: ", ")))
      values (\(placeholders))
      """
    try insertPreparedRow(sql: sql, values: Array(repeating: "", count: headers.count))
  }

  public func deleteRows(from table: DatabaseTable, rowIDs: [Int64]) throws {
    guard !rowIDs.isEmpty else { return }

    try execute("begin immediate transaction")
    do {
      for rowID in rowIDs {
        let statement = try prepare("delete from \(quotedIdentifier(table.name)) where rowid = ?")
        defer { sqlite3_finalize(statement) }
        sqlite3_bind_int64(statement, 1, rowID)
        if sqlite3_step(statement) != SQLITE_DONE {
          throw SQLiteDatabaseError.stepFailed(errorMessage())
        }
      }
      try execute("commit")
    } catch {
      try? execute("rollback")
      throw error
    }
  }

  public func applyChanges(_ changes: [TableCellChange]) throws {
    guard !changes.isEmpty else { return }

    try execute("begin immediate transaction")
    do {
      for change in changes {
        try updateCell(change)
      }
      try execute("commit")
    } catch {
      try? execute("rollback")
      throw error
    }
  }

  public func importCSV(_ document: CSVDocument, into table: DatabaseTable) throws -> Int {
    guard !document.headers.isEmpty else { return 0 }
    let tableColumns = Set(try columns(in: table).map(\.name))
    let headers = document.headers.filter { tableColumns.contains($0) }
    guard !headers.isEmpty else { return 0 }

    let headerIndexes = headers.compactMap { header in
      document.headers.firstIndex(of: header)
    }
    let placeholders = Array(repeating: "?", count: headers.count).joined(separator: ", ")
    let sql = """
      insert into \(quotedIdentifier(table.name))
      (\(headers.map(quotedIdentifier).joined(separator: ", ")))
      values (\(placeholders))
      """

    try execute("begin immediate transaction")
    do {
      var inserted = 0
      for row in document.rows {
        let values = headerIndexes.map { row.indices.contains($0) ? row[$0] : "" }
        try insertPreparedRow(sql: sql, values: values)
        inserted += 1
      }
      try execute("commit")
      return inserted
    } catch {
      try? execute("rollback")
      throw error
    }
  }

  public func backup(to destinationURL: URL) throws {
    var destination: OpaquePointer?
    if sqlite3_open_v2(destinationURL.path, &destination, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE, nil) != SQLITE_OK {
      let message = destination.map { String(cString: sqlite3_errmsg($0)) } ?? "Could not open backup destination"
      sqlite3_close(destination)
      throw SQLiteDatabaseError.backupFailed(message)
    }
    defer { sqlite3_close(destination) }

    try copyDatabase(from: handle, to: destination)
  }

  public func restore(from sourceURL: URL) throws {
    var source: OpaquePointer?
    if sqlite3_open_v2(sourceURL.path, &source, SQLITE_OPEN_READONLY, nil) != SQLITE_OK {
      let message = source.map { String(cString: sqlite3_errmsg($0)) } ?? "Could not open restore source"
      sqlite3_close(source)
      throw SQLiteDatabaseError.backupFailed(message)
    }
    defer { sqlite3_close(source) }

    try copyDatabase(from: source, to: handle)
  }

  public func execute(_ sql: String) throws {
    var error: UnsafeMutablePointer<CChar>?
    if sqlite3_exec(handle, sql, nil, nil, &error) != SQLITE_OK {
      let message = error.map { String(cString: $0) } ?? errorMessage()
      sqlite3_free(error)
      throw SQLiteDatabaseError.executeFailed(message)
    }
  }

  private func copyDatabase(from source: OpaquePointer?, to destination: OpaquePointer?) throws {
    guard let source, let destination else {
      throw SQLiteDatabaseError.backupFailed("Database handle is not open")
    }

    guard let backup = sqlite3_backup_init(destination, "main", source, "main") else {
      throw SQLiteDatabaseError.backupFailed(String(cString: sqlite3_errmsg(destination)))
    }

    let stepResult = sqlite3_backup_step(backup, -1)
    let finishResult = sqlite3_backup_finish(backup)
    if stepResult != SQLITE_DONE || finishResult != SQLITE_OK {
      throw SQLiteDatabaseError.backupFailed(String(cString: sqlite3_errmsg(destination)))
    }
  }

  private func rowIDTableData(
    _ table: DatabaseTable,
    columns: [DatabaseColumn],
    filter: String,
    sortColumn: String?,
    sortAscending: Bool,
    limit: Int,
    offset: Int = 0
  ) throws -> TableData {
    let result = try filteredQuery(
      table: table,
      columns: columns,
      filter: filter,
      sortColumn: sortColumn,
      sortAscending: sortAscending,
      prefixColumns: ["rowid as __quarry_rowid__"],
      limit: limit,
      offset: offset
    )
    let rows = result.rows.compactMap { row -> TableDataRow? in
      guard let rowIDString = row.first, let rowID = Int64(rowIDString) else { return nil }
      return TableDataRow(rowID: rowID, values: Array(row.dropFirst()))
    }

    return TableData(table: table, columns: columns, rows: rows, editable: true)
  }

  private func filteredQuery(
    table: DatabaseTable,
    columns: [DatabaseColumn],
    filter: String,
    sortColumn: String?,
    sortAscending: Bool,
    prefixColumns: [String] = [],
    limit: Int,
    offset: Int = 0
  ) throws -> QueryResult {
    let selectedColumns = prefixColumns + columns.map { quotedIdentifier($0.name) }
    let trimmedFilter = filter.trimmingCharacters(in: .whitespacesAndNewlines)
    let whereClause: String
    let bindings: [String]

    if trimmedFilter.isEmpty {
      whereClause = ""
      bindings = []
    } else {
      whereClause = " where " + columns
        .map { "cast(\(quotedIdentifier($0.name)) as text) like ?" }
        .joined(separator: " or ")
      bindings = Array(repeating: "%\(trimmedFilter)%", count: columns.count)
    }
    let orderClause: String
    if let sortColumn, columns.contains(where: { $0.name == sortColumn }) {
      orderClause = " order by \(quotedIdentifier(sortColumn)) \(sortAscending ? "asc" : "desc")"
    } else {
      orderClause = ""
    }

    let sql = """
      select \(selectedColumns.joined(separator: ", "))
      from \(quotedIdentifier(table.name))
      \(whereClause)
      \(orderClause)
      limit \(limit)\(offset > 0 ? " offset \(offset)" : "")
      """
    return try preparedQuery(sql: sql, bindings: bindings, limit: limit)
  }

  private func indexes(in table: DatabaseTable) throws -> [DatabaseIndex] {
    let result = try query("pragma index_list(\(quotedIdentifier(table.name)))", limit: Int.max)
    return try result.rows.compactMap { row in
      guard row.count >= 3 else { return nil }
      let name = row[1]
      let columns = try query("pragma index_info(\(quotedIdentifier(name)))", limit: Int.max)
        .rows
        .compactMap { $0.count >= 3 ? $0[2] : nil }
      return DatabaseIndex(name: name, isUnique: row[2] != "0", columns: columns)
    }
  }

  private func foreignKeys(in table: DatabaseTable) throws -> [DatabaseForeignKey] {
    let result = try query("pragma foreign_key_list(\(quotedIdentifier(table.name)))", limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 7 else { return nil }
      return DatabaseForeignKey(
        id: "\(row[0]):\(row[1])",
        table: row[2],
        fromColumn: row[3],
        toColumn: row[4],
        onUpdate: row[5],
        onDelete: row[6]
      )
    }
  }

  private func createSQL(for table: DatabaseTable) throws -> String {
    let sql = """
      select sql
      from sqlite_schema
      where type = ? and name = ?
      limit 1
      """
    let statement = try prepare(sql)
    defer { sqlite3_finalize(statement) }

    sqlite3_bind_text(statement, 1, table.type, -1, SQLITE_TRANSIENT)
    sqlite3_bind_text(statement, 2, table.name, -1, SQLITE_TRANSIENT)

    guard sqlite3_step(statement) == SQLITE_ROW else {
      return ""
    }
    return valueString(statement: statement, column: 0)
  }

  private func updateCell(_ change: TableCellChange) throws {
    let sql = """
      update \(quotedIdentifier(change.tableName))
      set \(quotedIdentifier(change.columnName)) = ?
      where rowid = ?
      """
    let statement = try prepare(sql)
    defer { sqlite3_finalize(statement) }

    sqlite3_bind_text(statement, 1, change.newValue, -1, SQLITE_TRANSIENT)
    sqlite3_bind_int64(statement, 2, change.rowID)

    if sqlite3_step(statement) != SQLITE_DONE {
      throw SQLiteDatabaseError.stepFailed(errorMessage())
    }
  }

  private func insertPreparedRow(sql: String, values: [String]) throws {
    let statement = try prepare(sql)
    defer { sqlite3_finalize(statement) }

    for (index, value) in values.enumerated() {
      sqlite3_bind_text(statement, Int32(index + 1), value, -1, SQLITE_TRANSIENT)
    }

    if sqlite3_step(statement) != SQLITE_DONE {
      throw SQLiteDatabaseError.stepFailed(errorMessage())
    }
  }

  private func preparedQuery(sql: String, bindings: [String], limit: Int) throws -> QueryResult {
    let statement = try prepare(sql)
    defer { sqlite3_finalize(statement) }

    for (index, value) in bindings.enumerated() {
      sqlite3_bind_text(statement, Int32(index + 1), value, -1, SQLITE_TRANSIENT)
    }

    let columnCount = sqlite3_column_count(statement)
    let columns = (0..<columnCount).map { index in
      String(cString: sqlite3_column_name(statement, index))
    }

    var rows: [[String]] = []
    while rows.count < max(0, limit) {
      let status = sqlite3_step(statement)
      if status == SQLITE_DONE {
        break
      }
      if status != SQLITE_ROW {
        throw SQLiteDatabaseError.stepFailed(errorMessage())
      }

      rows.append((0..<columnCount).map { valueString(statement: statement, column: $0) })
    }

    return QueryResult(columns: columns, rows: rows)
  }

  private func pragmaMessages(_ sql: String) throws -> [String] {
    try query(sql, limit: Int.max).rows.map { row in
      row.joined(separator: " ")
    }
  }

  private func prepare(_ sql: String) throws -> OpaquePointer? {
    var statement: OpaquePointer?
    if sqlite3_prepare_v2(handle, sql, -1, &statement, nil) != SQLITE_OK {
      throw SQLiteDatabaseError.prepareFailed(errorMessage())
    }
    return statement
  }

  private func errorMessage() -> String {
    handle.map { String(cString: sqlite3_errmsg($0)) } ?? "Unknown SQLite error"
  }

  private func valueString(statement: OpaquePointer?, column: Int32) -> String {
    switch sqlite3_column_type(statement, column) {
    case SQLITE_INTEGER:
      return String(sqlite3_column_int64(statement, column))
    case SQLITE_FLOAT:
      return String(sqlite3_column_double(statement, column))
    case SQLITE_TEXT:
      guard let text = sqlite3_column_text(statement, column) else { return "" }
      return String(cString: UnsafeRawPointer(text).assumingMemoryBound(to: CChar.self))
    case SQLITE_BLOB:
      return "<\(sqlite3_column_bytes(statement, column)) bytes>"
    case SQLITE_NULL:
      return "NULL"
    default:
      return ""
    }
  }

  public func quotedIdentifier(_ name: String) -> String {
    "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }

  private static func appearsEncrypted(at url: URL) -> Bool {
    guard
      FileManager.default.fileExists(atPath: url.path),
      let data = try? Data(contentsOf: url, options: [.mappedIfSafe]),
      data.count >= 16
    else {
      return false
    }

    return data.prefix(16) != Data("SQLite format 3\0".utf8)
  }

  private static func sqlString(_ value: String) -> String {
    value.replacingOccurrences(of: "'", with: "''")
  }
}

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

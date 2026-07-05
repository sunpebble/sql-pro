import CMySQL
import Foundation

public final class MySQLEngine: DatabaseEngine {
  public let kind = DatabaseEngineKind.mysql
  private var handle: UnsafeMutablePointer<MYSQL>?

  public init(host: String, port: Int, database: String, user: String, password: String) throws {
    guard let handle = mysql_init(nil) else {
      throw DatabaseEngineError.connectionFailed("Unable to allocate connection.")
    }

    var timeout: UInt32 = 10
    mysql_options(handle, MYSQL_OPT_CONNECT_TIMEOUT, &timeout)

    guard mysql_real_connect(handle, host, user, password, database, UInt32(port), nil, 0) != nil else {
      let message = String(cString: mysql_error(handle))
      mysql_close(handle)
      throw DatabaseEngineError.connectionFailed(message)
    }
    self.handle = handle
  }

  deinit {
    close()
  }

  public func close() {
    if let handle {
      mysql_close(handle)
    }
    handle = nil
  }

  public func listTables() throws -> [DatabaseTable] {
    let result = try query("show full tables", limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 2 else { return nil }
      return DatabaseTable(name: row[0], type: row[1] == "VIEW" ? "view" : "table")
    }
    .sorted { ($0.type, $0.name) < ($1.type, $1.name) }
  }

  public func tableData(
    _ table: DatabaseTable,
    filter: String,
    sortColumn: String?,
    sortAscending: Bool,
    limit: Int,
    offset: Int
  ) throws -> TableData {
    let columns = try columns(in: table)
    let selectedColumns = columns.isEmpty
      ? "*"
      : columns.map { "cast(\(Self.quotedIdentifier($0.name)) as char)" }.joined(separator: ", ")
    let trimmedFilter = filter.trimmingCharacters(in: .whitespacesAndNewlines)

    var sql = "select \(selectedColumns) from \(Self.quotedIdentifier(table.name))"
    if !trimmedFilter.isEmpty, !columns.isEmpty {
      let pattern = try escapedLiteral("%\(trimmedFilter)%")
      sql += " where " + columns
        .map { "cast(\(Self.quotedIdentifier($0.name)) as char) like \(pattern)" }
        .joined(separator: " or ")
    }
    if let sortColumn, columns.contains(where: { $0.name == sortColumn }) {
      sql += " order by \(Self.quotedIdentifier(sortColumn)) \(sortAscending ? "asc" : "desc")"
    }
    sql += " limit \(limit)"
    if offset > 0 {
      sql += " offset \(offset)"
    }

    let result = try query(sql, limit: limit)
    let resolvedColumns = columns.isEmpty
      ? result.columns.map { DatabaseColumn(name: $0, type: "", isPrimaryKey: false, isRequired: false) }
      : columns
    return TableData(
      table: table,
      columns: resolvedColumns,
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

  public func query(_ sql: String, limit: Int) throws -> QueryResult {
    guard let handle else {
      throw DatabaseEngineError.connectionFailed("Connection is closed.")
    }
    guard mysql_real_query(handle, sql, UInt(sql.utf8.count)) == 0 else {
      throw DatabaseEngineError.queryFailed(String(cString: mysql_error(handle)))
    }

    guard let result = mysql_store_result(handle) else {
      if mysql_field_count(handle) == 0 {
        return QueryResult(columns: [], rows: [])
      }
      throw DatabaseEngineError.queryFailed(String(cString: mysql_error(handle)))
    }
    defer { mysql_free_result(result) }

    let columnCount = Int(mysql_num_fields(result))
    var columns: [String] = []
    for index in 0..<columnCount {
      let field = mysql_fetch_field_direct(result, UInt32(index))
      columns.append(field.map { String(cString: $0.pointee.name) } ?? "column \(index + 1)")
    }

    var rows: [[String]] = []
    while rows.count < limit, let row = mysql_fetch_row(result) {
      rows.append((0..<columnCount).map { index in
        row[index].map { String(cString: $0) } ?? ""
      })
    }
    return QueryResult(columns: columns, rows: rows)
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

  private func columns(in table: DatabaseTable) throws -> [DatabaseColumn] {
    let result = try query("show columns from \(Self.quotedIdentifier(table.name))", limit: Int.max)
    return result.rows.compactMap { row in
      guard row.count >= 4 else { return nil }
      return DatabaseColumn(
        name: row[0],
        type: row[1],
        isPrimaryKey: row[3] == "PRI",
        isRequired: row[2] == "NO"
      )
    }
  }

  private func indexes(in table: DatabaseTable) throws -> [DatabaseIndex] {
    let result = try query("show index from \(Self.quotedIdentifier(table.name))", limit: Int.max)
    guard
      let nameIndex = result.columns.firstIndex(of: "Key_name"),
      let uniqueIndex = result.columns.firstIndex(of: "Non_unique"),
      let columnIndex = result.columns.firstIndex(of: "Column_name")
    else {
      return []
    }

    var order: [String] = []
    var grouped: [String: (isUnique: Bool, columns: [String])] = [:]
    for row in result.rows where row.count > max(nameIndex, uniqueIndex, columnIndex) {
      let name = row[nameIndex]
      if grouped[name] == nil {
        order.append(name)
        grouped[name] = (isUnique: row[uniqueIndex] == "0", columns: [])
      }
      grouped[name]?.columns.append(row[columnIndex])
    }
    return order.compactMap { name in
      grouped[name].map { DatabaseIndex(name: name, isUnique: $0.isUnique, columns: $0.columns) }
    }
  }

  private func foreignKeys(in table: DatabaseTable) throws -> [DatabaseForeignKey] {
    let tableLiteral = try escapedLiteral(table.name)
    let result = try query(
      """
      select kcu.constraint_name, kcu.column_name, kcu.referenced_table_name, kcu.referenced_column_name,
             rc.update_rule, rc.delete_rule
      from information_schema.key_column_usage kcu
      join information_schema.referential_constraints rc
        on rc.constraint_name = kcu.constraint_name and rc.constraint_schema = kcu.table_schema
      where kcu.table_schema = database()
        and kcu.table_name = \(tableLiteral)
        and kcu.referenced_table_name is not null
      order by kcu.constraint_name, kcu.ordinal_position
      """,
      limit: Int.max
    )
    return result.rows.enumerated().compactMap { index, row in
      guard row.count >= 6 else { return nil }
      return DatabaseForeignKey(
        id: "\(row[0]):\(index)",
        table: row[2],
        fromColumn: row[1],
        toColumn: row[3],
        onUpdate: row[4],
        onDelete: row[5]
      )
    }
  }

  private func createSQL(for table: DatabaseTable) throws -> String {
    let result = try query("show create table \(Self.quotedIdentifier(table.name))", limit: 1)
    guard let row = result.rows.first, row.count >= 2 else { return "" }
    return row[1]
  }

  private func escapedLiteral(_ value: String) throws -> String {
    guard let handle else {
      throw DatabaseEngineError.connectionFailed("Connection is closed.")
    }
    let utf8 = Array(value.utf8)
    var buffer = [CChar](repeating: 0, count: utf8.count * 2 + 1)
    let length = utf8.withUnsafeBufferPointer { bytes in
      bytes.baseAddress.map {
        $0.withMemoryRebound(to: CChar.self, capacity: utf8.count) { source in
          mysql_real_escape_string(handle, &buffer, source, UInt(utf8.count))
        }
      } ?? 0
    }
    return "'\(String(cString: Array(buffer.prefix(Int(length))) + [0]))'"
  }

  static func quotedIdentifier(_ name: String) -> String {
    "`\(name.replacingOccurrences(of: "`", with: "``"))`"
  }
}

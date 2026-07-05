import CLibPQ
import Foundation

public final class PostgresEngine: DatabaseEngine {
  public let kind = DatabaseEngineKind.postgres
  private var connection: OpaquePointer?

  public init(host: String, port: Int, database: String, user: String, password: String) throws {
    let conninfo = [
      "host=\(Self.connInfoValue(host))",
      "port=\(port)",
      "dbname=\(Self.connInfoValue(database))",
      "user=\(Self.connInfoValue(user))",
      "password=\(Self.connInfoValue(password))",
      "connect_timeout=10",
    ].joined(separator: " ")

    guard let connection = PQconnectdb(conninfo) else {
      throw DatabaseEngineError.connectionFailed("Unable to allocate connection.")
    }
    guard PQstatus(connection) == CONNECTION_OK else {
      let message = String(cString: PQerrorMessage(connection))
      PQfinish(connection)
      throw DatabaseEngineError.connectionFailed(message)
    }
    self.connection = connection
  }

  deinit {
    close()
  }

  public func close() {
    if let connection {
      PQfinish(connection)
    }
    connection = nil
  }

  public func listTables() throws -> [DatabaseTable] {
    let result = try query(
      """
      select table_name, table_type
      from information_schema.tables
      where table_schema = 'public'
      order by table_type, table_name
      """,
      limit: Int.max
    )
    return result.rows.compactMap { row in
      guard row.count >= 2 else { return nil }
      return DatabaseTable(name: row[0], type: row[1] == "VIEW" ? "view" : "table")
    }
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
      : columns.map { "cast(\(Self.quotedIdentifier($0.name)) as text)" }.joined(separator: ", ")
    let trimmedFilter = filter.trimmingCharacters(in: .whitespacesAndNewlines)

    var sql = "select \(selectedColumns) from \(Self.quotedIdentifier(table.name))"
    var params: [String] = []
    if !trimmedFilter.isEmpty, !columns.isEmpty {
      sql += " where " + columns
        .map { "cast(\(Self.quotedIdentifier($0.name)) as text) ilike $1" }
        .joined(separator: " or ")
      params = ["%\(trimmedFilter)%"]
    }
    if let sortColumn, columns.contains(where: { $0.name == sortColumn }) {
      sql += " order by \(Self.quotedIdentifier(sortColumn)) \(sortAscending ? "asc" : "desc")"
    }
    sql += " limit \(limit)"
    if offset > 0 {
      sql += " offset \(offset)"
    }

    let result = try execute(sql, params: params, limit: limit)
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
      createSQL: ""
    )
  }

  public func query(_ sql: String, limit: Int) throws -> QueryResult {
    try execute(sql, params: [], limit: limit)
  }

  public func schemaSummary() throws -> String {
    try listTables()
      .map { table in
        let columns = try columns(in: table)
        return "\(table.type) \(table.name)(\(columns.map { "\($0.name) \($0.type)" }.joined(separator: ", ")))"
      }
      .joined(separator: "\n")
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
    let primaryKeys = Set(try execute(
      """
      select kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
      where tc.table_schema = 'public' and tc.table_name = $1 and tc.constraint_type = 'PRIMARY KEY'
      """,
      params: [table.name],
      limit: Int.max
    ).rows.compactMap(\.first))

    let result = try execute(
      """
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public' and table_name = $1
      order by ordinal_position
      """,
      params: [table.name],
      limit: Int.max
    )
    return result.rows.compactMap { row in
      guard row.count >= 3 else { return nil }
      return DatabaseColumn(
        name: row[0],
        type: row[1],
        isPrimaryKey: primaryKeys.contains(row[0]),
        isRequired: row[2] == "NO"
      )
    }
  }

  private func indexes(in table: DatabaseTable) throws -> [DatabaseIndex] {
    let result = try execute(
      "select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = $1 order by indexname",
      params: [table.name],
      limit: Int.max
    )
    return result.rows.compactMap { row in
      guard row.count >= 2 else { return nil }
      let definition = row[1]
      let columns = definition
        .firstMatchInsideParentheses()
        .map { $0.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) } } ?? []
      return DatabaseIndex(
        name: row[0],
        isUnique: definition.uppercased().hasPrefix("CREATE UNIQUE"),
        columns: columns
      )
    }
  }

  private func foreignKeys(in table: DatabaseTable) throws -> [DatabaseForeignKey] {
    let result = try execute(
      """
      select tc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name, rc.update_rule, rc.delete_rule
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
      join information_schema.referential_constraints rc
        on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.table_schema
      where tc.table_schema = 'public' and tc.table_name = $1 and tc.constraint_type = 'FOREIGN KEY'
      order by tc.constraint_name
      """,
      params: [table.name],
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

  private func execute(_ sql: String, params: [String], limit: Int) throws -> QueryResult {
    guard let connection else {
      throw DatabaseEngineError.connectionFailed("Connection is closed.")
    }

    let result: OpaquePointer?
    if params.isEmpty {
      result = PQexec(connection, sql)
    } else {
      let cParams = params.map { strdup($0) }
      defer { cParams.forEach { free($0) } }
      var pointers = cParams.map { UnsafePointer($0) }
      result = PQexecParams(connection, sql, Int32(params.count), nil, &pointers, nil, nil, 0)
    }

    guard let result else {
      throw DatabaseEngineError.queryFailed(String(cString: PQerrorMessage(connection)))
    }
    defer { PQclear(result) }

    let status = PQresultStatus(result)
    guard status == PGRES_TUPLES_OK || status == PGRES_COMMAND_OK else {
      throw DatabaseEngineError.queryFailed(String(cString: PQresultErrorMessage(result)))
    }
    guard status == PGRES_TUPLES_OK else {
      return QueryResult(columns: [], rows: [])
    }

    let columnCount = PQnfields(result)
    let columns = (0..<columnCount).map { String(cString: PQfname(result, $0)) }
    let rowCount = min(Int(PQntuples(result)), limit)
    let rows = (0..<rowCount).map { rowIndex in
      (0..<columnCount).map { columnIndex in
        PQgetisnull(result, Int32(rowIndex), columnIndex) == 1
          ? ""
          : String(cString: PQgetvalue(result, Int32(rowIndex), columnIndex))
      }
    }
    return QueryResult(columns: columns, rows: rows)
  }

  static func quotedIdentifier(_ name: String) -> String {
    "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }

  static func connInfoValue(_ value: String) -> String {
    "'\(value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "'", with: "\\'"))'"
  }
}

extension String {
  fileprivate func firstMatchInsideParentheses() -> String? {
    guard
      let open = firstIndex(of: "("),
      let close = lastIndex(of: ")"),
      open < close
    else {
      return nil
    }
    return String(self[index(after: open)..<close])
  }
}

import Foundation

public enum DatabaseEngineKind: String, CaseIterable, Codable, Identifiable {
  case sqlite = "SQLite"
  case postgres = "PostgreSQL"
  case mysql = "MySQL"

  public var id: String { rawValue }
}

public enum DatabaseEngineError: Error, Equatable, LocalizedError {
  case connectionFailed(String)
  case queryFailed(String)
  case unsupported(String)

  public var errorDescription: String? {
    switch self {
    case let .connectionFailed(message):
      return "Connection failed: \(message)"
    case let .queryFailed(message):
      return "Query failed: \(message)"
    case let .unsupported(message):
      return message
    }
  }
}

public protocol DatabaseEngine: AnyObject {
  var kind: DatabaseEngineKind { get }
  func listTables() throws -> [DatabaseTable]
  func tableData(
    _ table: DatabaseTable,
    filter: String,
    sortColumn: String?,
    sortAscending: Bool,
    limit: Int,
    offset: Int
  ) throws -> TableData
  func tableSchema(_ table: DatabaseTable) throws -> TableSchema
  func query(_ sql: String, limit: Int) throws -> QueryResult
  func schemaSummary() throws -> String
  func diagram() throws -> DatabaseDiagram
  func searchAllTables(_ term: String) throws -> [DatabaseSearchMatch]
  func quotedIdentifier(_ name: String) -> String
  func close()
}

public struct ColumnDistributionBucket: Equatable, Identifiable {
  public let value: String
  public let count: Int

  public var id: String { value }

  public init(value: String, count: Int) {
    self.value = value
    self.count = count
  }
}

extension DatabaseEngine {
  /// Top values of a column with occurrence counts, for the column stats popover.
  public func columnDistribution(
    table: DatabaseTable,
    column: String,
    limit: Int = 10
  ) throws -> [ColumnDistributionBucket] {
    let quotedColumn = quotedIdentifier(column)
    let quotedTable = quotedIdentifier(table.name)
    let sql = """
      select \(quotedColumn) as value, count(*) as occurrences
      from \(quotedTable)
      group by \(quotedColumn)
      order by occurrences desc
      limit \(max(1, limit))
      """
    let result = try query(sql, limit: max(1, limit))
    return result.rows.compactMap { row in
      guard row.count >= 2, let count = Int(row[1]) else { return nil }
      return ColumnDistributionBucket(value: row[0], count: count)
    }
  }
}

extension DatabaseEngine {
  public func searchAllTables(_ term: String) throws -> [DatabaseSearchMatch] {
    let searchTerm = term.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !searchTerm.isEmpty else { return [] }

    var matches: [DatabaseSearchMatch] = []
    for table in try listTables() {
      let data = try tableData(
        table,
        filter: searchTerm,
        sortColumn: nil,
        sortAscending: true,
        limit: 50,
        offset: 0
      )
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
}

extension SQLiteDatabase: DatabaseEngine {
  public var kind: DatabaseEngineKind { .sqlite }

  public func searchAllTables(_ term: String) throws -> [DatabaseSearchMatch] {
    try searchAllTables(term, limitPerTable: 50)
  }
}

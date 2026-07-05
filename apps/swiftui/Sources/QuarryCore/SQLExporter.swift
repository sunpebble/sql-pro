import Foundation

/// Dumps table data (or a query result) as INSERT statements.
public enum SQLExporter {
  public static func insertStatements(tableName: String, columns: [String], rows: [[String]]) -> String {
    guard !columns.isEmpty else { return "" }
    let quotedTable = quote(tableName)
    let columnList = columns.map(quote).joined(separator: ", ")
    let statements = rows.map { row in
      let values = columns.indices
        .map { row.indices.contains($0) ? literal(row[$0]) : "NULL" }
        .joined(separator: ", ")
      return "insert into \(quotedTable) (\(columnList)) values (\(values));"
    }
    return statements.joined(separator: "\n") + (statements.isEmpty ? "" : "\n")
  }

  public static func export(_ data: TableData) -> String {
    insertStatements(
      tableName: data.table.name,
      columns: data.columns.map(\.name),
      rows: data.rows.map(\.values)
    )
  }

  public static func export(_ result: QueryResult, tableName: String) -> String {
    insertStatements(tableName: tableName, columns: result.columns, rows: result.rows)
  }

  private static func quote(_ name: String) -> String {
    "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }

  private static func literal(_ value: String) -> String {
    if value.isEmpty { return "''" }
    if Int64(value) != nil || Double(value) != nil { return value }
    return "'\(value.replacingOccurrences(of: "'", with: "''"))'"
  }
}

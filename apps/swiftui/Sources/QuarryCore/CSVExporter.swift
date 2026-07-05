import Foundation

public enum CSVExporter {
  public static func encode(_ result: QueryResult) -> String {
    encode(columns: result.columns, rows: result.rows)
  }

  public static func encode(_ tableData: TableData) -> String {
    encode(columns: tableData.columns.map(\.name), rows: tableData.rows.map(\.values))
  }

  public static func encode(columns: [String], rows: [[String]]) -> String {
    ([columns] + rows)
      .map { $0.map(escape).joined(separator: ",") }
      .joined(separator: "\n")
  }

  private static func escape(_ value: String) -> String {
    if value.contains(",") || value.contains("\"") || value.contains("\n") {
      return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
    }
    return value
  }
}

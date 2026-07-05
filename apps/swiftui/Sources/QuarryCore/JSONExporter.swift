import Foundation

public enum JSONExporter {
  public static func encode(_ result: QueryResult) throws -> String {
    try encode(columns: result.columns, rows: result.rows)
  }

  public static func encode(_ tableData: TableData) throws -> String {
    try encode(columns: tableData.columns.map(\.name), rows: tableData.rows.map(\.values))
  }

  public static func encode(columns: [String], rows: [[String]]) throws -> String {
    let objects = rows.map { row in
      Dictionary(uniqueKeysWithValues: columns.enumerated().map { index, column in
        (column, row.indices.contains(index) ? row[index] : "")
      })
    }
    let data = try JSONSerialization.data(withJSONObject: objects, options: [.prettyPrinted, .sortedKeys])
    return String(decoding: data, as: UTF8.self)
  }
}

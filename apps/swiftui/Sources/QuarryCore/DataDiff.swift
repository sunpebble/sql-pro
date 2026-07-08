import Foundation

/// Row-level comparison between two tables (same or different databases).
/// Rows are matched by primary key columns; values compare as their string form
/// because engines surface all cell values as strings.
public struct DataDiff: Equatable {
  public enum RowKind: String, Equatable {
    case added, removed, modified, unchanged
  }

  public struct ColumnChange: Equatable {
    public let columnName: String
    public let sourceValue: String?
    public let targetValue: String?
  }

  public struct RowEntry: Equatable, Identifiable {
    public let kind: RowKind
    public let primaryKey: [String: String]
    public let sourceValues: [String: String]?
    public let targetValues: [String: String]?
    public let columnChanges: [ColumnChange]

    public var id: String {
      "\(kind.rawValue):" + primaryKey.sorted { $0.key < $1.key }
        .map { "\($0.key)=\($0.value)" }
        .joined(separator: "|")
    }
  }

  public struct Summary: Equatable {
    public let sourceRows: Int
    public let targetRows: Int
    public let added: Int
    public let removed: Int
    public let modified: Int
    public let unchanged: Int
  }

  public let primaryKeys: [String]
  public let rows: [RowEntry]
  public let summary: Summary

  public enum DataDiffError: Error, LocalizedError, Equatable {
    case missingPrimaryKey

    public var errorDescription: String? {
      "No primary key columns available for row matching."
    }
  }

  /// Compares source data against target data using the given primary key columns.
  /// If `primaryKeys` is empty, falls back to the source table's primary key columns.
  public init(
    source: TableData,
    target: TableData,
    sourceSchema: TableSchema,
    primaryKeys: [String] = []
  ) throws {
    let keys = primaryKeys.isEmpty
      ? sourceSchema.columns.filter(\.isPrimaryKey).map(\.name)
      : primaryKeys
    guard !keys.isEmpty else { throw DataDiffError.missingPrimaryKey }

    let sourceRows = Self.keyedRows(source)
    let targetRows = Self.keyedRows(target)
    let sourceMap = Self.index(rows: sourceRows, by: keys)
    let targetMap = Self.index(rows: targetRows, by: keys)

    var entries: [RowEntry] = []
    var added = 0, removed = 0, modified = 0, unchanged = 0

    // Stable order: source rows first (removed/modified/unchanged), then target-only rows (added).
    var seen = Set<String>()
    for row in sourceRows {
      let key = Self.matchKey(row, keys: keys)
      guard seen.insert(key).inserted else { continue }
      let pk = Self.primaryKeyValues(row, keys: keys)
      if let targetRow = targetMap[key] {
        let changes = Self.columnChanges(source: row, target: targetRow)
        if changes.isEmpty {
          unchanged += 1
          entries.append(RowEntry(kind: .unchanged, primaryKey: pk, sourceValues: row, targetValues: targetRow, columnChanges: []))
        } else {
          modified += 1
          entries.append(RowEntry(kind: .modified, primaryKey: pk, sourceValues: row, targetValues: targetRow, columnChanges: changes))
        }
      } else {
        removed += 1
        entries.append(RowEntry(kind: .removed, primaryKey: pk, sourceValues: row, targetValues: nil, columnChanges: []))
      }
    }
    for row in targetRows {
      let key = Self.matchKey(row, keys: keys)
      guard sourceMap[key] == nil, seen.insert(key).inserted else { continue }
      added += 1
      entries.append(RowEntry(kind: .added, primaryKey: Self.primaryKeyValues(row, keys: keys), sourceValues: nil, targetValues: row, columnChanges: []))
    }

    self.primaryKeys = keys
    rows = entries
    summary = Summary(
      sourceRows: sourceRows.count,
      targetRows: targetRows.count,
      added: added,
      removed: removed,
      modified: modified,
      unchanged: unchanged
    )
  }

  private static func keyedRows(_ data: TableData) -> [[String: String]] {
    data.rows.map { row in
      var dict: [String: String] = [:]
      for (index, column) in data.columns.enumerated() where row.values.indices.contains(index) {
        dict[column.name] = row.values[index]
      }
      return dict
    }
  }

  private static func index(rows: [[String: String]], by keys: [String]) -> [String: [String: String]] {
    var map: [String: [String: String]] = [:]
    for row in rows {
      let key = matchKey(row, keys: keys)
      if map[key] == nil { map[key] = row }
    }
    return map
  }

  private static func matchKey(_ row: [String: String], keys: [String]) -> String {
    keys.map { row[$0] ?? "__NULL__" }.joined(separator: "\u{1f}")
  }

  private static func primaryKeyValues(_ row: [String: String], keys: [String]) -> [String: String] {
    var pk: [String: String] = [:]
    for key in keys { pk[key] = row[key] ?? "" }
    return pk
  }

  private static func columnChanges(source: [String: String], target: [String: String]) -> [ColumnChange] {
    var changes: [ColumnChange] = []
    for column in Set(source.keys).union(target.keys).sorted() where source[column] != target[column] {
      changes.append(ColumnChange(columnName: column, sourceValue: source[column], targetValue: target[column]))
    }
    return changes
  }
}

/// Generates INSERT/UPDATE/DELETE statements that make the target table match the source.
public enum DataDiffSyncSQL {
  public struct Options {
    public var includeInserts = true
    public var includeUpdates = true
    /// Off by default for safety, mirroring the electron app.
    public var includeDeletes = false

    public init() {}
  }

  public static func generate(diff: DataDiff, targetTable: String, options: Options = Options()) -> [String] {
    var statements: [String] = []
    let table = quote(targetTable)

    if options.includeDeletes {
      for row in diff.rows where row.kind == .removed {
        statements.append("delete from \(table) where \(whereClause(row, keys: diff.primaryKeys));")
      }
    }
    if options.includeUpdates {
      for row in diff.rows where row.kind == .modified {
        let sets = row.columnChanges
          .map { "\(quote($0.columnName)) = \(literal($0.sourceValue))" }
          .joined(separator: ", ")
        statements.append("update \(table) set \(sets) where \(whereClause(row, keys: diff.primaryKeys));")
      }
    }
    if options.includeInserts {
      for row in diff.rows where row.kind == .removed {
        // Rows present only in source are "removed from target": inserting them syncs target to source.
        guard let values = row.sourceValues else { continue }
        let columns = values.keys.sorted()
        let columnList = columns.map(quote).joined(separator: ", ")
        let valueList = columns.map { literal(values[$0]) }.joined(separator: ", ")
        statements.append("insert into \(table) (\(columnList)) values (\(valueList));")
      }
    }
    return statements
  }

  private static func whereClause(_ row: DataDiff.RowEntry, keys: [String]) -> String {
    keys.map { key in
      let value = row.primaryKey[key] ?? ""
      return "\(quote(key)) = \(literal(value))"
    }
    .joined(separator: " and ")
  }

  private static func quote(_ name: String) -> String {
    "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }

  private static func literal(_ value: String?) -> String {
    guard let value else { return "NULL" }
    if value.isEmpty { return "''" }
    // Bare numbers pass through unquoted so integer/real columns keep their type affinity.
    if Int64(value) != nil || Double(value) != nil { return value }
    return "'\(value.replacingOccurrences(of: "'", with: "''"))'"
  }
}

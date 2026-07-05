import XCTest

@testable import QuarryCore

final class DataDiffTests: XCTestCase {
  private func makeTableData(columns: [String], rows: [[String]], primaryKey: String = "id") -> (TableData, TableSchema) {
    let table = DatabaseTable(name: "people", type: "table")
    let dataColumns = columns.map {
      DatabaseColumn(name: $0, type: "text", isPrimaryKey: $0 == primaryKey, isRequired: false)
    }
    let dataRows = rows.enumerated().map { index, values in
      TableDataRow(rowID: Int64(index + 1), values: values)
    }
    let data = TableData(table: table, columns: dataColumns, rows: dataRows, editable: true)
    let schema = TableSchema(
      table: table,
      columns: dataColumns,
      indexes: [],
      foreignKeys: [],
      createSQL: ""
    )
    return (data, schema)
  }

  func testDiffDetectsAddedRemovedModified() throws {
    let (source, schema) = makeTableData(
      columns: ["id", "name"],
      rows: [["1", "Ada"], ["2", "Bob"], ["3", "Cid"]]
    )
    let (target, _) = makeTableData(
      columns: ["id", "name"],
      rows: [["1", "Ada"], ["2", "Bobby"], ["4", "Dee"]]
    )

    let diff = try DataDiff(source: source, target: target, sourceSchema: schema)

    XCTAssertEqual(diff.primaryKeys, ["id"])
    XCTAssertEqual(diff.summary.unchanged, 1) // id=1
    XCTAssertEqual(diff.summary.modified, 1) // id=2
    XCTAssertEqual(diff.summary.removed, 1) // id=3 only in source
    XCTAssertEqual(diff.summary.added, 1) // id=4 only in target

    let modified = diff.rows.first { $0.kind == .modified }
    XCTAssertEqual(modified?.columnChanges, [
      DataDiff.ColumnChange(columnName: "name", sourceValue: "Bob", targetValue: "Bobby"),
    ])
  }

  func testDiffThrowsWithoutPrimaryKey() throws {
    let (source, _) = makeTableData(columns: ["a"], rows: [["1"]])
    let table = DatabaseTable(name: "people", type: "table")
    let schema = TableSchema(
      table: table,
      columns: [DatabaseColumn(name: "a", type: "text", isPrimaryKey: false, isRequired: false)],
      indexes: [],
      foreignKeys: [],
      createSQL: ""
    )
    XCTAssertThrowsError(try DataDiff(source: source, target: source, sourceSchema: schema))
  }

  func testSyncSQLGeneratesInsertUpdateDelete() throws {
    let (source, schema) = makeTableData(
      columns: ["id", "name"],
      rows: [["1", "Ada"], ["2", "Bob"]]
    )
    let (target, _) = makeTableData(
      columns: ["id", "name"],
      rows: [["1", "Al'ice"], ["9", "Zoe"]]
    )
    let diff = try DataDiff(source: source, target: target, sourceSchema: schema)

    var options = DataDiffSyncSQL.Options()
    options.includeDeletes = true
    let sql = DataDiffSyncSQL.generate(diff: diff, targetTable: "people", options: options)

    // update id=1 to source value, insert id=2, delete id=9
    XCTAssertTrue(sql.contains(#"update "people" set "name" = 'Ada' where "id" = 1;"#))
    XCTAssertTrue(sql.contains(#"insert into "people" ("id", "name") values (2, 'Bob');"#))
    // deletes cover rows only present in target? No: removed = source-only rows.
    // The delete list stays empty here because id=9 is an *added* row (target-only).
    XCTAssertFalse(sql.contains("delete"))

    // Reverse direction: now id=9 is source-only, so syncing target means deleting nothing,
    // but comparing target->source marks id=9 as removed and generates its insert.
    let reverse = try DataDiff(source: target, target: source, sourceSchema: schema)
    let reverseSQL = DataDiffSyncSQL.generate(diff: reverse, targetTable: "people", options: options)
    XCTAssertTrue(reverseSQL.contains(#"insert into "people" ("id", "name") values (9, 'Zoe');"#))
    XCTAssertTrue(reverseSQL.contains(#"update "people" set "name" = 'Al''ice' where "id" = 1;"#))
  }

  func testSQLExporterEscapesAndTypes() {
    let sql = SQLExporter.insertStatements(
      tableName: "notes",
      columns: ["id", "body"],
      rows: [["1", "it's fine"], ["2", "42"]]
    )
    XCTAssertTrue(sql.contains(#"insert into "notes" ("id", "body") values (1, 'it''s fine');"#))
    XCTAssertTrue(sql.contains(#"insert into "notes" ("id", "body") values (2, 42);"#))
  }

  func testSqlLogAppendsNewestFirstAndCaps() {
    var log: [SqlLogEntry] = []
    for index in 0..<205 {
      log = SqlLogEntry.appending(SqlLogEntry(sql: "select \(index)", duration: 0.001), to: log)
    }
    XCTAssertEqual(log.count, 200)
    XCTAssertEqual(log.first?.sql, "select 204")
  }

  func testColumnDistributionViaSQLite() throws {
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent("quarry-dist-\(UUID().uuidString).sqlite")
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table t (id integer primary key, city text)")
    try database.execute("insert into t (city) values ('SF'), ('SF'), ('NY')")

    let table = DatabaseTable(name: "t", type: "table")
    let buckets = try database.columnDistribution(table: table, column: "city")
    XCTAssertEqual(buckets.first, ColumnDistributionBucket(value: "SF", count: 2))
    XCTAssertEqual(buckets.count, 2)
  }
}

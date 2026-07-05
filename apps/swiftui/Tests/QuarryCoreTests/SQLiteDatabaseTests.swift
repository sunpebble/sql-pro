import Foundation
import XCTest
@testable import QuarryCore

final class SQLiteDatabaseTests: XCTestCase {
  func testListsTablesAndRunsQuery() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada'), ('Linus')")

    XCTAssertEqual(try database.listTables(), [DatabaseTable(name: "people", type: "table")])

    let result = try database.query("select id, name from people order by id")
    XCTAssertEqual(result.columns, ["id", "name"])
    XCTAssertEqual(result.rows, [["1", "Ada"], ["2", "Linus"]])
  }

  func testQueryLimitCapsRows() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table numbers (value integer)")
    try database.execute("insert into numbers (value) values (1), (2), (3)")

    let result = try database.query("select value from numbers order by value", limit: 2)
    XCTAssertEqual(result.rows, [["1"], ["2"]])
  }

  func testLoadsEditableTableDataAndAppliesCellChanges() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada'), ('Linus')")

    let table = DatabaseTable(name: "people", type: "table")
    let data = try database.tableData(table)

    XCTAssertTrue(data.editable)
    XCTAssertEqual(data.columns.map(\.name), ["id", "name"])
    XCTAssertEqual(data.columns.first?.isPrimaryKey, true)
    XCTAssertEqual(data.rows.map(\.values), [["1", "Ada"], ["2", "Linus"]])

    let rowID = try XCTUnwrap(data.rows.first?.rowID)
    try database.applyChanges([
      TableCellChange(
        tableName: "people",
        rowID: rowID,
        columnName: "name",
        oldValue: "Ada",
        newValue: "Grace"
      ),
    ])

    let result = try database.query("select name from people where id = 1")
    XCTAssertEqual(result.rows, [["Grace"]])
  }

  func testInsertsDeletesAndFiltersTableRows() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada'), ('Linus')")

    let table = DatabaseTable(name: "people", type: "table")
    try database.insertBlankRow(into: table)

    XCTAssertEqual(
      try database.tableData(table).rows.map(\.values),
      [["1", "Ada"], ["2", "Linus"], ["3", ""]]
    )

    let filtered = try database.tableData(table, filter: "lin")
    XCTAssertEqual(filtered.rows.map(\.values), [["2", "Linus"]])

    let rowID = try XCTUnwrap(filtered.rows.first?.rowID)
    try database.deleteRows(from: table, rowIDs: [rowID])

    XCTAssertEqual(
      try database.query("select name from people order by id").rows,
      [["Ada"], [""]]
    )
  }

  func testSortsTableRowsByColumn() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Linus'), ('Ada'), ('Grace')")

    let table = DatabaseTable(name: "people", type: "table")
    let sorted = try database.tableData(table, sortColumn: "name", sortAscending: true)

    XCTAssertEqual(sorted.rows.map(\.values), [["2", "Ada"], ["3", "Grace"], ["1", "Linus"]])
  }

  func testPagesTableRowsWithOffset() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada'), ('Grace'), ('Linus'), ('Alan'), ('Edsger')")

    let table = DatabaseTable(name: "people", type: "table")
    let firstPage = try database.tableData(table, sortColumn: "id", sortAscending: true, limit: 2)
    let secondPage = try database.tableData(table, sortColumn: "id", sortAscending: true, limit: 2, offset: 2)
    let lastPage = try database.tableData(table, sortColumn: "id", sortAscending: true, limit: 2, offset: 4)

    XCTAssertEqual(firstPage.rows.map(\.values), [["1", "Ada"], ["2", "Grace"]])
    XCTAssertEqual(secondPage.rows.map(\.values), [["3", "Linus"], ["4", "Alan"]])
    XCTAssertEqual(lastPage.rows.map(\.values), [["5", "Edsger"]])
  }

  func testSearchAllTablesFindsMatchingCells() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null, notes text)")
    try database.execute("create table teams (id integer primary key, name text not null)")
    try database.execute("insert into people (name, notes) values ('Ada', 'compiler'), ('Linus', 'kernel')")
    try database.execute("insert into teams (name) values ('Core')")

    let matches = try database.searchAllTables("ada")

    XCTAssertEqual(matches.count, 1)
    XCTAssertEqual(matches[0].tableName, "people")
    XCTAssertEqual(matches[0].columnName, "name")
    XCTAssertEqual(matches[0].value, "Ada")
    XCTAssertEqual(matches[0].rowID, 1)
  }

  func testLoadsTableSchemaDetails() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table teams (id integer primary key, name text not null)")
    try database.execute("""
      create table people (
        id integer primary key,
        team_id integer not null references teams(id) on delete cascade,
        name text not null
      )
      """)
    try database.execute("create index people_team_id_idx on people(team_id)")

    let schema = try database.tableSchema(DatabaseTable(name: "people", type: "table"))

    XCTAssertEqual(schema.columns.map(\.name), ["id", "team_id", "name"])
    XCTAssertEqual(schema.indexes, [
      DatabaseIndex(name: "people_team_id_idx", isUnique: false, columns: ["team_id"]),
    ])
    XCTAssertEqual(schema.foreignKeys, [
      DatabaseForeignKey(
        id: "0:0",
        table: "teams",
        fromColumn: "team_id",
        toColumn: "id",
        onUpdate: "NO ACTION",
        onDelete: "CASCADE"
      ),
    ])
    XCTAssertTrue(schema.createSQL.lowercased().contains("create table people"))
  }

  func testBackupAndRestoreDatabase() throws {
    let url = temporaryDatabaseURL()
    let backupURL = temporaryDatabaseURL()
    defer {
      try? FileManager.default.removeItem(at: url)
      try? FileManager.default.removeItem(at: backupURL)
    }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada')")
    try database.backup(to: backupURL)

    try database.execute("update people set name = 'Grace' where id = 1")
    XCTAssertEqual(try database.query("select name from people").rows, [["Grace"]])

    try database.restore(from: backupURL)
    XCTAssertEqual(try database.query("select name from people").rows, [["Ada"]])
  }

  func testEncryptedDatabaseRequiresPasswordAndReopensWithPassword() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    do {
      let database = try SQLiteDatabase(url: url, readOnly: false, password: "secret")
      try database.execute("create table people (id integer primary key, name text not null)")
      try database.execute("insert into people (name) values ('Ada')")
    }

    XCTAssertThrowsError(try SQLiteDatabase(url: url, readOnly: false)) { error in
      XCTAssertEqual(error as? SQLiteDatabaseError, .passwordRequired)
    }

    let reopened = try SQLiteDatabase(url: url, readOnly: false, password: "secret")
    XCTAssertEqual(try reopened.query("select name from people").rows, [["Ada"]])
  }

  func testCSVImporterParsesQuotedFieldsAndImportsRows() throws {
    let document = CSVImporter.parse("name,notes\nAda,\"hello, \"\"sqlite\"\"\"\nLinus,\"line\nbreak\"\n")
    XCTAssertEqual(document.headers, ["name", "notes"])
    XCTAssertEqual(document.rows, [
      ["Ada", "hello, \"sqlite\""],
      ["Linus", "line\nbreak"],
    ])

    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null, notes text)")

    let inserted = try database.importCSV(document, into: DatabaseTable(name: "people", type: "table"))

    XCTAssertEqual(inserted, 2)
    XCTAssertEqual(
      try database.query("select name, notes from people order by id").rows,
      [["Ada", "hello, \"sqlite\""], ["Linus", "line\nbreak"]]
    )
  }

  func testExplainQueryPlan() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("create index people_name_idx on people(name)")

    let plan = try database.explainQueryPlan("select * from people where name = 'Ada'")

    XCTAssertFalse(plan.isEmpty)
    XCTAssertTrue(plan.contains { $0.detail.lowercased().contains("people") })
  }

  func testDatabaseMaintenanceChecksAndInfo() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada')")

    XCTAssertEqual(try database.integrityCheck(), ["ok"])
    XCTAssertEqual(try database.quickCheck(), ["ok"])

    let info = try database.databaseInfo()
    XCTAssertTrue(info.contains { $0.name == "Page Count" && !$0.value.isEmpty })
    XCTAssertTrue(info.contains { $0.name == "Page Size" && Int($0.value) != nil })
    XCTAssertTrue(info.contains { $0.name == "Database main" })
  }

  func testOptimizeAndVacuumRun() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("insert into people (name) values ('Ada'), ('Linus')")
    try database.execute("delete from people where name = 'Linus'")

    XCTAssertFalse(try database.optimize().isEmpty)
    XCTAssertNoThrow(try database.vacuum())
    XCTAssertEqual(try database.query("select name from people").rows, [["Ada"]])
  }

  func testBulkEditBuildsPreviewableChanges() {
    let table = DatabaseTable(name: "people", type: "table")
    let tableData = TableData(
      table: table,
      columns: [
        DatabaseColumn(name: "id", type: "integer", isPrimaryKey: true, isRequired: false),
        DatabaseColumn(name: "role", type: "text", isPrimaryKey: false, isRequired: false),
      ],
      rows: [
        TableDataRow(rowID: 1, values: ["1", "admin"]),
        TableDataRow(rowID: 2, values: ["2", "user"]),
        TableDataRow(rowID: 3, values: ["3", "user"]),
      ],
      editable: true
    )

    let changes = TableBulkEdit.changes(
      tableData: tableData,
      rowIDs: [1, 2, 3],
      columnName: "role",
      newValue: "user"
    )

    XCTAssertEqual(changes, [
      TableCellChange(tableName: "people", rowID: 1, columnName: "role", oldValue: "admin", newValue: "user"),
    ])
  }

  func testBuildsDatabaseDiagramRelationships() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table teams (id integer primary key)")
    try database.execute("create table people (id integer primary key, team_id integer references teams(id))")

    let diagram = try database.diagram()

    XCTAssertEqual(diagram.tables.map(\.name), ["people", "teams"])
    XCTAssertEqual(diagram.relationships, [
      DatabaseRelationship(fromTable: "people", fromColumn: "team_id", toTable: "teams", toColumn: "id"),
    ])
  }

  func testRecentDatabasePathsDeduplicateAndLimit() {
    let paths = RecentDatabasePaths.adding(
      "/tmp/new.sqlite",
      to: ["/tmp/old.sqlite", "/tmp/new.sqlite", "/tmp/other.sqlite"],
      limit: 2
    )

    XCTAssertEqual(paths, ["/tmp/new.sqlite", "/tmp/old.sqlite"])
  }

  func testConnectionProfilesSaveByPathAndMarkOpened() throws {
    let first = ConnectionProfile(
      id: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
      name: "Old",
      path: "/tmp/app.sqlite",
      isEncrypted: false,
      createdAt: Date(timeIntervalSince1970: 1),
      lastOpenedAt: Date(timeIntervalSince1970: 1)
    )
    let replacement = ConnectionProfile(
      id: UUID(uuidString: "00000000-0000-0000-0000-000000000002")!,
      name: "New",
      path: "/tmp/app.sqlite",
      isEncrypted: true,
      createdAt: Date(timeIntervalSince1970: 2),
      lastOpenedAt: Date(timeIntervalSince1970: 2)
    )

    let saved = ConnectionProfiles.saving(replacement, in: [first])
    XCTAssertEqual(saved, [replacement])

    let openedAt = Date(timeIntervalSince1970: 3)
    let marked = ConnectionProfiles.markingOpened(replacement, in: saved, now: openedAt)
    XCTAssertEqual(marked[0].lastOpenedAt, openedAt)
    XCTAssertEqual(marked[0].createdAt, replacement.createdAt)
  }

  func testCSVExporterEscapesFields() {
    let csv = CSVExporter.encode(
      columns: ["name", "notes"],
      rows: [["Ada", "hello, \"sqlite\"\nworld"]]
    )

    XCTAssertEqual(csv, "name,notes\nAda,\"hello, \"\"sqlite\"\"\nworld\"")
  }

  func testJSONImporterExporterAndImportsRows() throws {
    let json = try JSONExporter.encode(
      columns: ["name", "notes"],
      rows: [["Ada", "hello, sqlite"]]
    )
    XCTAssertTrue(json.contains("\"name\" : \"Ada\""))

    let document = try JSONImporter.parse("""
      [
        {"name": "Ada", "active": true, "age": 42, "meta": {"team": "core"}}
      ]
      """)

    XCTAssertEqual(document.headers, ["active", "age", "meta", "name"])
    XCTAssertEqual(document.rows, [["true", "42", "{\"team\":\"core\"}", "Ada"]])

    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, active text, age text, meta text, name text)")

    let inserted = try database.importCSV(document, into: DatabaseTable(name: "people", type: "table"))

    XCTAssertEqual(inserted, 1)
    XCTAssertEqual(
      try database.query("select active, age, meta, name from people").rows,
      [["true", "42", "{\"team\":\"core\"}", "Ada"]]
    )
  }

  func testQueryLibraryRecordsAndSavesQueries() {
    let first = Date(timeIntervalSince1970: 1)
    let second = Date(timeIntervalSince1970: 2)

    let history = QueryLibrary.recording("select 1", in: [], now: first)
    let rerunHistory = QueryLibrary.recording(" select 1\n", in: history, now: second)

    XCTAssertEqual(rerunHistory.count, 1)
    XCTAssertEqual(rerunHistory[0].sql, "select 1")
    XCTAssertEqual(rerunHistory[0].runCount, 2)
    XCTAssertEqual(rerunHistory[0].createdAt, first)
    XCTAssertEqual(rerunHistory[0].lastRunAt, second)

    let saved = QueryLibrary.saving("select 1", in: [])
    XCTAssertEqual(QueryLibrary.saving("select 1", in: saved).count, 1)
  }

  func testSchemaSummaryIncludesCreateSQL() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text)")

    XCTAssertTrue(try database.schemaSummary().lowercased().contains("create table people"))
  }

  private func temporaryDatabaseURL() -> URL {
    FileManager.default.temporaryDirectory
      .appendingPathComponent("quarry-\(UUID().uuidString)")
      .appendingPathExtension("sqlite")
  }
}

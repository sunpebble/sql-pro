import QuarryCore
import XCTest

// Integration tests against a live server; run with:
//   QUARRY_MYSQL_TEST_PORT=54330 swift test --filter MySQLEngineTests
final class MySQLEngineTests: XCTestCase {
  private func makeEngine() throws -> MySQLEngine {
    guard let port = ProcessInfo.processInfo.environment["QUARRY_MYSQL_TEST_PORT"].flatMap(Int.init) else {
      throw XCTSkip("Set QUARRY_MYSQL_TEST_PORT to run MySQL integration tests.")
    }
    return try MySQLEngine(
      host: "127.0.0.1",
      port: port,
      database: "quarrytest",
      user: "root",
      password: ""
    )
  }

  func testListsTablesAndViews() throws {
    let engine = try makeEngine()
    let tables = try engine.listTables()

    XCTAssertEqual(tables.filter { $0.type == "table" }.map(\.name), ["people", "teams"])
    XCTAssertEqual(tables.filter { $0.type == "view" }.map(\.name), ["active_people"])
  }

  func testTableDataSupportsFilterSortAndPaging() throws {
    let engine = try makeEngine()
    let people = DatabaseTable(name: "people", type: "table")

    let sorted = try engine.tableData(people, filter: "", sortColumn: "name", sortAscending: true, limit: 10, offset: 0)
    XCTAssertEqual(sorted.rows.map { $0.values[1] }, ["Ada", "Grace", "Linus"])
    XCTAssertFalse(sorted.editable)

    let paged = try engine.tableData(people, filter: "", sortColumn: "name", sortAscending: true, limit: 1, offset: 1)
    XCTAssertEqual(paged.rows.map { $0.values[1] }, ["Grace"])

    let filtered = try engine.tableData(people, filter: "example.com", sortColumn: "name", sortAscending: true, limit: 10, offset: 0)
    XCTAssertEqual(filtered.rows.count, 2)
  }

  func testTableSchemaReportsColumnsIndexesAndForeignKeys() throws {
    let engine = try makeEngine()
    let schema = try engine.tableSchema(DatabaseTable(name: "people", type: "table"))

    XCTAssertEqual(schema.columns.map(\.name), ["id", "name", "email", "team_id"])
    XCTAssertTrue(schema.columns.first { $0.name == "id" }?.isPrimaryKey ?? false)
    XCTAssertTrue(schema.columns.first { $0.name == "name" }?.isRequired ?? false)
    XCTAssertTrue(schema.indexes.contains { $0.name == "people_name_idx" })
    XCTAssertTrue(schema.createSQL.contains("CREATE TABLE"))

    let foreignKey = try XCTUnwrap(schema.foreignKeys.first)
    XCTAssertEqual(foreignKey.table, "teams")
    XCTAssertEqual(foreignKey.fromColumn, "team_id")
    XCTAssertEqual(foreignKey.toColumn, "id")
  }

  func testQueryAndCommands() throws {
    let engine = try makeEngine()

    let result = try engine.query("select name from people where email is not null order by name", limit: 10)
    XCTAssertEqual(result.columns, ["name"])
    XCTAssertEqual(result.rows, [["Ada"], ["Grace"]])

    XCTAssertThrowsError(try engine.query("select * from missing_table", limit: 10))
  }

  func testDiagramAndSearch() throws {
    let engine = try makeEngine()

    let diagram = try engine.diagram()
    XCTAssertTrue(diagram.relationships.contains {
      $0.fromTable == "people" && $0.toTable == "teams"
    })

    let matches = try engine.searchAllTables("grace@example.com")
    XCTAssertEqual(matches.count, 1)
    XCTAssertEqual(matches.first?.tableName, "people")
  }
}

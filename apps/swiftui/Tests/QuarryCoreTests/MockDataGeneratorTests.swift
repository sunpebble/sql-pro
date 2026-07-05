import Foundation
import XCTest
@testable import QuarryCore

final class MockDataGeneratorTests: XCTestCase {
  private let columns = [
    DatabaseColumn(name: "id", type: "INTEGER", isPrimaryKey: true, isRequired: false),
    DatabaseColumn(name: "name", type: "TEXT", isPrimaryKey: false, isRequired: true),
    DatabaseColumn(name: "email", type: "varchar(255)", isPrimaryKey: false, isRequired: false),
    DatabaseColumn(name: "age", type: "int", isPrimaryKey: false, isRequired: false),
    DatabaseColumn(name: "score", type: "REAL", isPrimaryKey: false, isRequired: false),
    DatabaseColumn(name: "created_at", type: "NUMERIC", isPrimaryKey: false, isRequired: false),
    DatabaseColumn(name: "avatar", type: "BLOB", isPrimaryKey: false, isRequired: false),
  ]

  func testDeterministicForSameSeed() {
    let first = MockDataGenerator.generate(columns: columns, rowCount: 20, seed: 42)
    let second = MockDataGenerator.generate(columns: columns, rowCount: 20, seed: 42)
    let other = MockDataGenerator.generate(columns: columns, rowCount: 20, seed: 7)

    XCTAssertEqual(first, second)
    XCTAssertNotEqual(first.rows, other.rows)
  }

  func testSkipsPrimaryKeyColumns() {
    let data = MockDataGenerator.generate(columns: columns, rowCount: 3, seed: 1)

    XCTAssertEqual(data.columns.map(\.name), ["name", "email", "age", "score", "created_at", "avatar"])
    XCTAssertEqual(data.rows.count, 3)
    XCTAssertTrue(data.rows.allSatisfy { $0.count == data.columns.count })
  }

  func testGeneratesTypeAwareValues() throws {
    let data = MockDataGenerator.generate(columns: columns, rowCount: 10, seed: 99)

    for row in data.rows {
      XCTAssertTrue(row[0].contains(" "), "name should look like a person name: \(row[0])")
      XCTAssertTrue(row[1].contains("@"), "email should contain @: \(row[1])")
      XCTAssertNotNil(Int(row[2]), "age should be an integer: \(row[2])")
      let score = try XCTUnwrap(Double(row[3]), "score should be a decimal: \(row[3])")
      XCTAssertTrue(row[3].contains("."), "score should have decimals: \(row[3])")
      XCTAssertGreaterThanOrEqual(score, 0)
      XCTAssertNotNil(
        row[4].range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression),
        "created_at should be an ISO date: \(row[4])"
      )
      XCTAssertEqual(row[5], "", "blob should be empty")
    }
  }

  func testGeneratedDataImportsIntoDatabase() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("""
      create table people (
        id integer primary key,
        name text not null,
        email text,
        age integer,
        score real,
        created_at numeric,
        avatar blob
      )
      """)

    let table = DatabaseTable(name: "people", type: "table")
    let generated = MockDataGenerator.generate(columns: try database.columns(in: table), rowCount: 25, seed: 42)
    let inserted = try database.importCSV(generated.document, into: table)

    XCTAssertEqual(inserted, 25)
    XCTAssertEqual(try database.query("select count(*) from people").rows, [["25"]])
    XCTAssertEqual(
      try database.query("select count(*) from people where email like '%@%'").rows,
      [["25"]]
    )
  }

  private func temporaryDatabaseURL() -> URL {
    FileManager.default.temporaryDirectory
      .appendingPathComponent("quarry-\(UUID().uuidString)")
      .appendingPathExtension("sqlite")
  }
}

import Foundation
import XCTest
@testable import QuarryCore

final class SchemaDiffTests: XCTestCase {
  func testDiffDetectsTableColumnAndIndexChanges() throws {
    let oldURL = temporaryDatabaseURL()
    let newURL = temporaryDatabaseURL()
    defer {
      try? FileManager.default.removeItem(at: oldURL)
      try? FileManager.default.removeItem(at: newURL)
    }

    let oldDatabase = try SQLiteDatabase(url: oldURL, readOnly: false)
    try oldDatabase.execute("create table people (id integer primary key, name text not null, age integer)")
    try oldDatabase.execute("create index people_name_idx on people(name)")
    try oldDatabase.execute("create table legacy (id integer primary key)")

    let newDatabase = try SQLiteDatabase(url: newURL, readOnly: false)
    try newDatabase.execute("create table people (id integer primary key, name text, email text)")
    try newDatabase.execute("create index people_email_idx on people(email)")
    try newDatabase.execute("create table orders (id integer primary key, total real)")
    try newDatabase.execute("create unique index orders_total_idx on orders(total)")

    let diff = SchemaDiff(
      from: try SchemaSnapshot.capture(from: oldDatabase),
      to: try SchemaSnapshot.capture(from: newDatabase)
    )

    XCTAssertEqual(diff.entries.map(\.kind), [
      .tableAdded, .tableDropped,
      .columnAdded, .columnDropped, .columnChanged,
      .indexAdded, .indexDropped,
    ])
    XCTAssertEqual(diff.entries.map(\.description), [
      "Added table \"orders\"",
      "Dropped table \"legacy\"",
      "Added column \"email\" to \"people\"",
      "Dropped column \"age\" from \"people\"",
      "Changed column \"name\" in \"people\": now nullable",
      "Added index \"people_email_idx\" on \"people\"",
      "Dropped index \"people_name_idx\" from \"people\"",
    ])

    XCTAssertEqual(diff.migrationSQL, [
      "CREATE TABLE orders (id integer primary key, total real);",
      "create unique index \"orders_total_idx\" on \"orders\" (\"total\");",
      "drop table \"legacy\";",
      "alter table \"people\" add column \"email\" TEXT;",
      "-- manual migration required: drop column \"age\" from \"people\" (sqlite cannot drop columns; recreate the table)",
      "-- manual migration required: change column \"name\" in \"people\" (now nullable); recreate the table",
      "create index \"people_email_idx\" on \"people\" (\"email\");",
      "drop index \"people_name_idx\";",
    ])
  }

  func testIdenticalSchemasProduceEmptyDiff() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try SQLiteDatabase(url: url, readOnly: false)
    try database.execute("create table people (id integer primary key, name text not null)")
    try database.execute("create index people_name_idx on people(name)")

    let snapshot = try SchemaSnapshot.capture(from: database)
    let diff = SchemaDiff(from: snapshot, to: snapshot)

    XCTAssertTrue(diff.isEmpty)
    XCTAssertEqual(diff.entries, [])
    XCTAssertEqual(diff.migrationSQL, [])
  }

  func testChangedIndexDefinitionIsDroppedAndRecreated() throws {
    let oldURL = temporaryDatabaseURL()
    let newURL = temporaryDatabaseURL()
    defer {
      try? FileManager.default.removeItem(at: oldURL)
      try? FileManager.default.removeItem(at: newURL)
    }

    let oldDatabase = try SQLiteDatabase(url: oldURL, readOnly: false)
    try oldDatabase.execute("create table people (id integer primary key, name text)")
    try oldDatabase.execute("create index people_name_idx on people(name)")

    let newDatabase = try SQLiteDatabase(url: newURL, readOnly: false)
    try newDatabase.execute("create table people (id integer primary key, name text)")
    try newDatabase.execute("create unique index people_name_idx on people(name)")

    let diff = SchemaDiff(
      from: try SchemaSnapshot.capture(from: oldDatabase),
      to: try SchemaSnapshot.capture(from: newDatabase)
    )

    XCTAssertEqual(diff.entries.map(\.kind), [.indexDropped, .indexAdded])
    XCTAssertEqual(diff.migrationSQL, [
      "drop index \"people_name_idx\";",
      "create unique index \"people_name_idx\" on \"people\" (\"name\");",
    ])
  }

  func testSchemaSnapshotJSONRoundTripPreservesDiff() throws {
    let oldURL = temporaryDatabaseURL()
    let newURL = temporaryDatabaseURL()
    defer {
      try? FileManager.default.removeItem(at: oldURL)
      try? FileManager.default.removeItem(at: newURL)
    }

    let oldDatabase = try SQLiteDatabase(url: oldURL, readOnly: false)
    try oldDatabase.execute("create table people (id integer primary key, name text)")

    let newDatabase = try SQLiteDatabase(url: newURL, readOnly: false)
    try newDatabase.execute("create table people (id integer primary key, name text, email text)")
    try newDatabase.execute("create index people_email_idx on people(email)")

    let oldSnapshot = try SchemaSnapshot.capture(from: oldDatabase)
    let newSnapshot = try SchemaSnapshot.capture(from: newDatabase)

    let decodedOld = try JSONDecoder().decode(SchemaSnapshot.self, from: JSONEncoder().encode(oldSnapshot))
    let decodedNew = try JSONDecoder().decode(SchemaSnapshot.self, from: JSONEncoder().encode(newSnapshot))

    XCTAssertEqual(decodedOld, oldSnapshot)
    XCTAssertEqual(decodedNew, newSnapshot)
    XCTAssertEqual(
      SchemaDiff(from: decodedOld, to: decodedNew),
      SchemaDiff(from: oldSnapshot, to: newSnapshot)
    )
  }

  private func temporaryDatabaseURL() -> URL {
    FileManager.default.temporaryDirectory
      .appendingPathComponent("quarry-\(UUID().uuidString)")
      .appendingPathExtension("sqlite")
  }
}

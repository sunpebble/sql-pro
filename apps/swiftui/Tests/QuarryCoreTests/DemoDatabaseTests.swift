import QuarryCore
import XCTest

final class DemoDatabaseTests: XCTestCase {
  func testCreatesFullDemoStore() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try DemoDatabase.create(at: url)
    let tables = try database.listTables()

    XCTAssertEqual(
      tables.filter { $0.type == "table" }.map(\.name).sorted(),
      ["customers", "order_items", "orders", "products"]
    )
    XCTAssertEqual(tables.filter { $0.type == "view" }.map(\.name), ["order_totals"])

    XCTAssertEqual(
      try database.query("select count(*) from customers", limit: 1).rows,
      [["\(DemoDatabase.customerCount)"]]
    )
    XCTAssertEqual(
      try database.query("select count(*) from order_items", limit: 1).rows,
      [["\(DemoDatabase.orderItemCount)"]]
    )
  }

  func testForeignKeysAreValidAndJoinable() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try DemoDatabase.create(at: url)

    XCTAssertEqual(
      try database.query(
        "select count(*) from orders o left join customers c on c.id = o.customer_id where c.id is null",
        limit: 1
      ).rows,
      [["0"]]
    )
    XCTAssertEqual(
      try database.query(
        "select count(*) from order_items i left join products p on p.id = i.product_id where p.id is null",
        limit: 1
      ).rows,
      [["0"]]
    )

    let totals = try database.query("select * from order_totals limit 5", limit: 5)
    XCTAssertEqual(totals.columns, ["order_id", "customer", "total"])
    XCTAssertFalse(totals.rows.isEmpty)
  }

  func testDiagramShowsStoreRelationships() throws {
    let url = temporaryDatabaseURL()
    defer { try? FileManager.default.removeItem(at: url) }

    let database = try DemoDatabase.create(at: url)
    let diagram = try database.diagram()

    XCTAssertEqual(diagram.relationships.count, 3)
    XCTAssertTrue(diagram.relationships.contains { $0.fromTable == "orders" && $0.toTable == "customers" })
    XCTAssertTrue(diagram.relationships.contains { $0.fromTable == "order_items" && $0.toTable == "orders" })
    XCTAssertTrue(diagram.relationships.contains { $0.fromTable == "order_items" && $0.toTable == "products" })
  }

  private func temporaryDatabaseURL() -> URL {
    FileManager.default.temporaryDirectory
      .appendingPathComponent("quarry-demo-test-\(UUID().uuidString).sqlite")
  }
}

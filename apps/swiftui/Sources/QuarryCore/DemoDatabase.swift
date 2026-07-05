import Foundation

// Builds the bundled-style demo store database used for trying out the app
// and for integration-style tests: related tables, FKs, indexes, and a view.
public enum DemoDatabase {
  public static let customerCount = 200
  public static let productCount = 50
  public static let orderCount = 500
  public static let orderItemCount = 1000

  @discardableResult
  public static func create(at url: URL, seed: UInt64 = 42) throws -> SQLiteDatabase {
    try? FileManager.default.removeItem(at: url)
    let database = try SQLiteDatabase(url: url, readOnly: false)

    try database.execute("""
      create table customers (
        id integer primary key autoincrement,
        name text not null,
        email text,
        city text,
        created_at text
      )
      """)
    try database.execute("""
      create table products (
        id integer primary key autoincrement,
        title text not null,
        price real,
        sku text
      )
      """)
    try database.execute("""
      create table orders (
        id integer primary key autoincrement,
        customer_id integer references customers(id),
        ordered_at text,
        status text
      )
      """)
    try database.execute("""
      create table order_items (
        id integer primary key autoincrement,
        order_id integer references orders(id),
        product_id integer references products(id),
        quantity integer,
        unit_price real
      )
      """)
    try database.execute("create index orders_customer_idx on orders (customer_id)")
    try database.execute("create index order_items_order_idx on order_items (order_id)")
    try database.execute("""
      create view order_totals as
      select o.id as order_id, c.name as customer, sum(i.quantity * i.unit_price) as total
      from orders o
      join customers c on c.id = o.customer_id
      join order_items i on i.order_id = o.id
      group by o.id, c.name
      """)

    try fill(database, table: "customers", rows: customerCount, seed: seed)
    try fill(database, table: "products", rows: productCount, seed: seed &+ 1)
    try fill(database, table: "orders", rows: orderCount, seed: seed &+ 2)
    try fill(database, table: "order_items", rows: orderItemCount, seed: seed &+ 3)

    // Mock values are type-based; remap FK and enum-ish columns to valid values.
    try database.execute("""
      update orders set
        customer_id = (abs(random()) % \(customerCount)) + 1,
        status = case abs(random()) % 3 when 0 then 'pending' when 1 then 'shipped' else 'delivered' end
      """)
    try database.execute("""
      update order_items set
        order_id = (abs(random()) % \(orderCount)) + 1,
        product_id = (abs(random()) % \(productCount)) + 1,
        quantity = (abs(random()) % 5) + 1,
        unit_price = round(((abs(random()) % 9000) + 100) / 100.0, 2)
      """)

    return database
  }

  private static func fill(_ database: SQLiteDatabase, table name: String, rows: Int, seed: UInt64) throws {
    let table = DatabaseTable(name: name, type: "table")
    let columns = try database.columns(in: table)
    let generated = MockDataGenerator.generate(columns: columns, rowCount: rows, seed: seed)
    _ = try database.importCSV(generated.document, into: table)
  }
}

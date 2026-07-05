import Foundation

public struct SchemaSnapshot: Codable, Equatable {
  public struct Column: Codable, Equatable {
    public let name: String
    public let type: String
    public let isPrimaryKey: Bool
    public let isRequired: Bool
  }

  public struct Index: Codable, Equatable {
    public let name: String
    public let isUnique: Bool
    public let columns: [String]
  }

  public struct Table: Codable, Equatable {
    public let name: String
    public let columns: [Column]
    public let indexes: [Index]
    public let createSQL: String
  }

  public let tables: [Table]

  public init(tables: [TableSchema]) {
    self.tables = tables.map { schema in
      Table(
        name: schema.table.name,
        columns: schema.columns.map {
          Column(name: $0.name, type: $0.type, isPrimaryKey: $0.isPrimaryKey, isRequired: $0.isRequired)
        },
        indexes: schema.indexes.map {
          Index(name: $0.name, isUnique: $0.isUnique, columns: $0.columns)
        },
        createSQL: schema.createSQL
      )
    }
  }

  public static func capture(from engine: any DatabaseEngine) throws -> SchemaSnapshot {
    SchemaSnapshot(tables: try engine.listTables().map { try engine.tableSchema($0) })
  }
}

public struct SchemaDiff: Equatable {
  public enum EntryKind: String, Equatable {
    case tableAdded, tableDropped
    case columnAdded, columnDropped, columnChanged
    case indexAdded, indexDropped
  }

  public struct Entry: Equatable, Identifiable {
    public let kind: EntryKind
    public let description: String

    public var id: String { "\(kind.rawValue):\(description)" }
  }

  public let entries: [Entry]
  public let migrationSQL: [String]

  public var isEmpty: Bool { entries.isEmpty }

  public init(from old: SchemaSnapshot, to new: SchemaSnapshot) {
    var entries: [Entry] = []
    var sql: [String] = []
    let oldTables = Dictionary(uniqueKeysWithValues: old.tables.map { ($0.name, $0) })
    let newTables = Dictionary(uniqueKeysWithValues: new.tables.map { ($0.name, $0) })

    for table in new.tables where oldTables[table.name] == nil {
      entries.append(Entry(kind: .tableAdded, description: "Added table \"\(table.name)\""))
      if table.createSQL.isEmpty {
        sql.append("-- manual migration required: no stored create sql for table \"\(table.name)\"")
      } else {
        sql.append("\(table.createSQL);")
      }
      for index in Self.diffableIndexes(table) {
        sql.append(Self.createIndexSQL(index, on: table.name))
      }
    }

    for table in old.tables where newTables[table.name] == nil {
      entries.append(Entry(kind: .tableDropped, description: "Dropped table \"\(table.name)\""))
      sql.append("drop table \(Self.quote(table.name));")
    }

    for oldTable in old.tables {
      guard let newTable = newTables[oldTable.name] else { continue }
      Self.diffTable(from: oldTable, to: newTable, entries: &entries, sql: &sql)
    }

    self.entries = entries
    migrationSQL = sql
  }

  private static func diffTable(
    from old: SchemaSnapshot.Table,
    to new: SchemaSnapshot.Table,
    entries: inout [Entry],
    sql: inout [String]
  ) {
    let table = new.name
    let oldColumns = Dictionary(uniqueKeysWithValues: old.columns.map { ($0.name, $0) })
    let newColumns = Dictionary(uniqueKeysWithValues: new.columns.map { ($0.name, $0) })

    for column in new.columns where oldColumns[column.name] == nil {
      entries.append(Entry(kind: .columnAdded, description: "Added column \"\(column.name)\" to \"\(table)\""))
      if column.isPrimaryKey {
        sql.append("-- manual migration required: added column \"\(column.name)\" in \"\(table)\" is a primary key; recreate the table")
      } else {
        var definition = quote(column.name)
        if !column.type.isEmpty {
          definition += " \(column.type)"
        }
        if column.isRequired {
          definition += " not null"
        }
        sql.append("alter table \(quote(table)) add column \(definition);")
      }
    }

    for column in old.columns where newColumns[column.name] == nil {
      entries.append(Entry(kind: .columnDropped, description: "Dropped column \"\(column.name)\" from \"\(table)\""))
      sql.append("-- manual migration required: drop column \"\(column.name)\" from \"\(table)\" (sqlite cannot drop columns; recreate the table)")
    }

    for oldColumn in old.columns {
      guard let newColumn = newColumns[oldColumn.name], newColumn != oldColumn else { continue }
      var changes: [String] = []
      if oldColumn.type != newColumn.type {
        changes.append("type \(oldColumn.type) -> \(newColumn.type)")
      }
      if oldColumn.isPrimaryKey != newColumn.isPrimaryKey {
        changes.append(newColumn.isPrimaryKey ? "now primary key" : "no longer primary key")
      }
      if oldColumn.isRequired != newColumn.isRequired {
        changes.append(newColumn.isRequired ? "now not null" : "now nullable")
      }
      let detail = changes.joined(separator: ", ")
      entries.append(Entry(kind: .columnChanged, description: "Changed column \"\(oldColumn.name)\" in \"\(table)\": \(detail)"))
      sql.append("-- manual migration required: change column \"\(oldColumn.name)\" in \"\(table)\" (\(detail)); recreate the table")
    }

    let oldIndexes = Dictionary(uniqueKeysWithValues: diffableIndexes(old).map { ($0.name, $0) })
    let newIndexes = Dictionary(uniqueKeysWithValues: diffableIndexes(new).map { ($0.name, $0) })

    for index in diffableIndexes(new) where oldIndexes[index.name] == nil {
      entries.append(Entry(kind: .indexAdded, description: "Added index \"\(index.name)\" on \"\(table)\""))
      sql.append(createIndexSQL(index, on: table))
    }

    for index in diffableIndexes(old) where newIndexes[index.name] == nil {
      entries.append(Entry(kind: .indexDropped, description: "Dropped index \"\(index.name)\" from \"\(table)\""))
      sql.append("drop index \(quote(index.name));")
    }

    for oldIndex in diffableIndexes(old) {
      guard let newIndex = newIndexes[oldIndex.name], newIndex != oldIndex else { continue }
      entries.append(Entry(kind: .indexDropped, description: "Dropped index \"\(oldIndex.name)\" from \"\(table)\" (definition changed)"))
      entries.append(Entry(kind: .indexAdded, description: "Added index \"\(newIndex.name)\" on \"\(table)\" (definition changed)"))
      sql.append("drop index \(quote(oldIndex.name));")
      sql.append(createIndexSQL(newIndex, on: table))
    }
  }

  private static func diffableIndexes(_ table: SchemaSnapshot.Table) -> [SchemaSnapshot.Index] {
    // ponytail: sqlite_autoindex_* entries back unique constraints and cannot be created or dropped directly
    table.indexes.filter { !$0.name.hasPrefix("sqlite_") }
  }

  private static func createIndexSQL(_ index: SchemaSnapshot.Index, on table: String) -> String {
    let columns = index.columns.map(quote).joined(separator: ", ")
    return "create \(index.isUnique ? "unique " : "")index \(quote(index.name)) on \(quote(table)) (\(columns));"
  }

  private static func quote(_ name: String) -> String {
    "\"\(name.replacingOccurrences(of: "\"", with: "\"\""))\""
  }
}

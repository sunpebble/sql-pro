import Foundation

public enum MockDataGenerator {
  public struct GeneratedData: Equatable {
    public let columns: [DatabaseColumn]
    public let rows: [[String]]

    public var document: CSVDocument {
      CSVDocument(headers: columns.map(\.name), rows: rows)
    }

    public init(columns: [DatabaseColumn], rows: [[String]]) {
      self.columns = columns
      self.rows = rows
    }
  }

  public static func generate(columns: [DatabaseColumn], rowCount: Int, seed: UInt64 = 0) -> GeneratedData {
    let targetColumns = columns.filter { !$0.isPrimaryKey }
    var generator = SplitMix64(seed: seed)
    let rows = (0..<max(0, rowCount)).map { _ in
      targetColumns.map { value(for: $0, using: &generator) }
    }
    return GeneratedData(columns: targetColumns, rows: rows)
  }

  private static func value(for column: DatabaseColumn, using generator: inout SplitMix64) -> String {
    let type = column.type.uppercased()
    if type.contains("INT") {
      return String(Int.random(in: 1...10_000, using: &generator))
    }
    if type.contains("REAL") || type.contains("FLOA") || type.contains("DOUB") {
      return String(format: "%.2f", Double.random(in: 0..<10_000, using: &generator))
    }
    if type.contains("CHAR") || type.contains("CLOB") || type.contains("TEXT") {
      return textValue(for: column.name, using: &generator)
    }
    if type.contains("BLOB") {
      return ""
    }
    if type.contains("NUMERIC") || type.contains("DATE") {
      return isoDate(using: &generator)
    }
    return loremWords(using: &generator)
  }

  private static func textValue(for columnName: String, using generator: inout SplitMix64) -> String {
    let name = columnName.lowercased()
    if name.contains("email") {
      let person = firstNames.randomElement(using: &generator)!.lowercased()
      let domain = ["example.com", "mail.test", "quarry.dev"].randomElement(using: &generator)!
      return "\(person)\(Int.random(in: 1...99, using: &generator))@\(domain)"
    }
    if name.contains("name") {
      return "\(firstNames.randomElement(using: &generator)!) \(lastNames.randomElement(using: &generator)!)"
    }
    if name.contains("date") || name.contains("time") {
      return isoDate(using: &generator)
    }
    if name.contains("url") {
      return "https://example.com/\(loremWordList.randomElement(using: &generator)!)"
    }
    return loremWords(using: &generator)
  }

  private static func isoDate(using generator: inout SplitMix64) -> String {
    let year = Int.random(in: 2020...2026, using: &generator)
    let month = Int.random(in: 1...12, using: &generator)
    let day = Int.random(in: 1...28, using: &generator)
    return String(format: "%04d-%02d-%02d", year, month, day)
  }

  private static func loremWords(using generator: inout SplitMix64) -> String {
    (0..<Int.random(in: 1...3, using: &generator))
      .map { _ in loremWordList.randomElement(using: &generator)! }
      .joined(separator: " ")
  }

  private static let firstNames = [
    "Ada", "Alan", "Edsger", "Grace", "Linus", "Barbara", "Donald", "Margaret", "Ken", "Dennis",
  ]

  private static let lastNames = [
    "Lovelace", "Turing", "Dijkstra", "Hopper", "Torvalds", "Liskov", "Knuth", "Hamilton", "Thompson", "Ritchie",
  ]

  private static let loremWordList = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "tempor",
    "incididunt", "labore", "dolore", "magna", "aliqua", "veniam", "quis", "nostrud", "exercitation",
  ]
}

private struct SplitMix64: RandomNumberGenerator {
  var state: UInt64

  init(seed: UInt64) {
    state = seed
  }

  mutating func next() -> UInt64 {
    state &+= 0x9E37_79B9_7F4A_7C15
    var z = state
    z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
    z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
    return z ^ (z >> 31)
  }
}

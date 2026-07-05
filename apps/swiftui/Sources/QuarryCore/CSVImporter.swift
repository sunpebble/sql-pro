import Foundation

public struct CSVDocument: Equatable {
  public let headers: [String]
  public let rows: [[String]]

  public init(headers: [String], rows: [[String]]) {
    self.headers = headers
    self.rows = rows
  }
}

public enum CSVImporter {
  public static func parse(_ text: String) -> CSVDocument {
    let records = parseRecords(text)
      .filter { !$0.allSatisfy { $0.isEmpty } }
    guard let headers = records.first else {
      return CSVDocument(headers: [], rows: [])
    }
    return CSVDocument(headers: headers, rows: Array(records.dropFirst()))
  }

  private static func parseRecords(_ text: String) -> [[String]] {
    var records: [[String]] = []
    var record: [String] = []
    var field = ""
    var inQuotes = false
    var index = text.startIndex

    while index < text.endIndex {
      let character = text[index]
      let next = text.index(after: index)

      if character == "\"" {
        if inQuotes, next < text.endIndex, text[next] == "\"" {
          field.append("\"")
          index = text.index(after: next)
          continue
        }
        inQuotes.toggle()
      } else if character == ",", !inQuotes {
        record.append(field)
        field = ""
      } else if character == "\n", !inQuotes {
        record.append(field)
        records.append(record)
        record = []
        field = ""
      } else if character != "\r" || inQuotes {
        field.append(character)
      }

      index = next
    }

    if !field.isEmpty || !record.isEmpty {
      record.append(field)
      records.append(record)
    }

    return records
  }
}

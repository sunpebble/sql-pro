import Foundation
import CoreFoundation

public enum JSONImporterError: Error, Equatable, LocalizedError {
  case invalidUTF8
  case unsupportedShape

  public var errorDescription: String? {
    switch self {
    case .invalidUTF8:
      return "JSON text is not valid UTF-8."
    case .unsupportedShape:
      return "JSON import expects an array of objects or an object with a rows array."
    }
  }
}

public enum JSONImporter {
  public static func parse(_ text: String) throws -> CSVDocument {
    guard let data = text.data(using: .utf8) else {
      throw JSONImporterError.invalidUTF8
    }

    let value = try JSONSerialization.jsonObject(with: data)
    let objects: [[String: Any]]
    if let array = value as? [[String: Any]] {
      objects = array
    } else if
      let dictionary = value as? [String: Any],
      let rows = dictionary["rows"] as? [[String: Any]] {
      objects = rows
    } else {
      throw JSONImporterError.unsupportedShape
    }

    let headers = objects
      .flatMap { $0.keys }
      .reduce(into: [String]()) { headers, key in
        if !headers.contains(key) {
          headers.append(key)
        }
      }
      .sorted()

    let rows = objects.map { object in
      headers.map { valueString(object[$0] ?? "") }
    }
    return CSVDocument(headers: headers, rows: rows)
  }

  private static func valueString(_ value: Any) -> String {
    switch value {
    case is NSNull:
      return ""
    case let value as String:
      return value
    case let value as NSNumber:
      if CFGetTypeID(value) == CFBooleanGetTypeID() {
        return value.boolValue ? "true" : "false"
      }
      return value.stringValue
    case let value as [Any]:
      return jsonString(value)
    case let value as [String: Any]:
      return jsonString(value)
    default:
      return String(describing: value)
    }
  }

  private static func jsonString(_ value: Any) -> String {
    guard
      JSONSerialization.isValidJSONObject(value),
      let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    else {
      return String(describing: value)
    }
    return String(decoding: data, as: UTF8.self)
  }
}

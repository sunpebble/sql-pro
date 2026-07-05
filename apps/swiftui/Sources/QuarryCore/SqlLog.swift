import Foundation

/// One executed statement, kept in a bounded in-memory log (newest first).
public struct SqlLogEntry: Equatable, Identifiable {
  public let id: UUID
  public let sql: String
  public let startedAt: Date
  public let duration: TimeInterval
  public let rowCount: Int?
  public let error: String?

  public init(sql: String, startedAt: Date = Date(), duration: TimeInterval, rowCount: Int? = nil, error: String? = nil) {
    id = UUID()
    self.sql = sql
    self.startedAt = startedAt
    self.duration = duration
    self.rowCount = rowCount
    self.error = error
  }

  public static func appending(_ entry: SqlLogEntry, to log: [SqlLogEntry], limit: Int = 200) -> [SqlLogEntry] {
    Array(([entry] + log).prefix(limit))
  }
}

import Foundation

public struct QueryEntry: Codable, Equatable, Identifiable {
  public let id: UUID
  public var title: String
  public var sql: String
  public var createdAt: Date
  public var lastRunAt: Date
  public var runCount: Int

  public init(
    id: UUID = UUID(),
    title: String,
    sql: String,
    createdAt: Date = Date(),
    lastRunAt: Date = Date(),
    runCount: Int = 1
  ) {
    self.id = id
    self.title = title
    self.sql = sql
    self.createdAt = createdAt
    self.lastRunAt = lastRunAt
    self.runCount = runCount
  }
}

public enum QueryLibrary {
  public static func title(for sql: String) -> String {
    let compact = sql
      .split(whereSeparator: \.isNewline)
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .first { !$0.isEmpty } ?? "Untitled Query"
    return String(compact.prefix(80))
  }

  public static func recording(_ sql: String, in history: [QueryEntry], limit: Int = 50, now: Date = Date()) -> [QueryEntry] {
    let trimmed = sql.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return history }

    var next = history.filter { $0.sql != trimmed }
    let previous = history.first { $0.sql == trimmed }
    next.insert(
      QueryEntry(
        id: previous?.id ?? UUID(),
        title: previous?.title ?? title(for: trimmed),
        sql: trimmed,
        createdAt: previous?.createdAt ?? now,
        lastRunAt: now,
        runCount: (previous?.runCount ?? 0) + 1
      ),
      at: 0
    )
    return Array(next.prefix(limit))
  }

  public static func saving(_ sql: String, in saved: [QueryEntry], now: Date = Date()) -> [QueryEntry] {
    let trimmed = sql.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return saved }
    if saved.contains(where: { $0.sql == trimmed }) {
      return saved
    }
    return [QueryEntry(title: title(for: trimmed), sql: trimmed, createdAt: now, lastRunAt: now, runCount: 0)] + saved
  }
}

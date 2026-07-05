import Foundation

public enum RecentDatabasePaths {
  public static func adding(_ path: String, to paths: [String], limit: Int = 10) -> [String] {
    Array(([path] + paths.filter { $0 != path }).prefix(limit))
  }
}

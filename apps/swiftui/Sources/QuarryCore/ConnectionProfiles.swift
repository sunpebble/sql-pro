import Foundation

public struct ConnectionProfile: Codable, Equatable, Identifiable {
  public let id: UUID
  public var name: String
  public var path: String
  public var isEncrypted: Bool
  public var kind: DatabaseEngineKind
  public var host: String
  public var port: Int
  public var database: String
  public var user: String
  public var sshHost: String
  public var sshUser: String
  public var createdAt: Date
  public var lastOpenedAt: Date

  public init(
    id: UUID = UUID(),
    name: String,
    path: String,
    isEncrypted: Bool,
    kind: DatabaseEngineKind = .sqlite,
    host: String = "",
    port: Int = 0,
    database: String = "",
    user: String = "",
    sshHost: String = "",
    sshUser: String = "",
    createdAt: Date = Date(),
    lastOpenedAt: Date = Date()
  ) {
    self.id = id
    self.name = name
    self.path = path
    self.isEncrypted = isEncrypted
    self.kind = kind
    self.host = host
    self.port = port
    self.database = database
    self.user = user
    self.sshHost = sshHost
    self.sshUser = sshUser
    self.createdAt = createdAt
    self.lastOpenedAt = lastOpenedAt
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(UUID.self, forKey: .id)
    name = try container.decode(String.self, forKey: .name)
    path = try container.decode(String.self, forKey: .path)
    isEncrypted = try container.decode(Bool.self, forKey: .isEncrypted)
    kind = try container.decodeIfPresent(DatabaseEngineKind.self, forKey: .kind) ?? .sqlite
    host = try container.decodeIfPresent(String.self, forKey: .host) ?? ""
    port = try container.decodeIfPresent(Int.self, forKey: .port) ?? 0
    database = try container.decodeIfPresent(String.self, forKey: .database) ?? ""
    user = try container.decodeIfPresent(String.self, forKey: .user) ?? ""
    sshHost = try container.decodeIfPresent(String.self, forKey: .sshHost) ?? ""
    sshUser = try container.decodeIfPresent(String.self, forKey: .sshUser) ?? ""
    createdAt = try container.decode(Date.self, forKey: .createdAt)
    lastOpenedAt = try container.decode(Date.self, forKey: .lastOpenedAt)
  }

  public var connectionKey: String {
    kind == .sqlite ? "sqlite:\(path)" : "\(kind.rawValue):\(user)@\(host):\(port)/\(database)"
  }
}

public enum ConnectionProfiles {
  public static func saving(_ profile: ConnectionProfile, in profiles: [ConnectionProfile]) -> [ConnectionProfile] {
    var next = profiles.filter { $0.connectionKey != profile.connectionKey }
    next.insert(profile, at: 0)
    return next
  }

  public static func markingOpened(_ profile: ConnectionProfile, in profiles: [ConnectionProfile], now: Date = Date()) -> [ConnectionProfile] {
    profiles.map {
      guard $0.id == profile.id else { return $0 }
      var updated = $0
      updated.lastOpenedAt = now
      return updated
    }
  }
}

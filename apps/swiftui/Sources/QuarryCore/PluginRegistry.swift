import Foundation

public struct PluginManifest: Codable, Equatable, Identifiable {
  public let id: String
  public let name: String
  public let version: String
  public let description: String
  public let author: String
  public let main: String
  public let permissions: [String]?
  public let engines: [String: String]?
  public let homepage: String?
  public let repository: String?
  public let license: String?
  public let keywords: [String]?
  public let icon: String?
  public let screenshots: [String]?
  public let apiVersion: String?

  public init(
    id: String,
    name: String,
    version: String,
    description: String,
    author: String,
    main: String,
    permissions: [String]? = nil,
    engines: [String: String]? = nil,
    homepage: String? = nil,
    repository: String? = nil,
    license: String? = nil,
    keywords: [String]? = nil,
    icon: String? = nil,
    screenshots: [String]? = nil,
    apiVersion: String? = nil
  ) {
    self.id = id
    self.name = name
    self.version = version
    self.description = description
    self.author = author
    self.main = main
    self.permissions = permissions
    self.engines = engines
    self.homepage = homepage
    self.repository = repository
    self.license = license
    self.keywords = keywords
    self.icon = icon
    self.screenshots = screenshots
    self.apiVersion = apiVersion
  }
}

public struct InstalledPlugin: Equatable, Identifiable {
  public let manifest: PluginManifest
  public let directoryURL: URL
  public let entryPointURL: URL
  public var isEnabled: Bool
  public var error: String?

  public var id: String { manifest.id }

  public init(manifest: PluginManifest, directoryURL: URL, entryPointURL: URL, isEnabled: Bool, error: String? = nil) {
    self.manifest = manifest
    self.directoryURL = directoryURL
    self.entryPointURL = entryPointURL
    self.isEnabled = isEnabled
    self.error = error
  }
}

public struct PluginCommand: Equatable, Identifiable {
  public let id: String
  public let title: String
  public let url: URL

  public init(id: String, title: String, url: URL) {
    self.id = id
    self.title = title
    self.url = url
  }
}

public enum PluginRegistryError: Error, Equatable, LocalizedError {
  case manifestNotFound
  case manifestInvalid(String)
  case entryPointNotFound(String)

  public var errorDescription: String? {
    switch self {
    case .manifestNotFound:
      return "plugin.json not found"
    case let .manifestInvalid(message):
      return "Invalid plugin manifest: \(message)"
    case let .entryPointNotFound(path):
      return "Plugin entry point not found: \(path)"
    }
  }
}

public enum PluginRegistry {
  public static let manifestFilename = "plugin.json"

  public static func loadPlugins(from pluginsDirectory: URL, enabledIDs: Set<String>) -> [InstalledPlugin] {
    guard let entries = try? FileManager.default.contentsOfDirectory(
      at: pluginsDirectory,
      includingPropertiesForKeys: [.isDirectoryKey],
      options: [.skipsHiddenFiles]
    ) else {
      return []
    }

    return entries.compactMap { url in
      guard (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true else {
        return nil
      }
      return try? loadPlugin(from: url, enabledIDs: enabledIDs)
    }
    .sorted { $0.manifest.name.localizedCaseInsensitiveCompare($1.manifest.name) == .orderedAscending }
  }

  public static func loadPlugin(from directoryURL: URL, enabledIDs: Set<String>) throws -> InstalledPlugin {
    let manifestURL = directoryURL.appendingPathComponent(manifestFilename)
    guard FileManager.default.fileExists(atPath: manifestURL.path) else {
      throw PluginRegistryError.manifestNotFound
    }

    let data = try Data(contentsOf: manifestURL)
    let manifest = try JSONDecoder().decode(PluginManifest.self, from: data)
    try validate(manifest)

    let entryPointURL = directoryURL.appendingPathComponent(manifest.main)
    guard FileManager.default.fileExists(atPath: entryPointURL.path) else {
      throw PluginRegistryError.entryPointNotFound(manifest.main)
    }

    return InstalledPlugin(
      manifest: manifest,
      directoryURL: directoryURL,
      entryPointURL: entryPointURL,
      isEnabled: enabledIDs.contains(manifest.id)
    )
  }

  public static func installPlugin(from sourceDirectory: URL, into pluginsDirectory: URL) throws -> InstalledPlugin {
    let plugin = try loadPlugin(from: sourceDirectory, enabledIDs: [])
    try FileManager.default.createDirectory(at: pluginsDirectory, withIntermediateDirectories: true)
    let destination = pluginsDirectory.appendingPathComponent(plugin.manifest.id, isDirectory: true)

    if FileManager.default.fileExists(atPath: destination.path) {
      try FileManager.default.removeItem(at: destination)
    }
    try FileManager.default.copyItem(at: sourceDirectory, to: destination)
    return try loadPlugin(from: destination, enabledIDs: [])
  }

  public static func commands(for plugin: InstalledPlugin) -> [PluginCommand] {
    var commands = [
      PluginCommand(
        id: "\(plugin.id).openFolder",
        title: "Open Plugin Folder",
        url: plugin.directoryURL
      ),
    ]

    if let homepage = plugin.manifest.homepage, let url = URL(string: homepage) {
      commands.append(PluginCommand(id: "\(plugin.id).homepage", title: "Open Homepage", url: url))
    }
    if let repository = plugin.manifest.repository, let url = URL(string: repository) {
      commands.append(PluginCommand(id: "\(plugin.id).repository", title: "Open Repository", url: url))
    }

    return commands
  }

  private static func validate(_ manifest: PluginManifest) throws {
    if manifest.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      throw PluginRegistryError.manifestInvalid("id is required")
    }
    // id becomes a directory name under pluginsDirectory — block path traversal.
    if manifest.id.hasPrefix("/") || manifest.id.contains("\\") || containsTraversal(manifest.id) {
      throw PluginRegistryError.manifestInvalid("id must not contain path separators")
    }
    if manifest.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      throw PluginRegistryError.manifestInvalid("name is required")
    }
    if manifest.version.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      throw PluginRegistryError.manifestInvalid("version is required")
    }
    // main is resolved against the plugin directory — block escaping it.
    if !manifest.main.hasSuffix(".js") || manifest.main.hasPrefix("/")
      || manifest.main.contains("\\") || containsTraversal(manifest.main) {
      throw PluginRegistryError.manifestInvalid("main must be a relative .js file inside the plugin")
    }
  }

  private static func containsTraversal(_ path: String) -> Bool {
    path.split(separator: "/", omittingEmptySubsequences: false).contains("..")
  }
}

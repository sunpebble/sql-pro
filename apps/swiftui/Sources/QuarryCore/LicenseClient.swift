import Foundation
import IOKit

/// Pro-license client for api.sqlpro.app, ported from the electron license handler.
/// The license cache lives in the Keychain; verification works offline for 7 days.
public struct LicenseInfo: Codable, Equatable {
  public let email: String
  public let plan: String
  public let status: String
  public let expiresAt: String
}

public struct LicenseCache: Codable, Equatable {
  public var licenseKey: String
  public var email: String
  public var plan: String
  public var status: String
  public var expiresAt: String
  public var lastVerified: Date

  public var info: LicenseInfo {
    LicenseInfo(email: email, plan: plan, status: status, expiresAt: expiresAt)
  }

  public var isCurrentlyValid: Bool {
    guard status == "active" else { return false }
    guard let expiry = ISO8601DateFormatter().date(from: expiresAt) else { return false }
    return expiry > Date()
  }
}

public enum LicenseError: Error, LocalizedError {
  case api(String)
  case noLicense

  public var errorDescription: String? {
    switch self {
    case let .api(message): return message
    case .noLicense: return "No license found."
    }
  }
}

public final class LicenseClient {
  public struct VerifyOutcome: Equatable {
    public let valid: Bool
    public let license: LicenseInfo?
    public let cached: Bool
    public let offline: Bool
    public let error: String?
  }

  private let baseURL: URL
  private let cacheKey = "quarry.license-cache"
  private let session: URLSession

  public init(
    baseURL: URL = URL(string: ProcessInfo.processInfo.environment["LICENSE_API_URL"] ?? "https://api.sqlpro.app")!,
    session: URLSession = .shared
  ) {
    self.baseURL = baseURL
    self.session = session
  }

  // MARK: - Machine identity

  public static func machineID() -> String {
    let entry = IORegistryEntryFromPath(kIOMainPortDefault, "IOService:/")
    defer { IOObjectRelease(entry) }
    if let uuid = IORegistryEntryCreateCFProperty(entry, "IOPlatformUUID" as CFString, kCFAllocatorDefault, 0)?
      .takeRetainedValue() as? String {
      return uuid
    }
    return "\(Host.current().localizedName ?? "mac")-macos-\(ProcessInfo.processInfo.machineHardwareName)"
  }

  // MARK: - Cache

  public var cachedLicense: LicenseCache? {
    guard let json = KeychainPasswordStore.load(for: cacheKey),
          let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(LicenseCache.self, from: data)
  }

  private func storeCache(_ cache: LicenseCache) {
    if let data = try? JSONEncoder().encode(cache), let json = String(data: data, encoding: .utf8) {
      KeychainPasswordStore.save(password: json, for: cacheKey)
    }
  }

  // MARK: - API

  public func activate(email: String, licenseKey: String) async throws -> LicenseInfo {
    struct Response: Codable {
      let success: Bool
      let license: LicenseInfo?
      let error: String?
    }
    let response: Response = try await post("api/license/activate", body: [
      "email": email,
      "licenseKey": licenseKey,
      "machineId": Self.machineID(),
      "platform": "darwin",
      "hostname": Host.current().localizedName ?? "mac",
    ])
    guard response.success, let license = response.license else {
      throw LicenseError.api(response.error ?? "Failed to activate license")
    }
    storeCache(LicenseCache(
      licenseKey: licenseKey,
      email: email,
      plan: license.plan,
      status: license.status,
      expiresAt: license.expiresAt,
      lastVerified: Date()
    ))
    return license
  }

  public func verify() async -> VerifyOutcome {
    guard var cached = cachedLicense else {
      return VerifyOutcome(valid: false, license: nil, cached: false, offline: false, error: "No license found")
    }

    // Offline grace: trust a verification newer than 7 days.
    if Date().timeIntervalSince(cached.lastVerified) < 7 * 24 * 3600, cached.isCurrentlyValid {
      return VerifyOutcome(valid: true, license: cached.info, cached: true, offline: false, error: nil)
    }

    struct Response: Codable {
      let valid: Bool
      let license: LicenseInfo?
      let error: String?
    }
    do {
      let response: Response = try await post("api/license/verify", body: [
        "licenseKey": cached.licenseKey,
        "machineId": Self.machineID(),
      ])
      if response.valid, let license = response.license {
        cached.status = license.status
        cached.expiresAt = license.expiresAt
        cached.lastVerified = Date()
        storeCache(cached)
        return VerifyOutcome(valid: true, license: license, cached: false, offline: false, error: nil)
      }
      return VerifyOutcome(valid: false, license: nil, cached: false, offline: false, error: response.error)
    } catch {
      // Network failure: fall back to the cache regardless of its age.
      if cached.isCurrentlyValid {
        return VerifyOutcome(valid: true, license: cached.info, cached: true, offline: true, error: nil)
      }
      return VerifyOutcome(valid: false, license: nil, cached: false, offline: true, error: error.localizedDescription)
    }
  }

  /// Returns a warning message if the server could not be notified.
  @discardableResult
  public func deactivate() async -> String? {
    guard let cached = cachedLicense else { return nil }
    defer { KeychainPasswordStore.delete(for: cacheKey) }
    struct Response: Codable { let success: Bool? }
    do {
      let _: Response = try await post("api/license/deactivate", body: [
        "licenseKey": cached.licenseKey,
        "machineId": Self.machineID(),
      ])
      return nil
    } catch {
      return "Could not notify server, but the local license was removed."
    }
  }

  public func checkoutURL(email: String, plan: String) async throws -> URL {
    struct Response: Codable {
      let success: Bool
      let url: String?
      let error: String?
    }
    let response: Response = try await post("api/checkout", body: [
      "email": email,
      "plan": plan,
      "successUrl": "quarry://license/success",
      "cancelUrl": "quarry://license/cancel",
    ])
    guard response.success, let urlString = response.url, let url = URL(string: urlString) else {
      throw LicenseError.api(response.error ?? "Failed to create checkout")
    }
    return url
  }

  public func portalURL() async throws -> URL {
    guard let cached = cachedLicense else { throw LicenseError.noLicense }
    struct Response: Codable {
      let success: Bool
      let url: String?
      let error: String?
    }
    let response: Response = try await post("api/portal", body: [
      "email": cached.email,
      "returnUrl": "quarry://license/portal-return",
    ])
    guard response.success, let urlString = response.url, let url = URL(string: urlString) else {
      throw LicenseError.api(response.error ?? "Failed to get portal URL")
    }
    return url
  }

  private func post<T: Decodable>(_ path: String, body: [String: String]) async throws -> T {
    var request = URLRequest(url: baseURL.appendingPathComponent(path))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(body)
    let (data, _) = try await session.data(for: request)
    return try JSONDecoder().decode(T.self, from: data)
  }
}

extension ProcessInfo {
  fileprivate var machineHardwareName: String {
    var size = 0
    sysctlbyname("hw.machine", nil, &size, nil, 0)
    var machine = [CChar](repeating: 0, count: size)
    sysctlbyname("hw.machine", &machine, &size, nil, 0)
    return String(cString: machine)
  }
}

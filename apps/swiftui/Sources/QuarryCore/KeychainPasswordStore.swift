import Foundation
import Security

/// Stores connection passwords in the macOS Keychain, keyed by connection key.
/// Mirrors the electron app's safeStorage-backed password store.
public enum KeychainPasswordStore {
  private static let service = "app.sunpebble.quarry.connection"

  @discardableResult
  public static func save(password: String, for connectionKey: String) -> Bool {
    guard let data = password.data(using: .utf8) else { return false }
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: connectionKey,
    ]
    let attributes: [String: Any] = [kSecValueData as String: data]
    let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
    if updateStatus == errSecItemNotFound {
      var addQuery = query
      addQuery[kSecValueData as String] = data
      return SecItemAdd(addQuery as CFDictionary, nil) == errSecSuccess
    }
    return updateStatus == errSecSuccess
  }

  public static func load(for connectionKey: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: connectionKey,
      kSecReturnData as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]
    var item: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
          let data = item as? Data
    else { return nil }
    return String(data: data, encoding: .utf8)
  }

  @discardableResult
  public static func delete(for connectionKey: String) -> Bool {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: connectionKey,
    ]
    let status = SecItemDelete(query as CFDictionary)
    return status == errSecSuccess || status == errSecItemNotFound
  }
}

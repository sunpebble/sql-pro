import Foundation

private let quarryLocalizationBundle: Bundle = {
  let bundleName = "QuarrySwiftUI_QuarrySwiftUI.bundle"
  let executableDirectory = Bundle.main.executableURL?.deletingLastPathComponent()
  let appResources = executableDirectory?
    .deletingLastPathComponent()
    .appendingPathComponent("Resources")
    .appendingPathComponent(bundleName)
  let candidates = [
    Bundle.main.resourceURL?.appendingPathComponent(bundleName),
    appResources,
    Bundle.main.bundleURL.appendingPathComponent(bundleName),
    executableDirectory?.appendingPathComponent(bundleName),
  ]

  for url in candidates {
    if let url, let bundle = Bundle(url: url) {
      return bundle
    }
  }

  return .main
}()

func L(_ key: String) -> String {
  NSLocalizedString(key, bundle: quarryLocalizationBundle, comment: "")
}

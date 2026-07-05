import AppKit
import SwiftUI

// Sunpebble brand tokens — canonical palette lives in sunpebble.github.io/BRAND.md.
enum Brand {
  static let cream = Color(nsColor: NSColor(srgbRed: 1.0, green: 0.965, blue: 0.910, alpha: 1))
  static let ink = Color(nsColor: inkNS)
  static let sun = Color(nsColor: NSColor(srgbRed: 0.969, green: 0.718, blue: 0.200, alpha: 1))
  static let pebble = Color(nsColor: NSColor(srgbRed: 0.431, green: 0.431, blue: 0.451, alpha: 1))
  static let night = Color(nsColor: nightNS)

  // Light mode: cream background. Dark mode: night background, ink surfaces.
  static let background = Color(nsColor: NSColor(name: nil) { appearance in
    appearance.isDark ? nightNS : creamNS
  })

  private static let creamNS = NSColor(srgbRed: 1.0, green: 0.965, blue: 0.910, alpha: 1)
  private static let inkNS = NSColor(srgbRed: 0.137, green: 0.153, blue: 0.200, alpha: 1)
  private static let nightNS = NSColor(srgbRed: 0.086, green: 0.098, blue: 0.157, alpha: 1)
}

extension NSAppearance {
  fileprivate var isDark: Bool {
    bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
  }
}

// Brand CTA: sun fill hosts ink text, never white (BRAND.md contrast rule).
struct BrandProminentButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .foregroundStyle(Brand.ink)
      .padding(.horizontal, 10)
      .padding(.vertical, 5)
      .background(
        Brand.sun.opacity(configuration.isPressed ? 0.75 : 1),
        in: RoundedRectangle(cornerRadius: 6)
      )
  }
}

extension ButtonStyle where Self == BrandProminentButtonStyle {
  static var brandProminent: BrandProminentButtonStyle { BrandProminentButtonStyle() }
}

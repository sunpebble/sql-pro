import AppKit
import SwiftUI

// Sunpebble brand tokens — canonical source: claude.ai/design "Sunpebble Brand"
// (tokens/brand.css + guidelines/brand.md, mirrored from sunpebble.github.io/BRAND.md).
enum Brand {
  static let cream = Color(nsColor: creamNS)
  static let ink = Color(nsColor: inkNS)
  static let sun = Color(nsColor: NSColor(srgbRed: 0.969, green: 0.718, blue: 0.200, alpha: 1))
  static let pebble = Color(nsColor: pebbleNS)
  static let night = Color(nsColor: nightNS)

  // Semantic aliases, flipping in dark mode exactly like tokens/brand.css:
  // bg cream→night, surface white→ink, text-secondary pebble→lightened pebble
  // (#9EA3B0 — raw pebble fails AA on night/ink surfaces).
  static let background = Color(nsColor: NSColor(name: nil) { appearance in
    appearance.isDark ? nightNS : creamNS
  })
  static let surface = Color(nsColor: surfaceNS)
  static let textSecondary = Color(nsColor: textSecondaryNS)

  // NS variants for AppKit-hosted views (SQL editor).
  static let surfaceNS = NSColor(name: nil) { appearance in
    appearance.isDark ? inkNS : .white
  }
  static let textSecondaryNS = NSColor(name: nil) { appearance in
    appearance.isDark
      ? NSColor(srgbRed: 0.620, green: 0.639, blue: 0.690, alpha: 1)
      : pebbleNS
  }

  private static let creamNS = NSColor(srgbRed: 1.0, green: 0.965, blue: 0.910, alpha: 1)
  private static let inkNS = NSColor(srgbRed: 0.137, green: 0.153, blue: 0.200, alpha: 1)
  private static let pebbleNS = NSColor(srgbRed: 0.431, green: 0.431, blue: 0.451, alpha: 1)
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

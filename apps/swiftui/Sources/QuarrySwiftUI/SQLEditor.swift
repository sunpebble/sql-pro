import AppKit
import SwiftUI

struct SQLEditor: NSViewRepresentable {
  @Binding var text: String

  func makeCoordinator() -> Coordinator {
    Coordinator(text: $text)
  }

  func makeNSView(context: Context) -> NSScrollView {
    let scrollView = NSTextView.scrollableTextView()
    scrollView.hasVerticalScroller = true
    scrollView.drawsBackground = true

    let textView = scrollView.documentView as! NSTextView
    textView.backgroundColor = Brand.surfaceNS
    textView.delegate = context.coordinator
    textView.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
    textView.isRichText = false
    textView.isAutomaticQuoteSubstitutionEnabled = false
    textView.isAutomaticDashSubstitutionEnabled = false
    textView.isAutomaticSpellingCorrectionEnabled = false
    textView.isAutomaticTextReplacementEnabled = false
    textView.isContinuousSpellCheckingEnabled = false
    textView.allowsUndo = true
    textView.textContainerInset = NSSize(width: 4, height: 6)
    textView.autoresizingMask = .width

    textView.string = text
    SQLHighlighter.highlight(textView)

    return scrollView
  }

  func updateNSView(_ scrollView: NSScrollView, context: Context) {
    guard let textView = scrollView.documentView as? NSTextView else { return }
    guard textView.string != text else { return }

    let selection = textView.selectedRanges
    textView.string = text
    SQLHighlighter.highlight(textView)
    let length = (textView.string as NSString).length
    textView.selectedRanges = selection.filter {
      NSMaxRange($0.rangeValue) <= length
    }
  }

  final class Coordinator: NSObject, NSTextViewDelegate {
    var text: Binding<String>

    init(text: Binding<String>) {
      self.text = text
    }

    func textDidChange(_ notification: Notification) {
      guard let textView = notification.object as? NSTextView else { return }
      text.wrappedValue = textView.string
      SQLHighlighter.highlight(textView)
    }
  }
}

enum SQLHighlighter {
  private static let keywords = [
    "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE",
    "INDEX", "VIEW", "TRIGGER", "DROP", "ALTER", "JOIN", "LEFT", "RIGHT",
    "INNER", "OUTER", "CROSS", "ON", "GROUP", "BY", "ORDER", "LIMIT", "OFFSET",
    "AND", "OR", "NOT", "NULL", "IN", "IS", "AS", "DISTINCT", "VALUES", "SET",
    "INTO", "PRAGMA", "EXPLAIN", "UNION", "ALL", "BETWEEN", "LIKE", "GLOB",
    "CASE", "WHEN", "THEN", "ELSE", "END", "HAVING", "EXISTS", "PRIMARY",
    "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "DEFAULT", "CHECK", "CONSTRAINT",
    "AUTOINCREMENT", "VACUUM", "ANALYZE", "REINDEX", "ATTACH", "DETACH",
    "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "IF", "CAST", "COLLATE",
    "ASC", "DESC", "WITH", "RECURSIVE", "RETURNING", "REPLACE",
  ]

  private struct Rule {
    let regex: NSRegularExpression
    let attributes: [NSAttributedString.Key: Any]
  }

  // Order matters: later rules win, so comments and strings override keywords.
  private static let rules: [Rule] = {
    let font = NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)
    let bold = NSFont.monospacedSystemFont(ofSize: 13, weight: .bold)
    let italic = NSFontManager.shared.convert(font, toHaveTrait: .italicFontMask)
    let commentAttributes: [NSAttributedString.Key: Any] = [
      .foregroundColor: Brand.textSecondaryNS,
      .font: italic,
    ]
    func rule(_ pattern: String, _ attributes: [NSAttributedString.Key: Any]) -> Rule {
      Rule(
        regex: try! NSRegularExpression(
          pattern: pattern,
          options: [.caseInsensitive, .dotMatchesLineSeparators]
        ),
        attributes: attributes
      )
    }
    return [
      rule(
        "\\b(\(keywords.joined(separator: "|")))\\b",
        [.foregroundColor: NSColor.systemOrange, .font: bold]
      ),
      rule("\\b\\d+(\\.\\d+)?\\b", [.foregroundColor: NSColor.systemPurple]),
      rule("'(?:[^']|'')*'", [.foregroundColor: NSColor.systemGreen]),
      rule("--[^\\n]*", commentAttributes),
      rule("/\\*.*?\\*/", commentAttributes),
    ]
  }()

  static func highlight(_ textView: NSTextView) {
    guard let storage = textView.textStorage else { return }
    let fullRange = NSRange(location: 0, length: storage.length)

    storage.beginEditing()
    storage.setAttributes(
      [
        .foregroundColor: NSColor.labelColor,
        .font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular),
      ],
      range: fullRange
    )
    for rule in rules {
      rule.regex.enumerateMatches(in: storage.string, range: fullRange) { match, _, _ in
        guard let match else { return }
        storage.setAttributes(rule.attributes, range: match.range)
      }
    }
    storage.endEditing()
  }
}

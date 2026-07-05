import AppKit
import QuarryCore
import SwiftUI

/// Schema and data comparison between two open sessions, with sync SQL generation.
struct CompareWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  private enum Mode: String, CaseIterable, Identifiable {
    case schema = "Schema"
    case data = "Data"

    var id: String { rawValue }
  }

  @State private var mode: Mode = .schema

  var body: some View {
    VStack(spacing: 0) {
      header
      Divider()
      content
    }
  }

  private var header: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Picker(L("Compare"), selection: $mode) {
          ForEach(Mode.allCases) { mode in
            Text(L(mode.rawValue)).tag(mode)
          }
        }
        .pickerStyle(.segmented)
        .frame(width: 200)

        Spacer()

        if mode == .schema {
          Button(action: state.runSchemaCompare) {
            Label(L("Compare Schemas"), systemImage: "arrow.triangle.2.circlepath")
          }
          .buttonStyle(.brandProminent)
        } else {
          Toggle(L("Include deletes"), isOn: $state.compareIncludeDeletes)
            .onChange(of: state.compareIncludeDeletes) { state.regenerateSyncSQL() }

          Button(action: state.runDataCompare) {
            Label(L("Compare Data"), systemImage: "arrow.triangle.2.circlepath")
          }
          .buttonStyle(.brandProminent)
        }
      }

      HStack {
        sessionPicker(L("Source"), selection: $state.compareSourceSessionID)
        if mode == .data {
          tablePicker(sessionID: state.compareSourceSessionID, selection: $state.compareSourceTable)
        }

        Image(systemName: "arrow.right")
          .foregroundStyle(Brand.textSecondary)

        sessionPicker(L("Target"), selection: $state.compareTargetSessionID)
        if mode == .data {
          tablePicker(sessionID: state.compareTargetSessionID, selection: $state.compareTargetTable)
        }

        Spacer()
      }
    }
    .padding()
  }

  private func sessionPicker(_ title: String, selection: Binding<String?>) -> some View {
    Picker(title, selection: selection) {
      Text(L("Select…")).tag(String?.none)
      ForEach(state.sessions) { session in
        Text(session.label).tag(String?.some(session.id))
      }
    }
    .frame(maxWidth: 260)
  }

  private func tablePicker(sessionID: String?, selection: Binding<String>) -> some View {
    let tables = state.session(withID: sessionID)?.tables ?? []
    return Picker(L("Table"), selection: selection) {
      Text(L("Select…")).tag("")
      ForEach(tables) { table in
        Text(table.name).tag(table.name)
      }
    }
    .frame(maxWidth: 220)
  }

  @ViewBuilder
  private var content: some View {
    switch mode {
    case .schema:
      schemaResults
    case .data:
      dataResults
    }
  }

  @ViewBuilder
  private var schemaResults: some View {
    if let diff = state.compareSchemaDiff {
      if diff.isEmpty {
        emptyState(L("Schemas are identical."))
      } else {
        HSplitView {
          List(diff.entries) { entry in
            Label(entry.description, systemImage: icon(for: entry.kind))
              .font(.callout)
          }
          .frame(minWidth: 280)

          sqlPane(title: L("Migration SQL"), sql: diff.migrationSQL.joined(separator: "\n"))
        }
      }
    } else {
      emptyState(L("Pick two sessions and compare their schemas."))
    }
  }

  @ViewBuilder
  private var dataResults: some View {
    if let diff = state.compareDataDiff {
      VStack(spacing: 0) {
        HStack(spacing: 16) {
          summaryBadge(L("Added"), count: diff.summary.added, color: .green)
          summaryBadge(L("Removed"), count: diff.summary.removed, color: .red)
          summaryBadge(L("Modified"), count: diff.summary.modified, color: .orange)
          summaryBadge(L("Unchanged"), count: diff.summary.unchanged, color: .secondary)
          Spacer()
          Text(String(format: L("%d source rows, %d target rows"), diff.summary.sourceRows, diff.summary.targetRows))
            .font(.caption)
            .foregroundStyle(Brand.textSecondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)

        Divider()

        HSplitView {
          List(diff.rows.filter { $0.kind != .unchanged }) { row in
            VStack(alignment: .leading, spacing: 2) {
              HStack {
                Text(L(row.kind.rawValue))
                  .font(.caption.bold())
                  .foregroundStyle(color(for: row.kind))
                Text(row.primaryKey.map { "\($0.key)=\($0.value)" }.sorted().joined(separator: ", "))
                  .font(.caption.monospaced())
              }
              ForEach(row.columnChanges, id: \.columnName) { change in
                Text("\(change.columnName): \(change.targetValue ?? "∅") → \(change.sourceValue ?? "∅")")
                  .font(.caption.monospaced())
                  .foregroundStyle(Brand.textSecondary)
              }
            }
            .padding(.vertical, 2)
          }
          .frame(minWidth: 320)

          sqlPane(title: L("Sync SQL"), sql: state.compareSyncSQL)
        }
      }
    } else {
      emptyState(L("Pick two tables and compare their rows."))
    }
  }

  private func sqlPane(title: String, sql: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text(title)
          .font(.headline)
        Spacer()
        Button {
          NSPasteboard.general.clearContents()
          NSPasteboard.general.setString(sql, forType: .string)
        } label: {
          Label(L("Copy"), systemImage: "doc.on.doc")
        }
        .disabled(sql.isEmpty)
      }
      ScrollView {
        Text(sql.isEmpty ? L("No statements.") : sql)
          .font(.caption.monospaced())
          .frame(maxWidth: .infinity, alignment: .leading)
          .textSelection(.enabled)
      }
    }
    .padding()
    .frame(minWidth: 300)
  }

  private func summaryBadge(_ title: String, count: Int, color: Color) -> some View {
    HStack(spacing: 4) {
      Circle().fill(color).frame(width: 8, height: 8)
      Text("\(title): \(count)")
        .font(.caption)
    }
  }

  private func emptyState(_ message: String) -> some View {
    VStack {
      Spacer()
      Text(message)
        .foregroundStyle(Brand.textSecondary)
      Spacer()
    }
    .frame(maxWidth: .infinity)
  }

  private func icon(for kind: SchemaDiff.EntryKind) -> String {
    switch kind {
    case .tableAdded, .columnAdded, .indexAdded: return "plus.circle"
    case .tableDropped, .columnDropped, .indexDropped: return "minus.circle"
    case .columnChanged: return "pencil.circle"
    }
  }

  private func color(for kind: DataDiff.RowKind) -> Color {
    switch kind {
    case .added: return .green
    case .removed: return .red
    case .modified: return .orange
    case .unchanged: return .secondary
    }
  }
}

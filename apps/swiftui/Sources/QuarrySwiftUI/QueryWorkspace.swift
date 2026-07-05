import AppKit
import QuarryCore
import SwiftUI

struct QueryWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    HStack(spacing: 0) {
      QueryLibraryPanel(state: state)
        .frame(width: 280)

      Divider()

      VStack(spacing: 0) {
        HStack {
          Text(L("SQL"))
            .font(.headline)

          Spacer()

          Toggle(isOn: $state.showSqlLog) {
            Label(L("Log"), systemImage: "list.bullet.rectangle")
          }
          .toggleStyle(.button)

          Button(action: state.saveCurrentQuery) {
            Label(L("Save"), systemImage: "bookmark")
          }

          Button(action: state.explainQuery) {
            Label(L("Explain"), systemImage: "list.bullet.clipboard")
          }
          .disabled(!state.hasActiveDatabase)

          Button(action: state.runQuery) {
            Label(L("Run"), systemImage: "play.fill")
          }
          .buttonStyle(.brandProminent)
          .disabled(!state.hasActiveDatabase)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)

        Divider()

        SQLEditor(text: $state.queryText)
          .frame(height: 150)

        Divider()

        if !state.queryPlan.isEmpty {
          QueryPlanView(steps: state.queryPlan)
          Divider()
        }

        ResultGrid(result: state.result)

        if state.showSqlLog {
          Divider()
          SqlLogView(entries: state.sqlLog)
            .frame(height: 160)
        }
      }
    }
  }
}

struct SqlLogView: View {
  let entries: [SqlLogEntry]

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Label(L("SQL Log"), systemImage: "list.bullet.rectangle")
        .font(.headline)
        .padding(.horizontal)
        .padding(.top, 8)

      if entries.isEmpty {
        Text(L("No statements executed yet."))
          .font(.caption)
          .foregroundStyle(Brand.textSecondary)
          .padding(.horizontal)
      } else {
        List(entries) { entry in
          VStack(alignment: .leading, spacing: 2) {
            HStack {
              Text(entry.startedAt, format: .dateTime.hour().minute().second())
                .font(.caption2.monospaced())
                .foregroundStyle(Brand.textSecondary)
              Text(String(format: "%.0f ms", entry.duration * 1000))
                .font(.caption2.monospaced())
                .foregroundStyle(Brand.textSecondary)
              if let rowCount = entry.rowCount {
                Text(String(format: L("%d rows"), rowCount))
                  .font(.caption2)
                  .foregroundStyle(Brand.textSecondary)
              }
              if let error = entry.error {
                Text(error)
                  .font(.caption2)
                  .foregroundStyle(.red)
                  .lineLimit(1)
              }
            }
            Text(entry.sql)
              .font(.caption.monospaced())
              .lineLimit(2)
              .textSelection(.enabled)
          }
          .padding(.vertical, 1)
        }
        .listStyle(.plain)
      }
    }
  }
}

struct QueryPlanView: View {
  let steps: [QueryPlanStep]

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Label(L("Query Plan"), systemImage: "list.bullet.clipboard")
        .font(.headline)

      ForEach(steps) { step in
        HStack(alignment: .top) {
          Text("#\(step.id)")
            .font(.caption.monospaced())
            .foregroundStyle(Brand.textSecondary)
            .frame(width: 42, alignment: .leading)
          Text(step.detail)
            .font(.caption.monospaced())
          Spacer()
        }
      }
    }
    .padding()
    .background(Brand.surface)
  }
}

struct QueryLibraryPanel: View {
  @ObservedObject var state: QuarryAppState

  private var saved: [QueryEntry] {
    filtered(state.savedQueries)
  }

  private var history: [QueryEntry] {
    filtered(state.queryHistory)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      TextField(L("Search queries"), text: $state.querySearch)
        .textFieldStyle(.roundedBorder)
        // Match the sidebar list's 10pt content inset so the field lines up
        // with the section rows below.
        .padding(.horizontal, 10)
        .padding(.vertical, 12)

      List {
        Section(L("Saved")) {
          if saved.isEmpty {
            Text(L("No saved queries"))
              .foregroundStyle(Brand.textSecondary)
          } else {
            ForEach(saved) { query in
              QueryEntryRow(query: query) {
                state.useQuery(query, run: true)
              } trailing: {
                Button {
                  state.deleteSavedQuery(query)
                } label: {
                  Image(systemName: "trash")
                }
                .buttonStyle(.borderless)
              }
            }
          }
        }

        Section(L("History")) {
          if history.isEmpty {
            Text(L("No query history"))
              .foregroundStyle(Brand.textSecondary)
          } else {
            ForEach(history) { query in
              QueryEntryRow(query: query) {
                state.useQuery(query, run: true)
              } trailing: {
                Text("x\(query.runCount)")
                  .font(.caption2)
                  .foregroundStyle(Brand.textSecondary)
              }
            }
          }
        }
      }
      .listStyle(.sidebar)
    }
  }

  private func filtered(_ queries: [QueryEntry]) -> [QueryEntry] {
    let search = state.querySearch.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    guard !search.isEmpty else { return queries }
    return queries.filter {
      $0.title.lowercased().contains(search) || $0.sql.lowercased().contains(search)
    }
  }
}

struct QueryEntryRow<Trailing: View>: View {
  let query: QueryEntry
  let action: () -> Void
  @ViewBuilder var trailing: () -> Trailing

  var body: some View {
    Button(action: action) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 3) {
          Text(query.title)
            .font(.caption.weight(.semibold))
            .lineLimit(1)
          Text(query.sql)
            .font(.caption2.monospaced())
            .foregroundStyle(Brand.textSecondary)
            .lineLimit(2)
        }

        Spacer()

        trailing()
      }
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
  }
}

struct ResultGrid: View {
  let result: QueryResult?

  var body: some View {
    // Greedy frames: without them the enclosing VStack shrinks to fit and
    // floats vertically centered, leaving dead space above the editor.
    guard let result else {
      return AnyView(
        ContentUnavailableView(L("No Results"), systemImage: "tablecells")
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      )
    }

    guard !result.columns.isEmpty else {
      return AnyView(
        ContentUnavailableView(L("Statement Complete"), systemImage: "checkmark.circle")
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      )
    }

    return AnyView(
      VStack(alignment: .leading, spacing: 0) {
        Text(String(format: L("%d rows"), result.rows.count))
          .font(.caption)
          .foregroundStyle(Brand.textSecondary)
          .padding(.horizontal)
          .padding(.vertical, 8)

        Divider()

        DataTableView(
          columns: result.columns.map { .init(name: $0, tooltip: $0) },
          rows: result.rows
        )
      }
    )
  }
}

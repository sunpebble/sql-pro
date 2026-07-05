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
            .foregroundStyle(.secondary)
            .frame(width: 42, alignment: .leading)
          Text(step.detail)
            .font(.caption.monospaced())
          Spacer()
        }
      }
    }
    .padding()
    .background(Color(nsColor: .controlBackgroundColor))
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
        .padding()

      List {
        Section(L("Saved")) {
          if saved.isEmpty {
            Text(L("No saved queries"))
              .foregroundStyle(.secondary)
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
              .foregroundStyle(.secondary)
          } else {
            ForEach(history) { query in
              QueryEntryRow(query: query) {
                state.useQuery(query, run: true)
              } trailing: {
                Text("x\(query.runCount)")
                  .font(.caption2)
                  .foregroundStyle(.secondary)
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
            .foregroundStyle(.secondary)
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
    guard let result else {
      return AnyView(
        ContentUnavailableView(L("No Results"), systemImage: "tablecells")
      )
    }

    guard !result.columns.isEmpty else {
      return AnyView(
        ContentUnavailableView(L("Statement Complete"), systemImage: "checkmark.circle")
      )
    }

    return AnyView(
      VStack(alignment: .leading, spacing: 0) {
        Text(String(format: L("%d rows"), result.rows.count))
          .font(.caption)
          .foregroundStyle(.secondary)
          .padding(.horizontal)
          .padding(.vertical, 8)

        Divider()

        ScrollView([.horizontal, .vertical]) {
          Grid(alignment: .leading, horizontalSpacing: 0, verticalSpacing: 0) {
            GridRow {
              ForEach(result.columns, id: \.self) { column in
                CellText(column, isHeader: true)
              }
            }

            ForEach(Array(result.rows.enumerated()), id: \.offset) { _, row in
              GridRow {
                ForEach(result.columns.indices, id: \.self) { index in
                  CellText(index < row.count ? row[index] : "", isHeader: false)
                }
              }
            }
          }
          .padding()
        }
      }
    )
  }
}

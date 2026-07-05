import AppKit
import QuarryCore
import SwiftUI

struct SearchWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Label(L("Search"), systemImage: "magnifyingglass")
          .font(.headline)

        TextField(L("Search all tables and views"), text: $state.searchText)
          .textFieldStyle(.roundedBorder)
          .frame(maxWidth: 360)
          .onSubmit(state.runGlobalSearch)

        Button(action: state.runGlobalSearch) {
          Label(L("Search"), systemImage: "magnifyingglass")
        }
        .buttonStyle(.brandProminent)
        .disabled(state.searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

        Spacer()

        Text(String(format: L("%d matches"), state.searchMatches.count))
          .font(.caption)
          .foregroundStyle(.secondary)
      }
      .padding()

      Divider()

      if state.searchMatches.isEmpty {
        ContentUnavailableView(L("No Matches"), systemImage: "magnifyingglass")
      } else {
        List {
          ForEach(state.searchMatches) { match in
            HStack(alignment: .top, spacing: 12) {
              VStack(alignment: .leading, spacing: 4) {
                HStack {
                  Label(match.tableName, systemImage: "tablecells")
                    .font(.caption.weight(.semibold))
                  Text(match.columnName)
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
                  if let rowID = match.rowID {
                    Text("rowid \(rowID)")
                      .font(.caption2.monospaced())
                      .foregroundStyle(.secondary)
                  }
                }

                Text(match.value)
                  .font(.caption.monospaced())
                  .lineLimit(3)
                  .textSelection(.enabled)
              }

              Spacer()

              Button {
                state.openSearchMatch(match)
              } label: {
                Label(L("Open"), systemImage: "arrow.right")
              }
            }
            .padding(.vertical, 4)
          }
        }
      }
    }
  }
}

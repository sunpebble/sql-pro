import AppKit
import QuarryCore
import SwiftUI

struct PluginsWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Label(L("Plugins"), systemImage: "puzzlepiece.extension")
          .font(.headline)

        Text(String(format: L("%d installed"), state.plugins.count))
          .font(.caption)
          .foregroundStyle(.secondary)

        Spacer()

        Button(action: state.installPluginPanel) {
          Label(L("Install Folder"), systemImage: "folder.badge.plus")
        }

        Button(action: state.loadPlugins) {
          Label(L("Rescan"), systemImage: "arrow.clockwise")
        }
      }
      .padding()

      Divider()

      if state.plugins.isEmpty {
        ContentUnavailableView {
          Label(L("No Plugins"), systemImage: "puzzlepiece.extension")
        } description: {
          Text(L("Install a Quarry plugin folder containing plugin.json."))
        } actions: {
          Button(action: state.installPluginPanel) {
            Label(L("Install Folder"), systemImage: "folder.badge.plus")
          }
        }
      } else {
        List {
          ForEach(state.plugins) { plugin in
            VStack(alignment: .leading, spacing: 8) {
              HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                  Text(plugin.manifest.name)
                    .font(.headline)
                  Text("\(plugin.manifest.id) v\(plugin.manifest.version)")
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
                  Text(plugin.manifest.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                Spacer()

                Toggle(
                  L("Enabled"),
                  isOn: Binding(
                    get: { plugin.isEnabled },
                    set: { state.setPlugin(plugin, enabled: $0) }
                  )
                )
                .toggleStyle(.switch)
              }

              HStack {
                Text(plugin.manifest.permissions?.joined(separator: ", ") ?? L("No permissions"))
                  .font(.caption2.monospaced())
                  .foregroundStyle(.secondary)

                Spacer()

                ForEach(PluginRegistry.commands(for: plugin)) { command in
                  Button(command.title) {
                    state.openPluginCommand(command)
                  }
                }
              }

              if let error = plugin.error {
                Text(error)
                  .font(.caption)
                  .foregroundStyle(.red)
              }
            }
            .padding(.vertical, 6)
          }
        }
      }
    }
  }
}

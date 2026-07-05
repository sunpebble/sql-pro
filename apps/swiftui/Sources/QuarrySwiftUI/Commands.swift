import SwiftUI

struct QuarryCommands: Commands {
  @ObservedObject var state: QuarryAppState

  private var hasDatabase: Bool { state.hasActiveDatabase }

  var body: some Commands {
    CommandGroup(replacing: .newItem) {
      Button(L("New Database…"), action: state.createDatabasePanel)
        .keyboardShortcut("n")

      Button(L("Create Demo Database…"), action: state.createDemoDatabasePanel)

      Button(L("Open Database…"), action: state.openDatabasePanel)
        .keyboardShortcut("o")

      Button(L("Open Encrypted Database…"), action: state.openEncryptedDatabasePanel)
        .keyboardShortcut("o", modifiers: [.command, .shift])

      Button(L("Connect to Server…"), action: state.connectToServerPanel)
        .keyboardShortcut("k", modifiers: [.command, .shift])

      Menu(L("Open Recent")) {
        ForEach(state.recentDatabaseURLs, id: \.path) { url in
          Button(url.lastPathComponent) { state.openRecentDatabase(url) }
        }
      }
      .disabled(state.recentDatabaseURLs.isEmpty)

      Divider()

      Button(L("Close Database"), action: state.closeActiveSession)
        .keyboardShortcut("w", modifiers: [.command, .shift])
        .disabled(!hasDatabase)
    }

    CommandGroup(replacing: .saveItem) {
      Button(L("Save Connection Profile…"), action: state.saveCurrentConnectionProfile)
        .disabled(!hasDatabase)
    }

    CommandGroup(replacing: .importExport) {
      Button(L("Import CSV…"), action: state.importCSVPanel)
        .disabled(state.selectedTable == nil || !state.activeSessionIsSQLite)

      Button(L("Import JSON…"), action: state.importJSONPanel)
        .disabled(state.selectedTable == nil || !state.activeSessionIsSQLite)

      Divider()

      Button(L("Export CSV…"), action: state.exportCSVPanel)
        .disabled(!state.canExportCSV)

      Button(L("Export JSON…"), action: state.exportJSONPanel)
        .disabled(!state.canExportCSV)
    }

    CommandMenu(L("Query")) {
      Button(L("Run Query"), action: state.runQuery)
        .keyboardShortcut("r")
        .disabled(!hasDatabase)

      Button(L("Explain Query"), action: state.explainQuery)
        .keyboardShortcut("e", modifiers: [.command, .shift])
        .disabled(!state.activeSessionIsSQLite)

      Button(L("Save Query"), action: state.saveCurrentQuery)
        .keyboardShortcut("s")
        .disabled(state.queryText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
    }

    CommandMenu(L("Database")) {
      Button(L("Search All Tables")) { state.workspaceMode = .search }
        .keyboardShortcut("f", modifiers: [.command, .shift])
        .disabled(!hasDatabase)

      Button(L("Diagram"), action: state.loadDiagram)
        .keyboardShortcut("d")
        .disabled(!hasDatabase)

      Button(L("Maintenance"), action: state.showMaintenance)
        .disabled(!state.activeSessionIsSQLite)

      Button(L("Refresh Table"), action: state.loadSelectedTable)
        .keyboardShortcut("r", modifiers: [.command, .shift])
        .disabled(state.selectedTable == nil)

      Divider()

      Button(L("Generate Mock Data…"), action: state.generateMockDataPanel)
        .disabled(state.selectedTable == nil || !state.activeSessionIsSQLite)

      Button(L("Save Schema Snapshot…"), action: state.saveSchemaSnapshotPanel)
        .disabled(!state.activeSessionIsSQLite)

      Button(L("Compare Schema Snapshot…"), action: state.compareSchemaSnapshotPanel)
        .disabled(!state.activeSessionIsSQLite)

      Divider()

      Button(L("Backup Database…"), action: state.backupDatabasePanel)
        .disabled(!state.activeSessionIsSQLite)

      Button(L("Restore Database…"), action: state.restoreDatabasePanel)
        .disabled(!state.activeSessionIsSQLite)
    }
  }
}

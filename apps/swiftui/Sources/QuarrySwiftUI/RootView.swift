import AppKit
import QuarryCore
import SwiftUI

struct RootView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    NavigationSplitView {
      SidebarView(state: state)
        .navigationSplitViewColumnWidth(min: 240, ideal: 300)
    } detail: {
      DetailView(state: state)
    }
    .toolbar {
      Button(action: state.openDatabasePanel) {
        Label(L("Open"), systemImage: "folder")
      }

      Button(action: state.openEncryptedDatabasePanel) {
        Label(L("Open Encrypted"), systemImage: "lock")
      }

      Picker(L("Mode"), selection: $state.workspaceMode) {
        ForEach(WorkspaceMode.allCases) { mode in
          Text(L(mode.rawValue)).tag(mode)
        }
      }
      .pickerStyle(.segmented)
      .disabled(!state.hasActiveDatabase)

      Button(action: state.runQuery) {
        Label(L("Run"), systemImage: "play.fill")
      }
      .disabled(!state.hasActiveDatabase)
    }
    .alert(
      "Quarry",
      isPresented: Binding(
        get: { state.errorMessage != nil },
        set: { if !$0 { state.errorMessage = nil } }
      )
    ) {
      Button(L("OK"), role: .cancel) {}
    } message: {
      Text(state.errorMessage ?? "")
    }
    .tint(Brand.sun)
    .fontDesign(.rounded)
  }
}

struct SidebarView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    List {
      Section(L("Database")) {
        if let label = state.activeSessionLabel {
          VStack(alignment: .leading, spacing: 4) {
            Text(label)
              .font(.headline)
            if let url = state.databaseURL {
              Text(url.path)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            }
            Button(action: state.saveCurrentConnectionProfile) {
              Label(L("Save Profile"), systemImage: "bookmark")
            }
            .buttonStyle(.plain)
          }
        } else {
          Button(action: state.openDatabasePanel) {
            Label(L("Open Database"), systemImage: "folder")
          }
          Button(action: state.connectToServerPanel) {
            Label(L("Connect to Server"), systemImage: "network")
          }
        }
      }

      if !state.connectionProfiles.isEmpty {
        Section(L("Profiles")) {
          ForEach(state.connectionProfiles) { profile in
            HStack {
              Button {
                state.openProfile(profile)
              } label: {
                VStack(alignment: .leading, spacing: 3) {
                  Label(
                    profile.name,
                    systemImage: profile.kind == .sqlite
                      ? (profile.isEncrypted ? "lock" : "bookmark")
                      : "network"
                  )
                  Text(profile.kind == .sqlite ? profile.path : "\(profile.kind.rawValue) \(profile.user)@\(profile.host):\(profile.port)/\(profile.database)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                }
              }
              .buttonStyle(.plain)

              Spacer()

              Button(role: .destructive) {
                state.deleteConnectionProfile(profile)
              } label: {
                Image(systemName: "trash")
              }
              .buttonStyle(.borderless)
            }
          }
        }
      }

      if !state.sessions.isEmpty {
        Section(L("Open Connections")) {
          ForEach(state.sessions) { session in
            HStack {
              Button {
                state.activate(session)
              } label: {
                Label(session.label, systemImage: session.url == nil ? "network" : "externaldrive")
                  .foregroundStyle(session.id == state.activeSessionID ? Brand.sun : .primary)
              }
              .buttonStyle(.plain)

              Spacer()

              Button {
                state.closeSession(session)
              } label: {
                Image(systemName: "xmark.circle")
              }
              .buttonStyle(.borderless)
            }
          }
        }
      }

      if !state.recentDatabaseURLs.isEmpty {
        Section(L("Recent")) {
          ForEach(state.recentDatabaseURLs, id: \.path) { url in
            Button {
              state.openRecentDatabase(url)
            } label: {
              Label(url.lastPathComponent, systemImage: "clock")
            }
            .buttonStyle(.plain)
          }
        }
      }

      Section(L("Tables")) {
        if state.tables.isEmpty {
          Text(L("No tables"))
            .foregroundStyle(.secondary)
        } else {
          ForEach(state.tables) { table in
            Button {
              state.selectTable(table)
            } label: {
              Label(table.name, systemImage: table.type == "view" ? "eye" : "tablecells")
                .foregroundStyle(table == state.selectedTable ? Brand.sun : .primary)
            }
            .buttonStyle(.plain)
          }
        }
      }
    }
    .listStyle(.sidebar)
  }
}

struct DetailView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(spacing: 0) {
      HStack {
        VStack(alignment: .leading, spacing: 3) {
          Text("Quarry")
            .font(.title2.weight(.semibold))
          Text(state.activeSessionLabel ?? L("SwiftUI SQLite workspace"))
            .foregroundStyle(.secondary)
        }

        Spacer()
      }
      .padding()

      Divider()

      if !state.hasActiveDatabase {
        ContentUnavailableView {
          Label(L("Open a SQLite database"), systemImage: "externaldrive")
        } description: {
          Text(L("Choose a .sqlite, .sqlite3, or .db file to browse tables and run SQL."))
        } actions: {
          Button(action: state.openDatabasePanel) {
            Label(L("Open Database"), systemImage: "folder")
          }
          .buttonStyle(.brandProminent)

          Button(action: state.createDatabasePanel) {
            Label(L("New Database"), systemImage: "plus")
          }

          Button(action: state.connectToServerPanel) {
            Label(L("Connect to Server"), systemImage: "network")
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else if state.workspaceMode == .query {
        QueryWorkspaceView(state: state)
      } else if state.workspaceMode == .search {
        SearchWorkspaceView(state: state)
      } else if state.workspaceMode == .diagram {
        DiagramWorkspaceView(state: state)
      } else if state.workspaceMode == .ai {
        AIWorkspaceView(state: state)
      } else if state.workspaceMode == .maintenance {
        MaintenanceWorkspaceView(state: state)
      } else if state.workspaceMode == .plugins {
        PluginsWorkspaceView(state: state)
      } else {
        EditableTableWorkspaceView(state: state)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Brand.background)
  }
}

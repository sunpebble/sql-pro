import AppKit
import QuarryCore
import SwiftUI

struct MaintenanceWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Label(L("Maintenance"), systemImage: "wrench.and.screwdriver")
          .font(.headline)

        Text(state.activeSessionLabel ?? "")
          .font(.caption)
          .foregroundStyle(.secondary)

        Spacer()

        Button(action: state.runIntegrityCheck) {
          Label(L("Integrity"), systemImage: "checkmark.shield")
        }

        Button(action: state.runQuickCheck) {
          Label(L("Quick Check"), systemImage: "bolt.shield")
        }

        Button(action: state.runOptimize) {
          Label(L("Optimize"), systemImage: "speedometer")
        }

        Button(action: state.runVacuum) {
          Label(L("Vacuum"), systemImage: "arrow.triangle.2.circlepath")
        }

        Button(action: state.loadDatabaseInfo) {
          Label(L("Refresh"), systemImage: "arrow.clockwise")
        }
      }
      .padding()

      Divider()

      HStack(spacing: 0) {
        List {
          Section(L("Database Info")) {
            if state.databaseInfo.isEmpty {
              Text(L("No database info loaded"))
                .foregroundStyle(.secondary)
            } else {
              ForEach(state.databaseInfo) { item in
                HStack(alignment: .firstTextBaseline) {
                  Text(item.name)
                    .foregroundStyle(.secondary)
                  Spacer()
                  Text(item.value)
                    .font(.caption.monospaced())
                    .textSelection(.enabled)
                    .lineLimit(1)
                }
              }
            }
          }
        }
        .frame(minWidth: 360)

        Divider()

        VStack(alignment: .leading, spacing: 0) {
          HStack {
            Label(L("Last Result"), systemImage: "terminal")
              .font(.headline)
            Spacer()
          }
          .padding()

          Divider()

          if state.maintenanceMessages.isEmpty {
            ContentUnavailableView(L("No maintenance result"), systemImage: "terminal")
          } else {
            ScrollView {
              VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(state.maintenanceMessages.enumerated()), id: \.offset) { index, message in
                  Text(message)
                    .font(index == 0 ? .caption.weight(.semibold) : .caption.monospaced())
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
              }
              .padding()
            }
          }
        }
      }
    }
    .onAppear {
      if state.databaseInfo.isEmpty {
        state.loadDatabaseInfo()
      }
    }
  }
}

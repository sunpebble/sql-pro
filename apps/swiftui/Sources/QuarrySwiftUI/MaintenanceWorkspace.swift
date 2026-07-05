import AppKit
import QuarryCore
import SwiftUI

struct MaintenanceWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  private var maintenanceHeader: some View {
    HStack {
      Label(L("Maintenance"), systemImage: "wrench.and.screwdriver")
        .font(.headline)
        .labelStyle(.titleAndIcon) // title stays text even in icon-only mode
        .fixedSize()

      Text(state.activeSessionLabel ?? "")
        .font(.caption)
        .foregroundStyle(Brand.textSecondary)

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
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Icon-only in narrow windows, matching the table workspace toolbar.
      ViewThatFits(in: .horizontal) {
        maintenanceHeader.labelStyle(.titleAndIcon)
        maintenanceHeader.labelStyle(.iconOnly)
      }
      .padding()

      Divider()

      HStack(spacing: 0) {
        List {
          Section(L("Database Info")) {
            if state.databaseInfo.isEmpty {
              Text(L("No database info loaded"))
                .foregroundStyle(Brand.textSecondary)
            } else {
              ForEach(state.databaseInfo) { item in
                HStack(alignment: .firstTextBaseline) {
                  Text(item.name)
                    .foregroundStyle(Brand.textSecondary)
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
              .frame(maxWidth: .infinity, maxHeight: .infinity)
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

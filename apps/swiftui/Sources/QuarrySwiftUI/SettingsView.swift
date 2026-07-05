import SwiftUI

struct SettingsView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    Form {
      Section(L("Data Grid")) {
        Picker(L("Rows per page"), selection: $state.pageSize) {
          ForEach([50, 100, 200, 500], id: \.self) { size in
            Text("\(size)").tag(size)
          }
        }
      }

      Section(L("Pro License")) {
        HStack {
          Text(state.licenseStatusText.isEmpty ? L("Free version") : state.licenseStatusText)
          if state.licenseBusy {
            ProgressView()
              .controlSize(.small)
          }
        }

        if let license = state.licenseInfo {
          Text(license.email)
            .font(.caption)
            .foregroundStyle(Brand.textSecondary)
          Text(String(format: L("Expires %@"), license.expiresAt))
            .font(.caption)
            .foregroundStyle(Brand.textSecondary)

          HStack {
            Button(L("Manage Subscription"), action: state.openLicensePortal)
            Button(L("Deactivate"), role: .destructive, action: state.deactivateLicense)
          }
        } else {
          Button(L("Activate License…"), action: state.activateLicensePanel)
            .disabled(state.licenseBusy)
        }
      }
    }
    .formStyle(.grouped)
    .frame(width: 420)
    .padding()
  }
}

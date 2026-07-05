import SwiftUI

struct SettingsView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    Form {
      Section(L("Data Grid")) {
        Picker(L("Rows per page"), selection: $state.pageSize) {
          ForEach([100, 200, 500, 1000, 2000], id: \.self) { size in
            Text("\(size)").tag(size)
          }
        }
      }

      Section(L("AI Provider")) {
        TextField(L("Endpoint"), text: $state.aiSettings.endpoint)
        TextField(L("Model"), text: $state.aiSettings.model)
        SecureField(L("API key"), text: $state.aiSettings.apiKey)
        Text(L("The API key stays in memory for this app session."))
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    }
    .formStyle(.grouped)
    .frame(width: 420)
    .padding()
    .onDisappear(perform: state.saveAISettings)
  }
}

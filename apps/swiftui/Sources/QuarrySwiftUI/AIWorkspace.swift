import AppKit
import QuarryCore
import SwiftUI

struct AIWorkspaceView: View {
  @ObservedObject var state: QuarryAppState

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Label(L("AI"), systemImage: "sparkles")
          .font(.headline)

        Spacer()

        Button(action: state.generateSQLWithAI) {
          Label(L("Generate SQL"), systemImage: "wand.and.sparkles")
        }
        .buttonStyle(.brandProminent)
        .disabled(state.aiBusy || !state.hasActiveDatabase)

        Button(action: state.explainSQLWithAI) {
          Label(L("Explain SQL"), systemImage: "text.bubble")
        }
        .disabled(state.aiBusy || state.queryText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
      }
      .padding()

      Divider()

      Form {
        Section(L("Provider")) {
          TextField(L("Endpoint"), text: $state.aiSettings.endpoint)
          TextField(L("Model"), text: $state.aiSettings.model)
          SecureField(L("API key"), text: $state.aiSettings.apiKey)
          Text(L("The API key stays in memory for this app session."))
            .font(.caption)
            .foregroundStyle(.secondary)
        }

        Section(L("Natural Language to SQL")) {
          TextEditor(text: $state.aiRequest)
            .font(.body)
            .frame(minHeight: 90)

          Button(action: state.generateSQLWithAI) {
            Label(L("Generate SQL"), systemImage: "wand.and.sparkles")
          }
          .disabled(state.aiBusy || state.aiRequest.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }

        Section(L("Current SQL")) {
          SQLEditor(text: $state.queryText)
            .frame(minHeight: 110)

          Button(action: state.explainSQLWithAI) {
            Label(L("Explain SQL"), systemImage: "text.bubble")
          }
          .disabled(state.aiBusy || state.queryText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }

        Section(L("Output")) {
          if state.aiBusy {
            ProgressView()
          }

          Text(state.aiResponse.isEmpty ? L("No AI output yet.") : state.aiResponse)
            .font(.system(.body, design: state.aiResponse.lowercased().contains("select") ? .monospaced : .default))
            .textSelection(.enabled)
        }
      }
      .formStyle(.grouped)
      .padding()
    }
  }
}

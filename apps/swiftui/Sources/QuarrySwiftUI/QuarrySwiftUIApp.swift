import SwiftUI

@main
struct QuarrySwiftUIApp: App {
  @StateObject private var state = QuarryAppState()

  var body: some Scene {
    WindowGroup("Quarry") {
      RootView(state: state)
        .frame(minWidth: 1040, minHeight: 680)
    }
    .commands {
      QuarryCommands(state: state)
    }

    Settings {
      SettingsView(state: state)
    }
  }
}

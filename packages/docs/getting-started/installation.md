# Installation

This guide covers how to install Quarry on macOS.

## System Requirements

Before installing Quarry, make sure your system meets these requirements:

- **Operating System**: macOS 14 (Sonoma) or later
- **Hardware**: Apple Silicon Mac (M1 or newer)

::: info macOS Only
Quarry is a native SwiftUI application and is only available for macOS. Windows and Linux are not supported.
:::

## Download and Install

1. Download the latest `Quarry-x.x.x.zip` from the [GitHub Releases](https://github.com/sunpebble/quarry/releases) page

2. Double-click the downloaded `.zip` file to unpack it (Safari may do this automatically)

3. Drag **Quarry.app** to your **Applications** folder

4. Open Quarry from your Applications folder or Spotlight search

::: tip Notarized Build
Release builds are signed and notarized for Apple Silicon, so macOS opens them without extra steps.
:::

### If macOS Shows a Security Warning

If you see a Gatekeeper prompt on first launch (for example when running a non-release build):

1. Right-click (or Control-click) on Quarry in your Applications folder
2. Select **Open** from the context menu
3. Click **Open** in the dialog that appears

You only need to do this once. After the first launch, you can open Quarry normally.

## Build from Source

If you prefer to build Quarry from source, or want to contribute to development:

### Prerequisites

- **macOS 14+** with **Xcode 15+** (Swift toolchain)
- **Homebrew** libraries the database engines link against:

  ```bash
  brew install sqlcipher postgresql@16 mysql
  ```

### Build Steps

```bash
# Clone the repository
git clone https://github.com/sunpebble/quarry.git
cd quarry/apps/swiftui

# Debug build
swift build

# Run the app
swift run QuarrySwiftUI
```

See `apps/swiftui/README.md` in the repository for packaging and test details.

## Verifying Installation

After installation, verify Quarry is working correctly:

1. **Launch the application** - Quarry should open to the welcome screen
2. **Check the theme** - The app should match your system's light/dark appearance
3. **Open a test database** - Create or open a SQLite database, or use **File → Create Demo Database…**

If you encounter any issues, check the [Troubleshooting](/troubleshooting) guide.

## Updating Quarry

Quarry currently requires manual updates:

1. Download the latest `Quarry-*.zip` from the [Releases page](https://github.com/sunpebble/quarry/releases)
2. Replace the app in your Applications folder with the new version
3. Your settings and recent databases will be preserved

::: tip Stay Updated
Watch the [GitHub repository](https://github.com/sunpebble/quarry) to get notified of new releases.
:::

## Next Steps

Now that you have Quarry installed:

- [Connect to your first database](/getting-started/first-connection) - Learn how to open and work with a database
- [Explore features](/features/) - Discover all the powerful features Quarry offers
- [Learn keyboard shortcuts](/shortcuts) - Speed up your workflow with keyboard shortcuts

# Installation

This guide covers how to install Quarry on macOS, Windows, and Linux.

## System Requirements

Before installing Quarry, make sure your system meets these requirements:

- **Operating System**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 18.04+, Fedora 32+, or equivalent)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: 200 MB for the application
- **Display**: 1280x720 minimum resolution

## Download

Download the latest release for your platform from the [GitHub Releases](https://github.com/sunpebble/quarry/releases) page.

| Platform                  | File                         | Architecture      |
| ------------------------- | ---------------------------- | ----------------- |
| **macOS** (Apple Silicon) | `quarry-x.x.x-arm64.dmg`     | M1/M2/M3/M4 chips |
| **macOS** (Intel)         | `quarry-x.x.x-x64.dmg`       | Intel processors  |
| **Windows**               | `quarry-x.x.x-setup-x64.exe` | 64-bit Windows    |
| **Linux** (AppImage)      | `quarry-x.x.x-x64.AppImage`  | Universal package |
| **Linux** (Debian/Ubuntu) | `quarry-x.x.x-x64.deb`       | .deb package      |

::: tip Which macOS version should I download?

- If you have a Mac with an **M1, M2, M3, or M4** chip (2020 or newer), download the **Apple Silicon** version (`arm64.dmg`)
- If you have an **older Mac with an Intel processor**, download the **Intel** version (`x64.dmg`)

To check your chip type, click the Apple menu () > **About This Mac** and look for "Chip" or "Processor"
:::

## macOS Installation

### Apple Silicon (M1/M2/M3/M4)

1. Download `quarry-x.x.x-arm64.dmg` from the [Releases page](https://github.com/sunpebble/quarry/releases)

2. Double-click the downloaded `.dmg` file to mount it

3. Drag **Quarry** to your **Applications** folder

4. Eject the disk image by right-clicking it in Finder and selecting "Eject"

5. Open Quarry from your Applications folder or Spotlight search

### Intel Mac

1. Download `quarry-x.x.x-x64.dmg` from the [Releases page](https://github.com/sunpebble/quarry/releases)

2. Follow the same steps as above (steps 2-5)

### First Launch on macOS

When you first open Quarry, macOS may display a security warning because the app is downloaded from the internet and not from the Mac App Store.

**To open the app:**

1. Right-click (or Control-click) on Quarry in your Applications folder
2. Select **Open** from the context menu
3. Click **Open** in the dialog that appears

You only need to do this once. After the first launch, you can open Quarry normally.

::: warning Gatekeeper Warning
If you see "Quarry cannot be opened because the developer cannot be verified":

1. Open **System Preferences** > **Security & Privacy** > **General**
2. Click **Open Anyway** next to the message about Quarry
3. Click **Open** in the confirmation dialog
   :::

## Windows Installation

1. Download `quarry-x.x.x-setup-x64.exe` from the [Releases page](https://github.com/sunpebble/quarry/releases)

2. Double-click the downloaded installer to run it

3. If Windows SmartScreen appears, click **More info** and then **Run anyway**

4. Follow the installation wizard:
   - Choose installation directory (default: `C:\Program Files\Quarry`)
   - Select whether to create a desktop shortcut
   - Click **Install**

5. Once installation is complete, launch Quarry from:
   - The Start menu
   - Desktop shortcut (if created)
   - Or search for "Quarry" in Windows search

### Windows Defender SmartScreen

If Windows SmartScreen blocks the installer:

1. Click **More info**
2. Click **Run anyway**
3. Proceed with the installation

This warning appears because the app is new and hasn't built up a reputation with Microsoft yet. Quarry is open-source and safe to install.

## Linux Installation

Quarry provides two package formats for Linux: AppImage (universal) and .deb (Debian/Ubuntu).

### AppImage (Recommended)

AppImage works on most Linux distributions without installation:

1. Download `quarry-x.x.x-x64.AppImage` from the [Releases page](https://github.com/sunpebble/quarry/releases)

2. Make the AppImage executable:

   ```bash
   chmod +x quarry-x.x.x-x64.AppImage
   ```

3. Run Quarry:
   ```bash
   ./quarry-x.x.x-x64.AppImage
   ```

::: tip Integration with your desktop
To add Quarry to your application menu, you can use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) or manually create a `.desktop` file.
:::

### Debian/Ubuntu (.deb)

For Debian-based distributions (Ubuntu, Linux Mint, Pop!\_OS, etc.):

1. Download `quarry-x.x.x-x64.deb` from the [Releases page](https://github.com/sunpebble/quarry/releases)

2. Install using `dpkg`:

   ```bash
   sudo dpkg -i quarry-x.x.x-x64.deb
   ```

3. If there are missing dependencies, fix them with:

   ```bash
   sudo apt-get install -f
   ```

4. Launch Quarry from your application menu or run:
   ```bash
   quarry
   ```

### Uninstalling on Linux

**AppImage**: Simply delete the AppImage file.

**Debian package**:

```bash
sudo dpkg -r quarry
```

## Build from Source

If you prefer to build Quarry from source, or want to contribute to development:

### Prerequisites

- **Node.js** 20 or later
- **pnpm** 10 or later
- **Git**

### Build Steps

```bash
# Clone the repository
git clone https://github.com/sunpebble/quarry.git
cd quarry

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build:mac    # macOS
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

The built application will be in the `dist` folder.

::: info Icon Generation (Optional)
To generate app icons from the SVG source, you need ImageMagick and librsvg installed:

```bash
# macOS
brew install imagemagick librsvg

# Ubuntu/Debian
sudo apt install imagemagick librsvg2-bin

# Then generate icons
pnpm build:icons
```

:::

## Verifying Installation

After installation, verify Quarry is working correctly:

1. **Launch the application** - Quarry should open to the welcome screen
2. **Check the theme** - The app should match your system's light/dark theme
3. **Open a test database** - Create or open a SQLite database to test functionality

If you encounter any issues, check the [Troubleshooting](/troubleshooting) guide.

## Updating Quarry

Quarry currently requires manual updates:

1. Download the latest version from the [Releases page](https://github.com/sunpebble/quarry/releases)
2. Install it following the same steps for your platform
3. Your settings and recent databases will be preserved

::: tip Stay Updated
Watch the [GitHub repository](https://github.com/sunpebble/quarry) to get notified of new releases.
:::

## Next Steps

Now that you have Quarry installed:

- [Connect to your first database](/getting-started/first-connection) - Learn how to open and work with a SQLite database
- [Explore features](/features/) - Discover all the powerful features Quarry offers
- [Learn keyboard shortcuts](/shortcuts) - Speed up your workflow with keyboard shortcuts

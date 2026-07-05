/* eslint-disable no-template-curly-in-string, node/prefer-global/process */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const isMacCiBuild = process.platform === 'darwin' && process.env.CI === 'true';

/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: 'com.quarry.app',
  productName: 'Quarry',
  copyright: 'Copyright © 2025 kunish',
  forceCodeSigning: isMacCiBuild,

  // Override scoped package name to avoid @ symbol issues with 7-Zip
  extraMetadata: {
    name: 'quarry',
  },

  directories: {
    buildResources: 'build',
  },

  files: [
    {
      from: '.',
      to: '.',
      filter: ['package.json', 'out/**/*', '!out/**/*.map'],
    },
    // Include workspace root node_modules with pnpm virtual store
    // pnpm uses symlinks that point to .pnpm, so we need to include both
    {
      from: '../../node_modules',
      to: 'node_modules',
      filter: [
        '**/*',
        '!**/*.md',
        '!**/*.ts',
        '!**/*.map',
        '!**/LICENSE*',
        '!**/CHANGELOG*',
        '!**/README*',
        // pnpm bin shims are not runtime dependencies and can point at
        // optional platform packages that were not installed for this runner.
        '!**/.bin/**',
        '!**/.github/**',
        '!**/docs/**',
        '!**/test/**',
        '!**/tests/**',
        '!**/__tests__/**',
        '!**/example/**',
        '!**/examples/**',
        // Don't exclude .pnpm - it contains the actual package files
      ],
    },
  ],

  asar: true,

  // Native modules that need to be unpacked from asar
  asarUnpack: [
    '**/node_modules/sharp/**/*',
    '**/node_modules/@img/**/*',
    '**/node_modules/better-sqlite3-multiple-ciphers/**/*',
    '**/node_modules/@ffmpeg-installer/**/*',
    '**/node_modules/@ffprobe-installer/**/*',
  ],

  generateUpdatesFilesForAllChannels: true,

  // Ensure executable name matches productName (not the scoped package name)
  executableName: 'Quarry',

  // Artifact naming - avoid using ${name} which includes the @ symbol from scoped package
  artifactName: '${productName}-${version}-${arch}.${ext}',

  // macOS Configuration
  mac: {
    icon: 'resources/icon.icns',
    category: 'public.app-category.developer-tools',
    entitlementsInherit: 'build/entitlements.mac.plist',
    // Release notarization requires Developer ID signing. electron-builder can
    // otherwise fall back to Apple Development certificates from the keychain.
    identity: isMacCiBuild
      ? 'Developer ID Application: shuyuan sun (62HCT6Q83X)'
      : undefined,
    sign: './scripts/mac-sign-by-hash.cjs',
    // Signing + notarization happen in CI when CSC_LINK / APPLE_API_KEY env
    // vars are present (sunpebble org secrets); both are skipped
    // automatically for local builds without them.
    // Build dir first, then create zip manually to avoid 7za @ prefix issues
    target: [
      {
        target: 'dir',
      },
    ],
    // Explicitly set artifact name to use productName (avoid @ from package name)
    artifactName: '${productName}-${version}-${arch}-mac.${ext}',
  },

  // Disable default DMG creation completely
  dmg: null,

  // Windows Configuration
  win: {
    icon: 'resources/icon.ico',
  },

  nsis: {
    artifactName: '${productName}-${version}-setup.${ext}',
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}',
    createDesktopShortcut: 'always',
  },

  // Linux Configuration
  linux: {
    target: ['AppImage', 'snap', 'deb'],
    icon: 'resources/icons',
    category: 'Development',
  },

  appImage: {
    artifactName: '${productName}-${version}.${ext}',
  },

  npmRebuild: true,

  // CI rebuilds native deps explicitly before packaging. Returning false here
  // skips electron-builder's pnpm dependency collector, which emits huge pnpm 11
  // workspace trees and can fail with EMFILE on GitHub runners.
  beforeBuild: async () => false,

  // Fix readable-stream compatibility for lazystream/archiver
  // readable-stream v3 removed passthrough.js, but lazystream expects it
  afterPack: async (context) => {
    const appOutDir = context.appOutDir;
    const resourcesDir = path.join(appOutDir, 'Contents', 'Resources');

    // For non-asar builds, fix the readable-stream directly
    const nodeModulesPath = path.join(
      resourcesDir,
      'app',
      'node_modules',
      'readable-stream'
    );

    if (fs.existsSync(nodeModulesPath)) {
      // Create passthrough.js shim for readable-stream v3
      const passthroughShim = `module.exports = require('./lib/_stream_passthrough.js');`;
      const duplexShim = `module.exports = require('./lib/_stream_duplex.js');`;
      const transformShim = `module.exports = require('./lib/_stream_transform.js');`;

      const passthroughPath = path.join(nodeModulesPath, 'passthrough.js');
      const duplexPath = path.join(nodeModulesPath, 'duplex.js');
      const transformPath = path.join(nodeModulesPath, 'transform.js');

      if (!fs.existsSync(passthroughPath)) {
        fs.writeFileSync(passthroughPath, passthroughShim);
        console.log('Created readable-stream/passthrough.js shim');
      }
      if (!fs.existsSync(duplexPath)) {
        fs.writeFileSync(duplexPath, duplexShim);
        console.log('Created readable-stream/duplex.js shim');
      }
      if (!fs.existsSync(transformPath)) {
        fs.writeFileSync(transformPath, transformShim);
        console.log('Created readable-stream/transform.js shim');
      }
    }
  },

  // Auto-update configuration - Cloudflare R2
  publish: {
    provider: 'generic',
    url: 'https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev',
    channel: 'latest',
  },

  // After all artifacts are built, create DMG manually using hdiutil
  afterAllArtifactBuild: async (buildResult) => {
    if (process.platform !== 'darwin') {
      return [];
    }

    const appName = 'Quarry';
    const version =
      buildResult.configuration.extraMetadata?.version ||
      require('./package.json').version;
    const outDir = buildResult.outDir;

    // Find the .app bundle
    const macDir = fs.readdirSync(outDir).find((dir) => dir.startsWith('mac-'));
    if (!macDir) {
      console.log('No mac build directory found, skipping DMG creation');
      return [];
    }

    // Try to find the app bundle - it might be named differently based on electron-builder version
    // Possible names: "Quarry.app" (productName) or "@quarryapp.app" (from package name)
    const macDirPath = path.join(outDir, macDir);
    const appFiles = fs
      .readdirSync(macDirPath)
      .filter((f) => f.endsWith('.app'));

    if (appFiles.length === 0) {
      console.log(
        `No .app bundle found in ${macDirPath}, skipping DMG creation`
      );
      return [];
    }

    // Use the first .app file found
    const appPath = path.join(macDirPath, appFiles[0]);
    console.log(`Found app bundle: ${appFiles[0]}`);

    if (!fs.existsSync(appPath)) {
      console.log(`App bundle not found at ${appPath}, skipping DMG creation`);
      return [];
    }

    const arch = macDir.includes('arm64')
      ? 'arm64'
      : macDir.includes('universal')
        ? 'universal'
        : 'x64';
    const dmgPath = path.join(outDir, `${appName}-${version}-${arch}-mac.dmg`);

    console.log(`Creating DMG manually using hdiutil...`);
    console.log(`  Source: ${appPath}`);
    console.log(`  Output: ${dmgPath}`);

    try {
      // Remove existing DMG if present
      if (fs.existsSync(dmgPath)) {
        fs.unlinkSync(dmgPath);
      }

      // Create DMG using hdiutil directly with execFileSync (safer than exec)
      // Using UDZO format (zlib compressed) which is widely compatible
      execFileSync(
        'hdiutil',
        [
          'create',
          '-volname',
          appName,
          '-srcfolder',
          appPath,
          '-ov',
          '-format',
          'UDZO',
          dmgPath,
        ],
        { stdio: 'inherit' }
      );

      console.log(`DMG created successfully: ${dmgPath}`);

      // Return the DMG path so it's included in the build results
      return [dmgPath];
    } catch (error) {
      console.error('Failed to create DMG:', error.message);
      throw error;
    }
  },
};

module.exports = config;

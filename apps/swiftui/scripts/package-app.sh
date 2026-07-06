#!/usr/bin/env bash
# Builds, bundles, and signs Quarry.app from the SwiftPM package.
#
# Usage: scripts/package-app.sh <version> [signing-identity]
#   version           e.g. 0.1.0 (used for CFBundleVersion and artifact name)
#   signing-identity  defaults to "Developer ID Application"
#
# Output: dist/Quarry.app, dist/Quarry-<version>.zip, and dist/Quarry-<version>.dmg
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="${1:?usage: package-app.sh <version> [signing-identity]}"
IDENTITY="${2:-Developer ID Application}"

if [ "$(uname -m)" != "arm64" ]; then
  echo "ERROR: package-app.sh only supports arm64 macOS builds" >&2
  exit 1
fi

# Fall back to ad-hoc signing for local dev machines without the cert;
# CI imports the Developer ID certificate explicitly.
if ! security find-identity -v -p codesigning | grep -q "$IDENTITY"; then
  echo "WARNING: '$IDENTITY' not found in keychain, using ad-hoc signing" >&2
  IDENTITY="-"
fi
APP_NAME="Quarry"
BUNDLE_ID="com.quarry.app.native"
DIST="dist"
APP="$DIST/$APP_NAME.app"
BIN="$APP/Contents/MacOS/$APP_NAME"
FRAMEWORKS="$APP/Contents/Frameworks"
RESOURCES="$APP/Contents/Resources"

echo "==> swift build -c release"
swift build -c release

echo "==> assembling $APP"
rm -rf "$DIST"
mkdir -p "$APP/Contents/MacOS" "$FRAMEWORKS" "$RESOURCES"
cp .build/release/QuarrySwiftUI "$BIN"

# SwiftPM resource bundle (localizations) must sit in Contents/Resources
# for Bundle.module to resolve inside an .app.
cp -R .build/release/QuarrySwiftUI_QuarrySwiftUI.bundle "$RESOURCES/"

cp Resources/Quarry.icns "$RESOURCES/$APP_NAME.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
  <key>CFBundleIconFile</key><string>$APP_NAME</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.developer-tools</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
  <key>NSHumanReadableCopyright</key><string>© Sunpebble Labs</string>
</dict>
</plist>
PLIST

echo "==> bundling homebrew dylibs"
# Recursively copy every /opt/homebrew dylib the binary depends on into
# Contents/Frameworks and point all references at @executable_path.
list_brew_deps() {
  otool -L "$1" | awk 'NR>1 {print $1}' | grep '^/opt/homebrew' || true
}

queue=$(list_brew_deps "$BIN")
while [ -n "$queue" ]; do
  next=""
  for dep in $queue; do
    base=$(basename "$dep")
    if [ ! -f "$FRAMEWORKS/$base" ]; then
      cp -L "$dep" "$FRAMEWORKS/$base"
      chmod +w "$FRAMEWORKS/$base"
      codesign --remove-signature "$FRAMEWORKS/$base" 2>/dev/null || true
      next="$next $(list_brew_deps "$FRAMEWORKS/$base")"
    fi
  done
  queue=$(echo "$next" | tr ' ' '\n' | sort -u | grep . || true)
done

rewrite_refs() {
  local target="$1"
  for dep in $(list_brew_deps "$target"); do
    install_name_tool -change "$dep" "@executable_path/../Frameworks/$(basename "$dep")" "$target"
  done
}

rewrite_refs "$BIN"
for lib in "$FRAMEWORKS"/*.dylib; do
  install_name_tool -id "@executable_path/../Frameworks/$(basename "$lib")" "$lib"
  rewrite_refs "$lib"
done

# The build links with -rpath /opt/homebrew/...; drop them so the bundled
# copies are the only resolution path.
for rpath in $(otool -l "$BIN" | awk '/LC_RPATH/{getline; getline; print $2}' | grep '^/opt/homebrew' || true); do
  install_name_tool -delete_rpath "$rpath" "$BIN"
done

if otool -L "$BIN" | grep -q '^	/opt/homebrew'; then
  echo "ERROR: binary still references /opt/homebrew" >&2
  exit 1
fi

echo "==> codesigning with: $IDENTITY"
# Hardened runtime enables library validation, which rejects ad-hoc dylibs
# (no Team ID) — only enable it for real identities. Notarization needs it,
# so CI always signs with the Developer ID.
SIGN_FLAGS=(--force --sign "$IDENTITY")
if [ "$IDENTITY" != "-" ]; then
  SIGN_FLAGS+=(--options runtime --timestamp)
fi
for lib in "$FRAMEWORKS"/*.dylib; do
  codesign "${SIGN_FLAGS[@]}" "$lib"
done
codesign "${SIGN_FLAGS[@]}" "$APP"

echo "==> verifying signature"
codesign --verify --deep --strict --verbose=2 "$APP"

DMG="$DIST/$APP_NAME-$VERSION.dmg"
ZIP="$DIST/$APP_NAME-$VERSION.zip"
DMG_ROOT="$DIST/dmg-root"

create_dmg() {
  rm -rf "$DMG_ROOT"
  mkdir -p "$DMG_ROOT"
  cp -R "$APP" "$DMG_ROOT/"
  if diskutil image create from --help >/dev/null 2>&1; then
    diskutil image create from --format UDZO --volumeName "$APP_NAME" "$DMG_ROOT" "$DMG"
  else
    hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_ROOT" -ov -format UDZO "$DMG"
  fi
  rm -rf "$DMG_ROOT"
}

echo "==> creating $ZIP"
ditto -c -k --keepParent "$APP" "$ZIP"
echo "==> creating $DMG"
create_dmg
echo "done: $ZIP"
echo "done: $DMG"

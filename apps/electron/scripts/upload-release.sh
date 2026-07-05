#!/bin/bash
# Upload release artifacts to Cloudflare R2
# Usage: ./scripts/upload-release.sh [version]
#
# This script uploads the built artifacts from dist/ to the R2 bucket.
# Run after: pnpm build:mac / pnpm build:win / pnpm build:linux

set -e

BUCKET_NAME="quarry-releases"
DIST_DIR="dist"

# Get version from package.json if not provided
VERSION=${1:-$(node -p "require('./package.json').version")}

echo "📦 Uploading Quarry v${VERSION} to Cloudflare R2..."
echo "   Bucket: ${BUCKET_NAME}"
echo "   Source: ${DIST_DIR}/"
echo ""

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
	echo "❌ Error: dist/ directory not found. Run build first."
	exit 1
fi

# Upload all release files
upload_file() {
	local file="$1"
	local filename=$(basename "$file")

	echo "⬆️  Uploading: $filename"
	npx wrangler r2 object put "${BUCKET_NAME}/${filename}" --file="$file" --content-type="application/octet-stream"
}

# Upload platform-specific artifacts
cd "$DIST_DIR"

# macOS files
for f in *.dmg *.zip; do
	[ -f "$f" ] && upload_file "$f"
done

# Windows files
for f in *.exe; do
	[ -f "$f" ] && upload_file "$f"
done

# Linux files
for f in *.AppImage *.deb *.snap; do
	[ -f "$f" ] && upload_file "$f"
done

# Upload update manifests (critical for auto-update)
for f in latest*.yml latest*.yaml; do
	[ -f "$f" ] && {
		echo "⬆️  Uploading manifest: $f"
		npx wrangler r2 object put "${BUCKET_NAME}/$f" --file="$f" --content-type="text/yaml"
	}
done

# Upload blockmap files (for differential updates)
for f in *.blockmap; do
	[ -f "$f" ] && upload_file "$f"
done

cd ..

echo ""
echo "✅ Upload complete!"
echo ""
echo "📥 Download URLs:"
echo "   https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev/"
echo ""
echo "🔄 Auto-update will check:"
echo "   https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev/latest-mac.yml"
echo "   https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev/latest.yml (Windows)"
echo "   https://pub-6f495fdfb8a34d15a9195bccedc15b91.r2.dev/latest-linux.yml"

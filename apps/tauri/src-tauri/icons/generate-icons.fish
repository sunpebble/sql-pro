#!/usr/bin/env fish

# Icon generation script for SQL Pro (Tauri)
# Requires: ImageMagick (brew install imagemagick) and librsvg (brew install librsvg)

set SCRIPT_DIR (dirname (status filename))

echo "Generating icons from SVG..."

# Check dependencies
if not command -v convert &>/dev/null
    echo "Error: ImageMagick is required. Install with: brew install imagemagick"
    exit 1
end

if not command -v rsvg-convert &>/dev/null
    echo "Error: librsvg is required. Install with: brew install librsvg"
    exit 1
end

# Generate PNG from SVG at various sizes
echo "Generating PNG files..."

# Generate icon sizes for Tauri
set sizes 16 24 32 48 64 128 256 512
for size in $sizes
    rsvg-convert -w $size -h $size $SCRIPT_DIR/icon.svg >$SCRIPT_DIR/{$size}x{$size}.png
    echo "  Generated {$size}x{$size}.png"
end

# Generate 128x128@2x (256x256 but named differently)
rsvg-convert -w 256 -h 256 $SCRIPT_DIR/icon.svg >$SCRIPT_DIR/128x128@2x.png
echo "  Generated 128x128@2x.png"

# Generate macOS .icns
echo "Generating macOS .icns..."
set ICONSET_DIR $SCRIPT_DIR/icon.iconset
mkdir -p $ICONSET_DIR

# macOS icon sizes
rsvg-convert -w 16 -h 16 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_16x16.png
rsvg-convert -w 32 -h 32 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_16x16@2x.png
rsvg-convert -w 32 -h 32 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_32x32.png
rsvg-convert -w 64 -h 64 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_32x32@2x.png
rsvg-convert -w 128 -h 128 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_128x128.png
rsvg-convert -w 256 -h 256 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_128x128@2x.png
rsvg-convert -w 256 -h 256 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_256x256.png
rsvg-convert -w 512 -h 512 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_256x256@2x.png
rsvg-convert -w 512 -h 512 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_512x512.png
rsvg-convert -w 1024 -h 1024 $SCRIPT_DIR/icon.svg >$ICONSET_DIR/icon_512x512@2x.png

iconutil -c icns $ICONSET_DIR -o $SCRIPT_DIR/icon.icns
rm -rf $ICONSET_DIR
echo "  Generated icon.icns"

# Generate Windows .ico
echo "Generating Windows .ico..."
rsvg-convert -w 256 -h 256 $SCRIPT_DIR/icon.svg | convert - \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 24x24 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 \
    $SCRIPT_DIR/icon.ico
echo "  Generated icon.ico"

echo "Done! Icons generated successfully."

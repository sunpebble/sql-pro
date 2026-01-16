#!/bin/bash
# Fix sharp libvips linking issue in pnpm monorepo
# This is needed because pnpm doesn't properly link optional dependencies
# inside nested node_modules

SHARP_IMG_DIR="node_modules/sharp/node_modules/@img"
LIBVIPS_DIR="node_modules/@img/sharp-libvips-darwin-arm64"

if [ -d "$SHARP_IMG_DIR" ] && [ -d "$LIBVIPS_DIR" ] && [ ! -d "$SHARP_IMG_DIR/sharp-libvips-darwin-arm64" ]; then
  mkdir -p "$SHARP_IMG_DIR/sharp-libvips-darwin-arm64"
  ln -sf "../../../../@img/sharp-libvips-darwin-arm64/lib" "$SHARP_IMG_DIR/sharp-libvips-darwin-arm64/lib"
  echo "Fixed sharp libvips linking"
fi

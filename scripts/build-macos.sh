#!/bin/bash
set -e

# ============================================================================
# Universal macOS Build Script with Code Signing
# ============================================================================
#
# Prerequisites:
# 1. Install Rust targets:
#    rustup target add aarch64-apple-darwin x86_64-apple-darwin
#
# 2. Set environment variables (or they will be prompted):
#    - APPLE_SIGNING_IDENTITY: Your signing certificate name
#      Example: "Developer ID Application: Your Name (TEAMID)"
#
# 3. For notarization (optional), also set:
#    - APPLE_ID: Your Apple ID email
#    - APPLE_PASSWORD: App-specific password
#    - APPLE_TEAM_ID: Your Team ID
#
# Usage:
#    ./scripts/build-macos.sh              # Build and sign
#    ./scripts/build-macos.sh --notarize   # Build, sign, and notarize
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env file if it exists
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for notarization flag
NOTARIZE=false
if [[ "$1" == "--notarize" ]]; then
    NOTARIZE=true
fi

# Verify required tools
command -v rustup >/dev/null 2>&1 || { log_error "rustup is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { log_error "pnpm is required but not installed."; exit 1; }

# Check Rust targets
log_info "Checking Rust targets..."
if ! rustup target list --installed | grep -q "aarch64-apple-darwin"; then
    log_info "Installing aarch64-apple-darwin target..."
    rustup target add aarch64-apple-darwin
fi

if ! rustup target list --installed | grep -q "x86_64-apple-darwin"; then
    log_info "Installing x86_64-apple-darwin target..."
    rustup target add x86_64-apple-darwin
fi

# Get signing identity
if [[ -z "$APPLE_SIGNING_IDENTITY" ]]; then
    log_info "Available signing identities:"
    security find-identity -v -p codesigning | grep "Developer ID Application" || true
    echo ""
    read -p "Enter your signing identity (or press Enter to skip signing): " APPLE_SIGNING_IDENTITY
fi

# Navigate to project root
cd "$PROJECT_ROOT"

# Install dependencies
log_info "Installing dependencies..."
pnpm install

# Clean previous builds
log_info "Cleaning previous builds..."
rm -rf src-tauri/target/release/bundle
rm -rf src-tauri/target/universal-apple-darwin

# Build frontend first
log_info "Building frontend..."
pnpm build

# Build for both architectures
log_info "Building for aarch64 (Apple Silicon)..."
cd src-tauri
cargo build --release --target aarch64-apple-darwin

log_info "Building for x86_64 (Intel)..."
cargo build --release --target x86_64-apple-darwin

cd "$PROJECT_ROOT"

# Create universal binary using Tauri
log_info "Creating universal binary..."
if [[ -n "$APPLE_SIGNING_IDENTITY" ]]; then
    export APPLE_SIGNING_IDENTITY="$APPLE_SIGNING_IDENTITY"
    pnpm tauri build --target universal-apple-darwin
else
    log_warn "Skipping code signing (no identity provided)"
    pnpm tauri build --target universal-apple-darwin -- --no-sign
fi

# Find the built app
APP_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/macos -name "*.app" -type d 2>/dev/null | head -1)
DMG_PATH=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" -type f 2>/dev/null | head -1)

if [[ -z "$APP_PATH" ]]; then
    log_error "Could not find built .app bundle"
    exit 1
fi

log_info "Built app: $APP_PATH"

# Verify the universal binary
log_info "Verifying universal binary..."
BINARY_PATH="$APP_PATH/Contents/MacOS/lite-llm-usage"
if [[ -f "$BINARY_PATH" ]]; then
    lipo -info "$BINARY_PATH"
else
    log_warn "Could not find binary to verify"
fi

# Verify code signature
if [[ -n "$APPLE_SIGNING_IDENTITY" ]]; then
    log_info "Verifying code signature..."
    codesign -dv --verbose=4 "$APP_PATH" 2>&1 | head -20

    log_info "Checking signature validity..."
    if codesign --verify --deep --strict "$APP_PATH" 2>&1; then
        log_info "Code signature is valid!"
    else
        log_warn "Code signature verification had issues"
    fi
fi

# Notarization (if requested)
if [[ "$NOTARIZE" == true ]]; then
    if [[ -z "$APPLE_ID" ]] || [[ -z "$APPLE_PASSWORD" ]] || [[ -z "$APPLE_TEAM_ID" ]]; then
        log_error "Notarization requires APPLE_ID, APPLE_PASSWORD, and APPLE_TEAM_ID environment variables"
        exit 1
    fi

    if [[ -n "$DMG_PATH" ]]; then
        log_info "Notarizing DMG: $DMG_PATH"
        xcrun notarytool submit "$DMG_PATH" \
            --apple-id "$APPLE_ID" \
            --password "$APPLE_PASSWORD" \
            --team-id "$APPLE_TEAM_ID" \
            --wait

        log_info "Stapling notarization ticket..."
        xcrun stapler staple "$DMG_PATH"
    else
        log_warn "No DMG found for notarization"
    fi
fi

# Summary
echo ""
log_info "============================================"
log_info "Build completed successfully!"
log_info "============================================"
echo ""
echo "Outputs:"
echo "  App:  $APP_PATH"
[[ -n "$DMG_PATH" ]] && echo "  DMG:  $DMG_PATH"
echo ""

# Verify architectures one more time
if [[ -f "$BINARY_PATH" ]]; then
    echo "Architectures included:"
    lipo -archs "$BINARY_PATH"
fi

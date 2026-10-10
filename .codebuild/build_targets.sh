#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "🔨 BUILD TARGETS"
echo "=========================================="

# Function to sanitize target names
sanitize_target() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | xargs
}

# Function to verify Wine is available for Windows builds
verify_wine() {
  echo ">>> Verifying Wine for Windows build..."
  
  if command -v wine64 &> /dev/null; then
    WINE_CMD="wine64"
  elif command -v wine &> /dev/null; then
    WINE_CMD="wine"
  else
    echo ">>> ERROR: Wine is not installed or not in PATH!"
    echo ">>> Wine is required for building Windows targets on Linux."
    echo ">>> Please ensure Wine is installed in the pre_build phase."
    return 1
  fi
  
  # Set Wine environment variables
  export WINEDLLOVERRIDES="${WINEDLLOVERRIDES:-mscoree,mshtml=}"
  export WINEPREFIX="${WINEPREFIX:-${HOME}/.wine}"
  export DISPLAY="${DISPLAY:-:99}"
  export WINE="${WINE:-$(command -v ${WINE_CMD})}"
  
  echo ">>> Wine configuration:"
  echo "    - Wine executable: ${WINE}"
  echo "    - Wine prefix: ${WINEPREFIX}"
  echo "    - Wine DLL overrides: ${WINEDLLOVERRIDES}"
  
  # Verify Wine can run
  if ${WINE_CMD} --version >/dev/null 2>&1; then
    echo ">>> Wine verification successful: $(${WINE_CMD} --version 2>&1 | head -1)"
    return 0
  else
    echo ">>> ERROR: Wine verification failed!"
    return 1
  fi
}

# Parse build targets
IFS=',' read -ra TARGETS <<< "${NEXTRON_BUILD_TARGETS}"

if [[ "${#TARGETS[@]}" -eq 0 ]]; then
  echo ">>> ERROR: No targets provided in NEXTRON_BUILD_TARGETS"
  exit 1
fi

echo ">>> Build targets: ${NEXTRON_BUILD_TARGETS}"
echo ""

# Build each target
for RAW_TARGET in "${TARGETS[@]}"; do
  TARGET=$(sanitize_target "${RAW_TARGET}")
  
  echo "=========================================="
  echo "Building target: ${TARGET}"
  echo "=========================================="
  
  case "${TARGET}" in
    linux)
      echo ">>> Building for Linux..."
      yarn build:linux
      echo "✅ Linux build completed"
      ;;
      
    win|windows)
      echo ">>> Building for Windows..."
      
      # Verify Wine before building
      if ! verify_wine; then
        echo ">>> ERROR: Wine verification failed. Cannot build Windows targets."
        exit 1
      fi
      
      echo ">>> Starting Windows build with Wine..."
      yarn build:win
      
      echo "✅ Windows build completed"
      ;;
      
    mac|macos|darwin)
      echo ">>> Building for macOS..."
      
      # Check if we're on macOS or need cross-compilation
      if [[ "$(uname)" != "Darwin" ]]; then
        echo ">>> WARNING: Building macOS on non-macOS system"
        echo ">>> This may require additional configuration"
      fi
      
      yarn build:mac
      echo "✅ macOS build completed"
      ;;
      
    all)
      echo ">>> Building all platforms..."
      yarn build
      echo "✅ All platforms build completed"
      ;;
      
    *)
      echo ">>> ERROR: Unsupported NEXTRON_BUILD_TARGETS value: ${TARGET}"
      echo ">>> Supported values: linux, win, windows, mac, macos, darwin, all"
      exit 1
      ;;
  esac
  
  echo ""
done

echo "=========================================="
echo "✅ ALL BUILD TARGETS COMPLETED"
echo "=========================================="
echo ""

# List build artifacts
if [[ -d dist ]]; then
  echo "📦 Build artifacts:"
  find dist -type f \( -name "*.exe" -o -name "*.dmg" -o -name "*.deb" -o -name "*.AppImage" -o -name "*.rpm" \) -exec ls -lh {} \;
  echo ""
else
  echo "⚠️  WARNING: dist/ directory not found"
fi
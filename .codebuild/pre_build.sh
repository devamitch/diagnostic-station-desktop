#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "🔧 PRE-BUILD SETUP"
echo "=========================================="

# Set Python 3 as default
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3 1
python --version

# Get build targets
TARGETS="${NEXTRON_BUILD_TARGETS:-}"
if [[ -z "${TARGETS}" ]]; then
  echo "NEXTRON_BUILD_TARGETS is not set. Defaulting to win."
  TARGETS="win"
  export NEXTRON_BUILD_TARGETS="${TARGETS}"
fi

echo "Build targets: ${TARGETS}"

# Dependencies should already be installed in INSTALL phase
# Only verify installation
echo ""
echo "=========================================="
echo "📦 VERIFYING DEPENDENCIES"
echo "=========================================="
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.yarn-integrity" ]; then
  echo ">>> WARNING: node_modules incomplete or missing, installing dependencies..."
  export NODE_OPTIONS="--max-old-space-size=1024"
  export YARN_ENABLE_IMMUTABLE_INSTALLS=false
  yarn install || {
    echo ">>> Install failed, retrying..."
    sleep 5
    yarn install
  }
else
  echo ">>> Dependencies already installed"
  echo ">>> Verifying critical dependencies..."
  if [ ! -d "node_modules/next" ] || [ ! -d "node_modules/react" ]; then
    echo ">>> Critical dependencies missing, reinstalling..."
    export NODE_OPTIONS="--max-old-space-size=1024"
    export YARN_ENABLE_IMMUTABLE_INSTALLS=false
    yarn install
  fi
fi
echo ""

# Function to install Wine based on available package manager
install_wine() {
  echo ">>> Detecting package manager..."
  
  # Print system information for debugging
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    echo ">>> OS: ${PRETTY_NAME:-${NAME:-Unknown}} (${ID:-unknown})"
  else
    echo ">>> OS: Unknown (no /etc/os-release found)"
  fi
  
  # Try apt-get (Debian/Ubuntu)
  if command -v apt-get &> /dev/null; then
    echo ">>> Using apt-get (Debian/Ubuntu)"
    sudo apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wine64 wine32 || \
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y wine
    return $?
  fi
  
  # Try apt (newer Debian/Ubuntu)
  if command -v apt &> /dev/null; then
    echo ">>> Using apt (Debian/Ubuntu)"
    sudo apt update
    sudo DEBIAN_FRONTEND=noninteractive apt install -y wine64 wine32 || \
    sudo DEBIAN_FRONTEND=noninteractive apt install -y wine
    return $?
  fi
  
  # Try yum (Amazon Linux, CentOS, RHEL)
  if command -v yum &> /dev/null; then
    echo ">>> Using yum (Amazon Linux/CentOS/RHEL)"
    
    if [[ -f /etc/os-release ]]; then
      . /etc/os-release
      if [[ "${ID}" == "amzn" ]]; then
        echo ">>> ERROR: Amazon Linux detected"
        echo "========================================="
        echo "Wine is not available on Amazon Linux 2023"
        echo "========================================="
        echo ""
        echo "SOLUTION: Switch to Ubuntu-based CodeBuild image"
        echo ""
        echo "In AWS CodeBuild Console:"
        echo "1. Go to your CodeBuild project 'olo'"
        echo "2. Click 'Edit' → 'Environment'"
        echo "3. Change Image to: aws/codebuild/standard:7.0 (Ubuntu 22.04)"
        echo "4. Click 'Update environment'"
        echo "5. Retry the build"
        echo ""
        echo "========================================="
        return 1
      fi
    fi
    
    # For other yum-based systems
    sudo yum install -y epel-release 2>/dev/null || true
    sudo yum install -y wine64 wine32 || sudo yum install -y wine
    return $?
  fi
  
  # Try dnf (newer Fedora/RHEL)
  if command -v dnf &> /dev/null; then
    echo ">>> Using dnf (Fedora/RHEL)"
    sudo dnf install -y wine64 wine32 || sudo dnf install -y wine
    return $?
  fi
  
  echo ">>> ERROR: No supported package manager found"
  return 1
}

# Install Wine if building Windows targets
if [[ "${TARGETS}" =~ (win|windows) ]]; then
  echo ""
  echo "=========================================="
  echo "🍷 INSTALLING WINE FOR WINDOWS BUILDS"
  echo "=========================================="
  
  # Check if Wine is already installed
  WINE_CMD=""
  if command -v wine64 &> /dev/null; then
    WINE_CMD="wine64"
    echo ">>> Found wine64"
  elif command -v wine &> /dev/null; then
    WINE_CMD="wine"
    echo ">>> Found wine"
  fi
  
  if [[ -z "${WINE_CMD}" ]]; then
    echo ">>> Installing Wine and required dependencies..."
    if install_wine; then
      echo ">>> Wine installation completed"
      
      # Re-check for Wine after installation
      if command -v wine64 &> /dev/null; then
        WINE_CMD="wine64"
      elif command -v wine &> /dev/null; then
        WINE_CMD="wine"
      fi
    else
      echo ">>> ERROR: Wine installation failed!"
      exit 1
    fi
  fi
  
  # Verify Wine is working
  if [[ -n "${WINE_CMD}" ]]; then
    echo ">>> Verifying Wine installation..."
    if ${WINE_CMD} --version 2>/dev/null; then
      echo ">>> Wine verification successful: $(${WINE_CMD} --version 2>&1 | head -1)"
    else
      echo ">>> WARNING: Wine found but version check failed"
    fi
    
    # Find Wine installation path
    WINE_PATH=$(command -v ${WINE_CMD})
    echo ">>> Wine executable: ${WINE_PATH}"
    export WINE="${WINE_PATH}"
  else
    echo ">>> ERROR: Wine command not found after installation!"
    exit 1
  fi
  
  # Set up Wine environment variables
  export WINEDLLOVERRIDES="mscoree,mshtml="
  export WINEPREFIX="${HOME}/.wine"
  export DISPLAY=:99
  
  # Initialize Wine prefix
  if [[ ! -d "${WINEPREFIX}" ]]; then
    echo ">>> Initializing Wine prefix..."
    mkdir -p "${WINEPREFIX}"
    WINEDLLOVERRIDES="mscoree,mshtml=" WINEPREFIX="${HOME}/.wine" ${WINE_CMD} wineboot --init 2>/dev/null || true
  fi
  
  # Test Wine execution
  echo ">>> Testing Wine execution..."
  if WINEDLLOVERRIDES="mscoree,mshtml=" WINEPREFIX="${WINEPREFIX}" ${WINE_CMD} --version >/dev/null 2>&1; then
    echo ">>> Wine test successful"
  else
    echo ">>> WARNING: Wine test failed, but continuing..."
  fi
  
  echo ">>> Wine environment configured"
  echo ">>> Wine path: ${WINE}"
  echo ">>> Wine prefix: ${WINEPREFIX}"
  echo ""
fi

# Download signing certificate from S3 if configured
if [[ -n "${CERT_S3_BUCKET:-}" && -n "${CERT_S3_KEY:-}" ]]; then
  echo "=========================================="
  echo "🔐 DOWNLOADING SIGNING CERTIFICATE"
  echo "=========================================="
  
  CERT_LOCAL_PATH=${CERT_LOCAL_PATH:-/tmp/oLo_dev.p12}
  echo ">>> Downloading from s3://${CERT_S3_BUCKET}/${CERT_S3_KEY}"
  
  if aws s3 cp "s3://${CERT_S3_BUCKET}/${CERT_S3_KEY}" "${CERT_LOCAL_PATH}"; then
    chmod 600 "${CERT_LOCAL_PATH}"
    export CSC_LINK="file://${CERT_LOCAL_PATH}"
    echo ">>> Certificate downloaded: ${CERT_LOCAL_PATH}"
    echo ">>> CSC_LINK set: ${CSC_LINK}"
  else
    echo ">>> WARNING: Failed to download certificate"
    echo ">>> Building without code signing"
  fi
  echo ""
elif [[ -n "${CSC_LINK:-}" ]]; then
  echo ">>> Using existing CSC_LINK: ${CSC_LINK}"
else
  echo ">>> WARNING: No signing certificate configured"
  echo ">>> Binaries will be unsigned"
fi

echo "=========================================="
echo "✅ PRE-BUILD SETUP COMPLETED"
echo "=========================================="
echo ""
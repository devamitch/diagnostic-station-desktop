#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "📤 POST-BUILD: S3 UPLOAD"
echo "=========================================="

# Get package version from package.json
PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
echo "Package version: ${PACKAGE_VERSION}"

# Get S3 bucket (default to olo-nextron)
RELEASE_BUCKET="${RELEASE_BUCKET:-olo-nextron}"
echo "Release bucket: ${RELEASE_BUCKET}"
echo "Build ID: ${CODEBUILD_BUILD_ID:-local}"
echo ""

# Check if dist directory exists
if [[ ! -d dist ]]; then
  echo "❌ ERROR: dist/ directory not found"
  echo "Build may have failed. Check build logs above."
  exit 1
fi

# Check if there are any build artifacts
ARTIFACT_COUNT=$(find dist -type f \( -name "*.exe" -o -name "*.dmg" -o -name "*.deb" -o -name "*.AppImage" -o -name "*.rpm" -o -name "*.yml" \) | wc -l)

if [[ ${ARTIFACT_COUNT} -eq 0 ]]; then
  echo "⚠️  WARNING: No build artifacts found in dist/"
  echo "Expected files: *.exe, *.dmg, *.deb, *.yml"
  ls -lah dist/ || true
  exit 1
fi

echo "✅ Found ${ARTIFACT_COUNT} build artifacts"
echo ""

# ============================================================
# 1. UPLOAD PUBLIC RELEASES (for end users)
# ============================================================
echo "1️⃣  Uploading public releases to S3..."
echo "   Target: s3://${RELEASE_BUCKET}/releases/${PACKAGE_VERSION}/"
echo ""

aws s3 sync dist/ "s3://${RELEASE_BUCKET}/releases/${PACKAGE_VERSION}/" \
  --acl public-read \
  --cache-control "max-age=31536000" \
  --exclude "*.blockmap" \
  --exclude "builder-*.yml" \
  --metadata "version=${PACKAGE_VERSION},build-id=${CODEBUILD_BUILD_ID:-local},build-time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --content-type "application/octet-stream"

echo "✅ Public releases uploaded"
echo ""

# ============================================================
# 2. UPLOAD AUTO-UPDATE MANIFESTS
# ============================================================
echo "2️⃣  Uploading auto-update manifests..."
echo "   These files tell the app when updates are available"
echo ""

# Upload Windows update manifest
if [[ -f dist/latest.yml ]]; then
  echo "   📄 Uploading latest.yml (Windows)..."
  aws s3 cp dist/latest.yml "s3://${RELEASE_BUCKET}/releases/latest.yml" \
    --acl public-read \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata "version=${PACKAGE_VERSION},platform=windows" \
    --content-type "text/yaml"
  echo "   ✅ Windows manifest uploaded"
fi

# Upload macOS update manifest
if [[ -f dist/latest-mac.yml ]]; then
  echo "   📄 Uploading latest-mac.yml (macOS)..."
  aws s3 cp dist/latest-mac.yml "s3://${RELEASE_BUCKET}/releases/latest-mac.yml" \
    --acl public-read \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata "version=${PACKAGE_VERSION},platform=macos" \
    --content-type "text/yaml"
  echo "   ✅ macOS manifest uploaded"
fi

# Upload Linux update manifest
if [[ -f dist/latest-linux.yml ]]; then
  echo "   📄 Uploading latest-linux.yml (Linux)..."
  aws s3 cp dist/latest-linux.yml "s3://${RELEASE_BUCKET}/releases/latest-linux.yml" \
    --acl public-read \
    --cache-control "no-cache, no-store, must-revalidate" \
    --metadata "version=${PACKAGE_VERSION},platform=linux" \
    --content-type "text/yaml"
  echo "   ✅ Linux manifest uploaded"
fi

echo ""
echo "✅ Update manifests uploaded"
echo ""

# ============================================================
# 3. CREATE VERSION MANIFEST (metadata)
# ============================================================
echo "3️⃣  Creating version manifest..."
echo ""

# Find actual artifact names
WINDOWS_ARTIFACT=$(find dist -type f -name "*.exe" | head -1 | xargs basename 2>/dev/null || echo "")
MAC_ARTIFACT=$(find dist -type f -name "*.dmg" | head -1 | xargs basename 2>/dev/null || echo "")
LINUX_ARTIFACT=$(find dist -type f -name "*.deb" | head -1 | xargs basename 2>/dev/null || echo "")

cat > /tmp/version-manifest.json <<EOF
{
  "version": "${PACKAGE_VERSION}",
  "buildId": "${CODEBUILD_BUILD_ID:-local}",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "branch": "${CODEBUILD_WEBHOOK_HEAD_REF#refs/heads/}",
  "commit": "${CODEBUILD_RESOLVED_SOURCE_VERSION:-unknown}",
  "artifacts": {
    "windows": {
      "filename": "${WINDOWS_ARTIFACT}",
      "url": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${WINDOWS_ARTIFACT}"
    },
    "mac": {
      "filename": "${MAC_ARTIFACT}",
      "url": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${MAC_ARTIFACT}"
    },
    "linux": {
      "filename": "${LINUX_ARTIFACT}",
      "url": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${LINUX_ARTIFACT}"
    }
  },
  "updateManifests": {
    "windows": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest.yml",
    "mac": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest-mac.yml",
    "linux": "https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest-linux.yml"
  }
}
EOF

aws s3 cp /tmp/version-manifest.json "s3://${RELEASE_BUCKET}/releases/${PACKAGE_VERSION}/manifest.json" \
  --acl public-read \
  --content-type "application/json" \
  --cache-control "no-cache"

echo "✅ Version manifest created"
echo ""

# ============================================================
# 4. UPDATE LATEST VERSION POINTER
# ============================================================
echo "4️⃣  Updating latest version pointer..."
echo ""

echo "${PACKAGE_VERSION}" > /tmp/latest-version.txt
aws s3 cp /tmp/latest-version.txt "s3://${RELEASE_BUCKET}/releases/latest-version.txt" \
  --acl public-read \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/plain"

echo "✅ Latest version pointer updated to: ${PACKAGE_VERSION}"
echo ""

# ============================================================
# 5. COPY TO INTERNAL BUILDS FOLDER (private)
# ============================================================
echo "5️⃣  Copying to internal builds folder (private)..."
echo "   Target: s3://${RELEASE_BUCKET}/builds/${CODEBUILD_BUILD_ID:-local}/"
echo ""

aws s3 sync dist/ "s3://${RELEASE_BUCKET}/builds/${CODEBUILD_BUILD_ID:-local}/" \
  --acl private \
  --metadata "version=${PACKAGE_VERSION},build-time=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "✅ Internal artifacts saved"
echo ""

# ============================================================
# 6. GENERATE DOWNLOAD LINKS
# ============================================================
echo "=========================================="
echo "✅ S3 UPLOAD COMPLETED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "📦 PUBLIC DOWNLOAD LINKS:"
echo "----------------------------------------"

if [[ -n "${WINDOWS_ARTIFACT}" ]]; then
  echo "🪟 Windows:"
  echo "   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${WINDOWS_ARTIFACT}"
fi

if [[ -n "${MAC_ARTIFACT}" ]]; then
  echo "🍎 macOS:"
  echo "   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${MAC_ARTIFACT}"
fi

if [[ -n "${LINUX_ARTIFACT}" ]]; then
  echo "🐧 Linux:"
  echo "   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/${LINUX_ARTIFACT}"
fi

echo ""
echo "🔄 AUTO-UPDATE MANIFESTS:"
echo "----------------------------------------"
echo "Windows: https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest.yml"
echo "macOS:   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest-mac.yml"
echo "Linux:   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest-linux.yml"
echo ""
echo "📋 VERSION INFO:"
echo "----------------------------------------"
echo "Manifest: https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/${PACKAGE_VERSION}/manifest.json"
echo "Latest:   https://${RELEASE_BUCKET}.s3.ca-central-1.amazonaws.com/releases/latest-version.txt"
echo ""
echo "🔒 INTERNAL BUILDS (Private):"
echo "----------------------------------------"
echo "s3://${RELEASE_BUCKET}/builds/${CODEBUILD_BUILD_ID:-local}/"
echo ""
echo "=========================================="
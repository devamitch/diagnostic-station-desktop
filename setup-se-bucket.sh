#!/bin/bash
# ============================================================
# S3 BUCKET CONFIGURATION FOR OLO DESKTOP RELEASES
# ============================================================
# This script configures the olo-nextron bucket for:
# - Public releases (downloads & auto-updates)
# - Private builds (internal tracking)
# - CORS for auto-updater
# ============================================================

set -euo pipefail

BUCKET_NAME="olo-nextron"
REGION="ca-central-1"

echo "=========================================="
echo "🪣 CONFIGURING S3 BUCKET: ${BUCKET_NAME}"
echo "=========================================="
echo ""

# Check if bucket exists
if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
  echo "✅ Bucket ${BUCKET_NAME} exists"
else
  echo "❌ ERROR: Bucket ${BUCKET_NAME} does not exist"
  echo "Please create it first in AWS Console or run:"
  echo "  aws s3 mb s3://${BUCKET_NAME} --region ${REGION}"
  exit 1
fi

echo ""
echo "1️⃣  Enabling versioning..."
aws s3api put-bucket-versioning \
  --bucket "${BUCKET_NAME}" \
  --versioning-configuration Status=Enabled

echo "✅ Versioning enabled"
echo ""

# ============================================================
# 2. SET BUCKET POLICY FOR PUBLIC RELEASES
# ============================================================
echo "2️⃣  Setting bucket policy for public releases..."

cat > /tmp/bucket-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadReleases",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::olo-nextron/releases/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy file:///tmp/bucket-policy.json

echo "✅ Bucket policy set (public read for /releases/* only)"
echo ""

# ============================================================
# 3. ENABLE CORS FOR AUTO-UPDATER
# ============================================================
echo "3️⃣  Enabling CORS for auto-updater..."

cat > /tmp/cors.json <<'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket "${BUCKET_NAME}" \
  --cors-configuration file:///tmp/cors.json

echo "✅ CORS enabled"
echo ""

# ============================================================
# 4. CREATE FOLDER STRUCTURE
# ============================================================
echo "4️⃣  Creating folder structure..."

# Create empty objects to represent folders
echo "" | aws s3 cp - "s3://${BUCKET_NAME}/releases/.folder" --acl private
echo "" | aws s3 cp - "s3://${BUCKET_NAME}/builds/.folder" --acl private

echo "✅ Folder structure created:"
echo "   - s3://${BUCKET_NAME}/releases/ (public)"
echo "   - s3://${BUCKET_NAME}/builds/ (private)"
echo ""

# ============================================================
# 5. VERIFY CONFIGURATION
# ============================================================
echo "5️⃣  Verifying configuration..."

echo ""
echo "Checking bucket versioning..."
VERSIONING=$(aws s3api get-bucket-versioning --bucket "${BUCKET_NAME}" --query 'Status' --output text)
echo "  Versioning: ${VERSIONING}"

echo ""
echo "Checking bucket policy..."
if aws s3api get-bucket-policy --bucket "${BUCKET_NAME}" >/dev/null 2>&1; then
  echo "  ✅ Bucket policy is set"
else
  echo "  ⚠️  No bucket policy found"
fi

echo ""
echo "Checking CORS..."
if aws s3api get-bucket-cors --bucket "${BUCKET_NAME}" >/dev/null 2>&1; then
  echo "  ✅ CORS is configured"
else
  echo "  ⚠️  No CORS configuration found"
fi

echo ""
echo "=========================================="
echo "✅ BUCKET CONFIGURATION COMPLETED"
echo "=========================================="
echo ""
echo "📦 Bucket Structure:"
echo "   olo-nextron/"
echo "   ├── certificate/          (existing - private)"
echo "   ├── releases/             (NEW - public)"
echo "   │   ├── latest.yml        (auto-update manifest)"
echo "   │   ├── latest-mac.yml    (auto-update manifest)"
echo "   │   ├── latest-linux.yml  (auto-update manifest)"
echo "   │   ├── latest-version.txt"
echo "   │   └── 1.0.37/           (version folders)"
echo "   ├── builds/               (NEW - private)"
echo "   │   └── <build-id>/       (internal tracking)"
echo "   └── win-unpacked/         (existing)"
echo ""
echo "🌐 Public URLs:"
echo "   https://olo-nextron.s3.ca-central-1.amazonaws.com/releases/"
echo ""
echo "🔄 Auto-Update URLs:"
echo "   Windows: https://olo-nextron.s3.ca-central-1.amazonaws.com/releases/latest.yml"
echo "   macOS:   https://olo-nextron.s3.ca-central-1.amazonaws.com/releases/latest-mac.yml"
echo "   Linux:   https://olo-nextron.s3.ca-central-1.amazonaws.com/releases/latest-linux.yml"
echo ""
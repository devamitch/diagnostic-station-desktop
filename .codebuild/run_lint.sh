#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "🔍 RUNNING LINT CHECKS"
echo "=========================================="

# Check if lint script exists in package.json
if yarn run --json 2>/dev/null | grep -q '"lint"'; then
  echo ">>> Found lint script in package.json"
  echo ">>> Running linter..."
  echo ""
  
  # Run lint and capture exit code
  set +e
  yarn lint
  LINT_EXIT_CODE=$?
  set -e
  
  if [[ ${LINT_EXIT_CODE} -eq 0 ]]; then
    echo ""
    echo "✅ Lint checks passed"
  else
    echo ""
    echo "⚠️  Lint warnings/errors detected (exit code: ${LINT_EXIT_CODE})"
    echo ">>> Continuing build anyway..."
    echo ">>> Fix lint issues for production releases"
  fi
else
  echo ">>> No lint script defined in package.json"
  echo ">>> Skipping lint checks"
fi

echo ""
echo "=========================================="
echo "✅ LINT CHECK PHASE COMPLETED"
echo "=========================================="
echo ""
#!/usr/bin/env bash
# OTA Pre-Publish Validation Script
# Run before any `eas update` to catch issues before they reach devices.
# Usage: ./scripts/ota-validate.sh

set -euo pipefail

PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ $1"; ((PASS++)); }
fail() { echo "  ❌ $1"; ((FAIL++)); }
warn() { echo "  ⚠️  $1"; ((WARN++)); }

echo "🔍 OTA Pre-Publish Validation"
echo "=============================="
echo ""

# 1. Check for require() inside useEffect (anti-pattern that causes crashes)
echo "1. Checking for require() inside useEffect..."
if grep -rn 'useEffect.*{' src/ --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' -l | \
   xargs -I{} grep -l 'require(' {} 2>/dev/null | head -5 | grep -q .; then
  # More precise check: look for require() within useEffect blocks
  REQUIRE_HITS=$(grep -rn 'require(' src/ --include='*.js' --include='*.jsx' -l 2>/dev/null || true)
  if [ -n "$REQUIRE_HITS" ]; then
    warn "Files with require() found (verify none are inside useEffect):"
    echo "$REQUIRE_HITS" | head -5 | sed 's/^/       /'
  fi
else
  pass "No require() inside useEffect detected"
fi

# 2. ESLint check
echo "2. Running ESLint..."
if command -v npx &>/dev/null && [ -f .eslintrc.js ] || [ -f .eslintrc.json ] || [ -f .eslintrc ] || [ -f eslint.config.js ]; then
  if npx eslint src/ --quiet --max-warnings=0 2>/dev/null; then
    pass "ESLint passed (no errors)"
  else
    fail "ESLint found errors"
  fi
else
  warn "ESLint not configured — skipping"
fi

# 3. TypeScript check
echo "3. Checking TypeScript..."
if [ -f tsconfig.json ]; then
  if npx tsc --noEmit 2>/dev/null; then
    pass "TypeScript check passed"
  else
    fail "TypeScript errors found"
  fi
else
  warn "No tsconfig.json — skipping TypeScript check"
fi

# 4. Expo export (bundle validation)
echo "4. Validating bundle (expo export)..."
if npx expo export --dump-sourcemap --output-dir /tmp/ota-validate-export 2>/dev/null; then
  pass "Bundle exported successfully"
  rm -rf /tmp/ota-validate-export
else
  fail "Bundle export failed — this OTA would crash on device"
  rm -rf /tmp/ota-validate-export
fi

# 5. Check for dead state variables (known problem pattern)
echo "5. Scanning for dead modal state..."
DEAD_MODALS=$(python3 -c "
import re, glob
files = glob.glob('src/**/*.js', recursive=True) + glob.glob('src/**/*.jsx', recursive=True)
for f in files:
    content = open(f).read()
    for m in re.finditer(r'const \[(\w+),\s*(set\w+)\]\s*=\s*useState', content):
        var = m.group(1)
        if 'modal' in var.lower() or 'Modal' in var:
            count = len(re.findall(r'\b' + re.escape(var) + r'\b', content))
            if count <= 1:
                print(f'  {f}: {var} (declared but never read)')
" 2>/dev/null || true)

if [ -n "$DEAD_MODALS" ]; then
  warn "Potential dead modal state found:"
  echo "$DEAD_MODALS"
else
  pass "No dead modal state detected"
fi

# Summary
echo ""
echo "=============================="
echo "Results: ✅ $PASS passed | ❌ $FAIL failed | ⚠️  $WARN warnings"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "🚫 VALIDATION FAILED — Do NOT publish this OTA."
  echo "   Fix the issues above before running eas update."
  exit 1
else
  echo "✅ VALIDATION PASSED — Safe to publish OTA."
  exit 0
fi

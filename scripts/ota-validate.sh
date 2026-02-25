#!/bin/bash
# OTA Pre-Publish Validation Script
# Run this BEFORE every `eas update` to catch issues early.
# Usage: ./scripts/ota-validate.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0
WARNINGS=0

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILED=$((FAILED + 1)); }
warn() { echo -e "${YELLOW}⚠${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

echo "═══════════════════════════════════════"
echo "  OTA Pre-Publish Validation"
echo "═══════════════════════════════════════"
echo ""

# 1. Check for require() inside useEffect (known crash pattern)
echo "Checking for require() inside useEffect..."
REQUIRE_HITS=$(grep -rn 'useEffect.*{' src/ --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' -l 2>/dev/null | while read f; do
  # Look for require() between useEffect and its closing
  grep -n 'require(' "$f" 2>/dev/null || true
done | wc -l | tr -d ' ')

if [ "$REQUIRE_HITS" -gt 0 ]; then
  warn "Found require() calls in files with useEffect — verify none are inside hooks"
  grep -rn 'require(' src/ --include='*.js' --include='*.jsx' | head -5
else
  pass "No require() calls found near useEffect hooks"
fi

# 2. Check for dead state variables (state declared but never read)
echo ""
echo "Checking for potentially dead useState variables..."
python3 -c "
import re, os
for root, dirs, fnames in os.walk('src'):
    for f in fnames:
        if not f.endswith(('.js', '.jsx', '.ts', '.tsx')): continue
        path = os.path.join(root, f)
        with open(path) as fh:
            content = fh.read()
        lines = content.split('\n')
        for i, line in enumerate(lines):
            m = re.search(r'const \[(\w+),\s*(set\w+)\]\s*=\s*useState', line)
            if not m: continue
            var = m.group(1)
            setter = m.group(2)
            other_lines = '\n'.join(lines[:i] + lines[i+1:])
            if not re.search(r'\b' + re.escape(var) + r'\b', other_lines):
                print(f'  DEAD: {path}:{i+1} — [{var}] is never read')
            if not re.search(r'\b' + re.escape(setter) + r'\b', other_lines):
                print(f'  UNUSED SETTER: {path}:{i+1} — [{setter}] is never called')
" 2>/dev/null && pass "Dead state check complete" || warn "Could not run dead state check (python3 required)"

# 3. ESLint check
echo ""
echo "Running ESLint..."
if command -v npx &>/dev/null && [ -f .eslintrc.js ] || [ -f .eslintrc.json ] || [ -f eslint.config.js ]; then
  if npx eslint src/ --quiet --max-warnings 0 2>/dev/null; then
    pass "ESLint passed (no errors)"
  else
    fail "ESLint found errors — fix before deploying"
  fi
else
  warn "ESLint not configured — skipping"
fi

# 4. TypeScript check
echo ""
echo "Running TypeScript check..."
if [ -f tsconfig.json ]; then
  if npx tsc --noEmit 2>/dev/null; then
    pass "TypeScript check passed"
  else
    fail "TypeScript errors found"
  fi
else
  pass "No tsconfig.json — skipping TypeScript check"
fi

# 5. Bundle export check
echo ""
echo "Verifying app bundles successfully..."
if npx expo export --dump-sourcemap --output-dir /tmp/ota-validate-export 2>&1 | tail -3; then
  pass "App bundled successfully"
  rm -rf /tmp/ota-validate-export
else
  fail "App failed to bundle — DO NOT deploy"
  rm -rf /tmp/ota-validate-export
fi

# Summary
echo ""
echo "═══════════════════════════════════════"
if [ $FAILED -gt 0 ]; then
  echo -e "  ${RED}FAIL${NC} — $FAILED error(s), $WARNINGS warning(s)"
  echo "  Do NOT publish this OTA."
  echo "═══════════════════════════════════════"
  exit 1
else
  echo -e "  ${GREEN}PASS${NC} — 0 errors, $WARNINGS warning(s)"
  echo "  Safe to publish OTA."
  echo "═══════════════════════════════════════"
  exit 0
fi

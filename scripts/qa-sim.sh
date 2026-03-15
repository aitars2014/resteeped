#!/bin/bash
# qa-sim.sh — QA automation for Resteeped iOS simulator
# Usage: ./scripts/qa-sim.sh [options]
#   --device <name>       Simulator device name (default: "iPhone 17 Pro")
#   --date <ISO-string>   Override status bar date (e.g., "2026-03-16T08:00:00")
#   --screenshot-dir <dir> Output directory for screenshots (default: /tmp/resteeped-qa)
#   --build               Build and install fresh (default: use existing install)
#   --no-launch           Don't launch the app (just boot + screenshot)
#   --wait <seconds>      Wait N seconds after launch before screenshot (default: 8)
#   --help                Show this help

set -euo pipefail

DEVICE_NAME="iPhone 17 Pro"
DATE_OVERRIDE=""
SCREENSHOT_DIR="/tmp/resteeped-qa"
DO_BUILD=false
DO_LAUNCH=true
WAIT_SECONDS=8
BUNDLE_ID="com.resteeped.app"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  head -10 "$0" | grep '^#' | sed 's/^# *//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --device)     DEVICE_NAME="$2"; shift 2 ;;
    --date)       DATE_OVERRIDE="$2"; shift 2 ;;
    --screenshot-dir) SCREENSHOT_DIR="$2"; shift 2 ;;
    --build)      DO_BUILD=true; shift ;;
    --no-launch)  DO_LAUNCH=false; shift ;;
    --wait)       WAIT_SECONDS="$2"; shift 2 ;;
    --help|-h)    usage ;;
    *)            echo "Unknown option: $1"; usage ;;
  esac
done

# Find device UDID
UDID=$(xcrun simctl list devices available -j | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    for d in devices:
        if d['name'] == '$DEVICE_NAME' and d['isAvailable']:
            print(d['udid'])
            sys.exit(0)
sys.exit(1)
") || { echo "❌ Device '$DEVICE_NAME' not found"; exit 1; }

echo "📱 Device: $DEVICE_NAME ($UDID)"

# Boot simulator if not already booted
STATE=$(xcrun simctl list devices -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    for d in devices:
        if d['udid'] == '$UDID':
            print(d['state'])
            sys.exit(0)
")

if [ "$STATE" != "Booted" ]; then
  echo "⏳ Booting simulator..."
  xcrun simctl boot "$UDID"
  sleep 3
  echo "✅ Booted"
else
  echo "✅ Already booted"
fi

# Build and install if requested
if [ "$DO_BUILD" = true ]; then
  echo "🔨 Building Resteeped for simulator..."
  cd "$PROJECT_DIR"

  # Build the app for simulator
  npx expo run:ios --device "$UDID" --no-install 2>&1 | tail -5
  echo "✅ Build complete"
fi

# Set date override if specified
if [ -n "$DATE_OVERRIDE" ]; then
  echo "📅 Setting status bar date to: $DATE_OVERRIDE"
  xcrun simctl status_bar "$UDID" override --time "$DATE_OVERRIDE"
fi

# Launch app
if [ "$DO_LAUNCH" = true ]; then
  echo "🚀 Launching $BUNDLE_ID..."
  # Terminate if already running
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
  sleep 1
  xcrun simctl launch "$UDID" "$BUNDLE_ID"
  echo "⏳ Waiting ${WAIT_SECONDS}s for app to settle..."
  sleep "$WAIT_SECONDS"
fi

# Take screenshot
mkdir -p "$SCREENSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCREENSHOT_PATH="$SCREENSHOT_DIR/qa_${TIMESTAMP}.png"
xcrun simctl io "$UDID" screenshot "$SCREENSHOT_PATH"
echo "📸 Screenshot saved: $SCREENSHOT_PATH"

# Also grab a few more screens if app is running (navigate via deep links if available)
echo ""
echo "=== QA Summary ==="
echo "Device:     $DEVICE_NAME"
echo "Date:       ${DATE_OVERRIDE:-system}"
echo "Screenshot: $SCREENSHOT_PATH"
echo "Bundle:     $BUNDLE_ID"
echo ""
echo "Done. Screenshot ready for analysis."

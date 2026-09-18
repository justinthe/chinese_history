#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

URL="http://localhost:5173/chinese_history/"

cleanup() {
  if [ -n "${DEV_PID:-}" ]; then
    kill "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "Validating content/*.json..."
node scripts/validate.mjs

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Starting container via docker compose..."
  export UID GID="$(id -g)"
  docker compose up -d --wait
else
  echo "Docker not available, falling back to npm run dev -- --host"
  npm ci
  npm run dev -- --host &
  DEV_PID=$!
fi

echo "Waiting for $URL to respond..."
for i in $(seq 1 30); do
  if curl -sf -o /dev/null "$URL"; then
    echo "Server is up."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: server did not come up within 60s" >&2
    exit 1
  fi
  sleep 2
done

echo ""
echo "Open this URL in a browser:"
echo "  $URL"
echo ""

cat <<'EOF'
Manual Checklist — Phase 07 Search, category filter, Meanwhile strip
[ ] Type 'paper' → Cai Lun row; Enter opens detail at 105 CE
[ ] Type 'Qin Shihuang' (no tone marks) → finds 秦始皇 event
[ ] Type '1368' → 'Jump to 1368 CE (Ming)'; select → playhead moves, no panel
[ ] Type 'zzz' → 'No match'
[ ] Down/Up/Enter navigate results; Esc clears
[ ] Turn off chips until one remains → next click toasts and stays on
[ ] Chips survive reload and are in the URL
[ ] Meanwhile strip text changes when crossing an era boundary
EOF

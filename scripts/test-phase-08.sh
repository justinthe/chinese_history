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
Manual Checklist — Phase 08 Grand Tour
[ ] Grand Tour → panel docks right, map fully visible (screen-05)
[ ] Next → year badge, map shape, timeline position all change; the stop's card glows
[ ] Read more → detail opens; close → tour panel still there at same stop
[ ] Reload mid-tour → Grand Tour button resumes at that stop
[ ] Finish → toast, panel closes, free explore at last stop's year
[ ] At 390px → bottom sheet, map still visible
[ ] Left/Right arrow keys step the tour while the panel has focus; Esc exits
[ ] Exit tour → next Grand Tour starts fresh at Stop 1
EOF

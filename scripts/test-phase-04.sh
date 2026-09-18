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
  # export so docker-compose.yml's ${UID}/${GID} pick up the host user -
  # bash's UID/GID are shell params, not env vars, unless exported
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
Manual Checklist — Phase 04 Timeline
[ ] Mouse wheel over timeline scrolls it sideways, page does not scroll
[ ] Drag timeline pans; a short click still sets the year
[ ] ◀ ▶ move ~60% of a screen; + − zoom; − at minimum shows all 4,000 years
[ ] At default zoom no two cards fully overlap; crowded Qin shows a '+N' card that opens a list
[ ] Left/Right arrow keys move the playhead 25 years; Tab reaches cards, Enter opens
[ ] Era band under the playhead is outlined
[ ] Scrolling 150 fixture events stays smooth (no visible jank)
[ ] Firefox: wheel over the timeline scrolls a full notch, not a few pixels
[ ] Focus the playhead with Tab -> screen reader announces the year (aria-valuetext)
EOF

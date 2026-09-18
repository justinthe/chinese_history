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
Manual Checklist — Phase 02 UI shell with mocks
[ ] Landing matches screen-01: hero, two buttons, four teasers, how-to strip, footer links
[ ] Explore freely → Explore screen at 221 BCE Qin, matches screen-02
[ ] Click event card → detail panel slides in, matches screen-04; Esc closes
[ ] Grand Tour → panel docks right of map, map not covered, matches screen-05; Next/Back/Exit work
[ ] Type 'paper' → dropdown matches screen-06; type 'zzz' → 'No match' row
[ ] Toggle chips → cards/pins filter; last chip cannot be turned off (toast)
[ ] Turn off all but Nature at Qin → map shows the empty-state message
[ ] About page matches screen-03, Back returns to landing
[ ] Resize to 390px → chips wrap, map above timeline, Grand Tour opens as bottom sheet, map still ≥ 200px tall
[ ] No console errors on any screen
EOF

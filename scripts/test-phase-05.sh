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
Manual Checklist — Phase 05 Map
[ ] Scrub timeline from Qin to Han → territory smoothly grows west over ~0.6 s
[ ] With OS reduced-motion on (or DevTools emulation) → shape swaps instantly
[ ] Pins show only current era events of selected categories; click a pin → detail opens
[ ] Filter to Nature at Qin → empty-state sentence on map
[ ] Tab reaches pins, Enter opens
[ ] Map +/− zooms around the territory
[ ] Era card shows ✨ Legendary for Xia
[ ] Crowded era (e.g. Han/Tang) → pins never sit fully on top of each other
[ ] Zoom + stops at 2×, zoom − stops back at 1× (full map), no further drift
EOF

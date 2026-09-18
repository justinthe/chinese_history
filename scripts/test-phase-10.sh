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

echo "Validating content/*.json (includes coverage summary)..."
node scripts/validate.mjs

echo ""
echo "Coverage report..."
node scripts/coverage.mjs

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo ""
  echo "Starting container via docker compose..."
  export UID GID="$(id -g)"
  docker compose up -d --wait
else
  echo ""
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
Manual Checklist — Phase 10 Content fill to v1 scope
[ ] Coverage report: >= 150 events, every era >= 5, every category >= 15, images >= 90%
[ ] Scrub every era: each has cards and pins; nothing outside its era band
[ ] Ten random detail panels: text reads plainly, has why-it-matters, credit line present
[ ] Modern era events (1959, 1966, 1989) read neutral and give sourced ranges
[ ] Grand Tour has 20 stops and completes
[ ] No validate warnings about dangling related ids
EOF

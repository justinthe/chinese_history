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
Manual Checklist — Phase 01 Container init
[ ] http://localhost:5173/chinese_history/ loads with no console errors
    (bare http://localhost:5173/ also works - Vite redirects to the base path)
[ ] Page title 'Middle Kingdom Explorer' rendered in Fredoka (check Network tab: font loaded from /chinese_history/fonts/, no requests to googleapis/gstatic)
[ ] Background is paper #fff7e8
[ ] `npm test` and `npm run e2e` both pass
[ ] CI workflow file lints (act or GitHub 'Actions' tab shows a run on push)
EOF

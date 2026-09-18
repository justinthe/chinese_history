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

echo ""
echo "Dry-running the image fetch pipeline (no network writes)..."
FETCH_USER_AGENT="${FETCH_USER_AGENT:-MiddleKingdomExplorer/0.1 (test-phase-09.sh)}" \
  node scripts/fetch-images.mjs --dry-run --allow-missing

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
Manual Checklist — Phase 09 Build-time image pipeline
[ ] `node scripts/fetch-images.mjs --only terracotta` downloads, writes two webp files under the size budgets, manifest entry has credit + license + sourceUrl
[ ] Re-run → 'skipped (unchanged)'; `--force` → refetches
[ ] Seed event with CC BY-NC source → rejected, exit 1, listed in images.report.json
[ ] Event detail for terracotta shows the real image with its credit line
[ ] About page lists every manifest image with credit and license
[ ] Network tab in the browser shows zero third-party requests at runtime
EOF

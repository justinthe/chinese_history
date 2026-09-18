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

echo "Building..."
npm run build

echo ""
echo "Gzipped bundle sizes (PRD §8: JS <= 150 KB gzipped):"
for f in dist/assets/*.js; do
  size=$(gzip -c "$f" | wc -c)
  echo "  $(basename "$f"): $size bytes gzipped"
  if [ "$size" -gt 153600 ]; then
    echo "ERROR: $f exceeds the 150 KB gzipped budget" >&2
    exit 1
  fi
done
for f in dist/assets/*.css; do
  echo "  $(basename "$f"): $(gzip -c "$f" | wc -c) bytes gzipped"
done

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
echo "For a real Lighthouse run: npm run lighthouse (starts its own preview server on 4173)"
echo "For axe/keyboard e2e proof: npm run e2e (runs e2e/a11y.spec.js and e2e/keyboard.spec.js)"
echo ""

cat <<'EOF'
Manual Checklist — Phase 11 Responsive, accessibility, performance pass
[ ] 360px: every screen usable; detail and tour are bottom sheets; map ≥ 200px tall
[ ] Keyboard only: land → explore → open event → related → close → Grand Tour → finish
[ ] Screen reader announces year changes and toasts (VoiceOver/NVDA quick pass)
[ ] axe e2e: 0 violations
[ ] Lighthouse (DevTools, mobile): perf ≥ 90, a11y ≥ 95
[ ] Bundle: JS ≤ 150 KB gzipped
[ ] Reduced motion: no morph, no slide animations
EOF

#!/usr/bin/env bash
set -euo pipefail

echo "[media-test] Starting media testing automation"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[env] Missing required command: $1" >&2
    exit 1
  fi
}

# 1) Environment Validation
echo "[env] Validating environment..."
check_cmd node
check_cmd npm
echo "[env] Node: $(node -v)"
echo "[env] NPM:  $(npm -v)"

if command -v lighthouse >/dev/null 2>&1; then
  echo "[env] Lighthouse: $(lighthouse --version)"
else
  echo "[env] Lighthouse not found (optional)"
fi

# 2) Build
echo "[build] Cleaning previous artifacts"
rm -rf .next || true
echo "[build] Running npm run build"
npm run build

# 3) Start server
echo "[server] Starting production server"
npm run start &
SERVER_PID=$!
trap 'echo "[cleanup] Stopping server"; kill $SERVER_PID 2>/dev/null || true' EXIT

echo "[server] Waiting for http://localhost:3000"
if command -v npx >/dev/null 2>&1; then
  if [ -n "${CI:-}" ]; then
    # Enforce readiness in CI
    npx wait-on http://localhost:3000
  else
    # Local runs can be lenient
    npx wait-on http://localhost:3000 >/dev/null 2>&1 || true
  fi
else
  # Fallback: poll with curl until 200 OK (strict in CI)
  echo "[server] wait-on not available; polling with curl"
  START_TS=$(date +%s)
  TIMEOUT=60
  until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q '^200$'; do
    NOW=$(date +%s)
    ELAPSED=$((NOW-START_TS))
    if [ -n "${CI:-}" ] && [ "$ELAPSED" -ge "$TIMEOUT" ]; then
      echo "[server] Timeout waiting for server" >&2
      exit 1
    fi
    sleep 1
  done
fi

# 4) Media Test Execution
RUN_SUITE_ONLY=${RUN_SUITE_ONLY:-true}
if [ "$RUN_SUITE_ONLY" = "true" ]; then
  echo "[tests] Integration orchestrator (suite only)"
  # Avoid double starting server from the suite
  SKIP_SERVER_START=1 node tests/media-integration-test-suite.js
else
  echo "[tests] Running individual tests"
  node tests/media-hls-playback-test.js
  node tests/media-image-caching-validation.js
  node tests/media-controls-functionality-test.js
  node tests/responsive-design-mobile-compatibility.js
  node tests/media-autoplay-behavior-test.js
  node tests/media-performance-monitoring.js || true
  node tests/media-accessibility-testing.js
fi

echo "[media-test] Completed. Reports (if any) under tests/reports"

#!/usr/bin/env bash
set -euo pipefail

echo "[resilience] Starting error resilience testing automation"

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

if command -v docker-compose >/dev/null 2>&1; then
  echo "[env] docker-compose: $(docker-compose version --short || echo available)"
else
  echo "[env] docker-compose not found (DB tests may be limited)"
fi

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

# 3) Start DB
if command -v docker-compose >/dev/null 2>&1; then
  echo "[db] Starting database"
  docker-compose up -d db || true
else
  echo "[db] docker-compose unavailable; ensure database is running if required"
fi

# 4) Start server
echo "[server] Starting production server"
npm run start &
SERVER_PID=$!
trap 'echo "[cleanup] Stopping server"; kill $SERVER_PID 2>/dev/null || true' EXIT

echo "[server] Waiting for http://localhost:3000"
if command -v npx >/dev/null 2>&1; then
  npx wait-on http://localhost:3000 --timeout 60000 >/dev/null 2>&1
else
  # Fallback: poll with curl until 200 OK (lenient)
  echo "[server] wait-on not available; polling with curl"
  START_TS=$(date +%s)
  TIMEOUT=60
  until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q '^200$'; do
    NOW=$(date +%s)
    ELAPSED=$((NOW-START_TS))
    if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
      echo "[server] Timeout waiting for server" >&2
      exit 1
    fi
    sleep 1
  done
fi

# 5) Execute Integration Suite
echo "[tests] Running Error Resilience Integration Suite"
node tests/error-resilience-integration-test.js

echo "[resilience] Completed. Review logs above and reports (if any) under tests/"

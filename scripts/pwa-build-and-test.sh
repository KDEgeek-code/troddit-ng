#!/usr/bin/env bash
set -euo pipefail

echo "[pwa-build-and-test] Starting PWA build + test pipeline"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

function check_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[env] Missing required command: $1" >&2
    exit 1
  fi
}

# 1) Environment Validation
echo "[env] Validating environment..."
check_cmd node
check_cmd npm
check_cmd docker
check_cmd docker-compose

echo "[env] Node: $(node -v)"
echo "[env] NPM:  $(npm -v)"
echo "[env] Docker: $(docker --version | head -n1)"
echo "[env] Docker Compose: $(docker-compose --version | head -n1)"

# 2) Database Setup
echo "[db] Starting PostgreSQL (docker-compose up -d db)"
docker-compose up -d db
echo "[db] Waiting for DB readiness (simple delay 5s)"
sleep 5

# 3) Production Build
echo "[build] Cleaning previous artifacts"
rm -rf .next || true
echo "[build] Running npm run build"
npm run build

# 4) Production Server Management
echo "[server] Starting production server"
npm run start &
SERVER_PID=$!
trap 'echo "[cleanup] Stopping server"; kill $SERVER_PID 2>/dev/null || true' EXIT

echo "[server] Waiting for http://localhost:3000"
if command -v npx >/dev/null 2>&1; then
  npx wait-on http://localhost:3000 >/dev/null 2>&1 || true
else
  echo "[server] wait-on not available; sleeping 5s"
  sleep 5
fi

# 5) PWA Testing Execution
echo "[tests] Production build validation"
SKIP_BUILD=1 SKIP_SERVER=1 node tests/production-build-validation.js

echo "[tests] Service worker caching validation"
node tests/service-worker-caching-validation.js

echo "[tests] PWA installation testing"
if [ "${CI:-}" = "true" ]; then
  node tests/pwa-installation-testing.js
else
  node tests/pwa-installation-testing.js || true
fi

echo "[tests] Offline functionality testing"
if [ "${CI:-}" = "true" ]; then
  node tests/offline-functionality-testing.js
else
  node tests/offline-functionality-testing.js || true
fi

echo "[tests] Lighthouse PWA audit"
if [ "${CI:-}" = "true" ]; then
  node tests/lighthouse-pwa-audit-runner.js
else
  node tests/lighthouse-pwa-audit-runner.js || true
fi

echo "[tests] Performance monitoring"
# Performance monitoring is optional; always mask failures
node tests/pwa-performance-monitoring.js || true

# 6) Integration suite (aggregated)
echo "[tests] Integration test suite"
if [ "${CI:-}" = "true" ]; then
  node tests/pwa-integration-test-suite.js
else
  node tests/pwa-integration-test-suite.js || true
fi

echo "[pwa-build-and-test] Completed. Reports (if any) under tests/reports"

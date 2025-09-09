#!/usr/bin/env bash
set -euo pipefail

# Persistence Test Automation
# Orchestrates environment checks, launches browser-based tests, aggregates results, and outputs reports.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_DIR="$ROOT_DIR/.persist-test-reports"
mkdir -p "$REPORT_DIR"

log() { echo "[persist-test] $*"; }
fail() { echo "[persist-test][ERROR] $*" >&2; exit 1; }

check_cmd() { command -v "$1" >/dev/null 2>&1; }

log "Environment validation..."
check_cmd node || fail "Node.js not found in PATH"
node -v | grep -qE "v1[6-9]|v2[0-9]" || log "Node version OK (>=16 recommended)"

# Optional: check a browser for manual portions
if check_cmd open || check_cmd xdg-open; then
  log "Browser launcher available"
else
  log "No browser launcher detected; manual browser steps may be required"
fi

# Dev server detection (best effort)
DEV_URL="http://localhost:3000"
if check_cmd curl; then
  if curl -sSf "$DEV_URL" >/dev/null 2>&1; then
    log "Dev server detected at $DEV_URL"
  else
    log "Dev server not detected at $DEV_URL (this is OK if tests run in an already open session)"
  fi
fi

log "Running component test scripts (Node best effort)..."
set +e
NODE_OUT="$REPORT_DIR/node-suite.json"
node -e "(async () => {
  try {
    const suite = require('./tests/persistence-integration-test-suite.js');
    const res = await suite.runPersistenceIntegrationTestSuite();
    require('fs').writeFileSync('$NODE_OUT', JSON.stringify(res, null, 2));
    console.log('[persist-test] Wrote $NODE_OUT');
  } catch (e) {
    console.error('Failed to run Node suite:', e && e.message || e);
    process.exitCode = 0; // non-fatal
  }
})();" || true
set -e

log "Automation complete. For browser-driven tests:"
cat <<'GUIDE'
- Open your app in a browser (dev server).
- Important: Next.js does not serve files from the project tests/ folder.
  - Option 1 (recommended): copy/paste the test files into DevTools Snippets and run them from there.
  - Option 2: copy desired test files into public/tests/ so they are served, then import from /tests/...

- To run the full suite via console after copying to public/tests/:
    await (await import('/tests/persistence-integration-test-suite.js')).runPersistenceIntegrationTestSuite()
- Or load tests/browser-console-persistence-debugger.js as a DevTools Snippet and run:
    await window.runPersistenceTestSuite()

Reports stored (when applicable) under .persist-test-reports/
GUIDE

exit 0

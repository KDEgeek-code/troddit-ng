/*
 Browser Console Error & Resilience Debugger
 Paste this into DevTools Console on the running app to expose helpers under window.*

 Provides:
 - Rate limiting debug tools
 - Error boundary testing helpers
 - Offline behavior validation
 - Database connection resilience probes (best-effort via API)
 - Security headers/CSP checks on the current page
 - React Query error state inspection
 - Context/state inspection and reset helpers
 - Performance and memory probes (lightweight)
*/

;(function attach(global) {
  const w = global;
  const BASE = w.location ? `${w.location.origin}` : 'http://localhost:3000';

  function log(name, data) { console.log(`[debug:${name}]`, data ?? ''); }
  async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Rate Limiting Debug Tools
  w.testRateLimiting = async function testRateLimiting(endpoint = '/api/user/prefs', requests = 12) {
    const target = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
    const results = [];
    for (let i = 0; i < requests; i++) {
      try {
        const res = await fetch(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ __i: i, __ts: Date.now() }) });
        results.push({ i, status: res.status, retryAfter: res.headers.get('retry-after') });
      } catch (e) {
        results.push({ i, error: e.message });
      }
    }
    log('rate-limit', results);
    return results;
  };

  w.simulateRateLimit = function simulateRateLimit(timeoutSec = 60) {
    try {
      // Try interacting with MainContext via heuristics if exposed
      const reactGlobal = w.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactGlobal && w.__APP_MAIN_CONTEXT__) {
        w.__APP_MAIN_CONTEXT__.setRateLimitModal({ show: true, timeout: timeoutSec, start: new Date() });
        return true;
      }
    } catch {}
    console.warn('Could not access MainContext; ensure dev build exposes context for debugging.');
    return false;
  };

  w.inspectRateLimitState = function inspectRateLimitState() {
    const state = w.__APP_MAIN_CONTEXT__ ? w.__APP_MAIN_CONTEXT__.rateLimitModal : null;
    log('rate-limit-state', state);
    return state;
  };

  w.clearRateLimitStore = function clearRateLimitStore() {
    if (typeof globalThis !== 'undefined' && globalThis.rateLimitStore) {
      try { globalThis.rateLimitStore.clear(); log('rate-limit-store', 'cleared'); return true; } catch {}
    }
    console.warn('No in-memory rateLimitStore accessible in this context.');
    return false;
  };

  w.monitorRateLimitHeaders = function monitorRateLimitHeaders() {
    console.warn('Use Network panel filter: headers containing x-ratelimit-* or retry-after');
  };

  // Error Boundary Testing Tools
  w.triggerComponentError = function triggerComponentError(component = 'Feed') {
    console.warn(`Trigger a manual throw inside component ${component} via UI action or dev helper if exposed.`);
  };
  w.testErrorBoundaries = async function testErrorBoundaries() {
    console.log('Validate: fallback UIs render and reset works for Feed/PostBody/ParseBodyHTML/Settings.');
  };
  w.simulateAsyncError = async function simulateAsyncError() {
    return Promise.reject(new Error('Simulated async error')).catch(e => console.log('Caught async error (expected):', e.message));
  };
  w.inspectErrorBoundaryState = function inspectErrorBoundaryState() { console.log('Inspect component states via React DevTools.'); };
  w.resetAllErrorBoundaries = function resetAllErrorBoundaries() { w.location.reload(); };

  // Offline Behavior Debug Tools
  w.simulateOfflineMode = function simulateOfflineMode() {
    try {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      console.log('Simulated navigator.onLine=false');
    } catch (e) {
      console.warn('navigator.onLine is not configurable in this browser. Use Network panel to go offline.');
    }
  };
  w.simulateOnlineMode = function simulateOnlineMode() {
    try {
      Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
      console.log('Simulated navigator.onLine=true');
    } catch (e) {
      console.warn('navigator.onLine is not configurable in this browser. Disable offline in Network panel.');
    }
  };
  w.testOfflineFallbacks = async function testOfflineFallbacks() { console.log('Navigate to an uncached route while offline to verify fallback.html'); };
  w.inspectServiceWorkerCache = async function inspectServiceWorkerCache() {
    if (!('caches' in w)) return console.warn('Cache API not available');
    const keys = await caches.keys();
    const report = {};
    for (const k of keys) {
      const cache = await caches.open(k);
      const reqs = await cache.keys();
      report[k] = reqs.map(r => r.url);
    }
    log('sw-caches', report);
    return report;
  };
  w.validateOfflineBehavior = async function validateOfflineBehavior() { console.log('Validate serving from cache and auto-revalidate on reconnect.'); };

  // Database Connection Testing (via API only)
  w.testDatabaseConnection = async function testDatabaseConnection() {
    try { const r = await fetch(`${BASE}/api/user/prefs`); return { status: r.status }; } catch (e) { return { error: e.message }; }
  };
  w.simulateDatabaseFailure = function simulateDatabaseFailure() { console.warn('Use docker-compose to stop db and observe API 5xx/503 responses.'); };
  w.testDatabaseRecovery = function testDatabaseRecovery() { console.log('Restart db, reload page, and ensure app recovers gracefully.'); };
  w.inspectDatabaseState = function inspectDatabaseState() { console.log('Server-side pool state not directly observable in browser.'); };
  w.monitorDatabaseErrors = function monitorDatabaseErrors() { console.warn('Watch Network and Console for 5xx and error logs.'); };

  // Security Headers Validation
  w.validateSecurityHeaders = function validateSecurityHeaders() { console.log('Check response headers in Network panel for CSP, HSTS, X-Frame-Options, etc.'); };
  w.testCSPCompliance = function testCSPCompliance() { console.warn('Attempt to inject disallowed scripts/styles and verify CSP blocks them.'); };
  w.simulateCSPViolation = function simulateCSPViolation() { try { const s = document.createElement('script'); s.src = 'https://example.com/not-allowed.js'; document.body.appendChild(s); } catch (e) { console.log('Violation attempt error:', e.message); } };
  w.inspectSecurityConfig = function inspectSecurityConfig() { console.log('See next.config.js headers() configuration.'); };
  w.testCORSHeaders = function testCORSHeaders() { console.log('Use fetch from different origin in a separate tab or Origin header override.'); };

  // Network Error Simulation
  w.simulateNetworkErrors = function simulateNetworkErrors() { console.warn('Use DevTools > Network to simulate offline/slow/latency.'); };
  w.testErrorPropagation = function testErrorPropagation() { console.log('Observe UI error surfaces and boundary fallbacks during network failures.'); };
  w.simulateSlowNetwork = function simulateSlowNetwork() { console.warn('Use DevTools throttling presets.'); };
  w.testTimeoutHandling = function testTimeoutHandling() { console.log('Trigger internal API calls with slow responses and observe timeouts.'); };
  w.monitorNetworkErrors = function monitorNetworkErrors() { console.warn('Use Network filters for status >= 400 and Console for fetch errors.'); };

  // React Query Error Testing
  w.inspectReactQueryErrors = function inspectReactQueryErrors() { console.log('Open React Query Devtools, inspect error states.'); };
  w.testQueryErrorHandling = function testQueryErrorHandling() { console.log('Force API failures and watch query error handling and retries.'); };
  w.simulateQueryFailures = function simulateQueryFailures() { console.warn('Manually break API endpoint or go offline for specific requests.'); };
  w.testRetryMechanisms = function testRetryMechanisms() { console.log('Observe retry/backoff in React Query Devtools.'); };
  w.validateOfflineFirstBehavior = function validateOfflineFirstBehavior() { console.log('With offlineFirst, verify cache serve when offline and revalidate when online.'); };

  // Context and State Debugging
  w.inspectMainContext = function inspectMainContext() { if (w.__APP_MAIN_CONTEXT__) { console.log('__APP_MAIN_CONTEXT__', w.__APP_MAIN_CONTEXT__); } else { console.warn('MainContext not exposed; dev build may expose it'); } };
  w.inspectErrorStates = function inspectErrorStates() { console.log('Use DevTools and component props/state inspectors.'); };
  w.testContextErrorHandling = function testContextErrorHandling() { console.log('Trigger errors in context-consuming components and observe behavior.'); };
  w.validateStateRecovery = function validateStateRecovery() { console.log('Resolve the error condition and validate state recovers without reload.'); };
  w.resetApplicationState = function resetApplicationState() { localStorage.clear(); indexedDB && indexedDB.databases && indexedDB.databases().then(() => console.log('Cleared storage (manual)')); w.location.reload(); };

  // Performance and Memory Testing
  w.monitorErrorHandlingPerformance = function monitorErrorHandlingPerformance() { console.log('Use Performance panel; measure error->recovery timelines.'); };
  w.testMemoryLeaksInErrors = function testMemoryLeaksInErrors() { console.log('Record heap snapshots before/after errors.'); };
  w.measureErrorRecoveryTime = async function measureErrorRecoveryTime(action = async () => {}, label = 'recovery') { const t0 = performance.now(); await action(); const dt = performance.now() - t0; console.log(`[perf] ${label}: ${dt.toFixed(1)}ms`); return dt; };
  w.validateResourceCleanup = function validateResourceCleanup() { console.log('Verify dangling timers/subscriptions are cleared after error recovery.'); };
  w.generatePerformanceReport = function generatePerformanceReport() { console.log('Aggregate metrics from manual runs and attach to bug reports.'); };

  // Automated Test Runners (browser wrappers)
  w.runErrorHandlingTestSuite = function runErrorHandlingTestSuite() { console.log('Run error boundary and network failure validations as above.'); };
  w.runSecurityValidationSuite = function runSecurityValidationSuite() { w.validateSecurityHeaders(); w.testCSPCompliance(); };
  w.runOfflineBehaviorSuite = function runOfflineBehaviorSuite() { w.simulateOfflineMode(); w.testOfflineFallbacks(); };
  w.runRateLimitingTestSuite = function runRateLimitingTestSuite() { w.testRateLimiting('/api/user/prefs', 12); };
  w.generateComprehensiveReport = function generateComprehensiveReport() { console.log('Compile manual notes + screenshots to complete report.'); };

  console.log('Loaded browser console debugger: rate limiting, errors, offline, db, security.');
})(typeof window !== 'undefined' ? window : globalThis);

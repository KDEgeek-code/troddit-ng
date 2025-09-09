# Persistence Manual Testing Guide

This guide provides step-by-step procedures to manually validate React Query cache persistence, LocalForage multi-instance storage, preference synchronization, offline behavior, and migration/compatibility across sessions and browsers.

## Prerequisites and Setup
- Development environment: Node 16+ and a modern browser (Chrome/Edge recommended).
- App running locally (e.g., `http://localhost:3000`).
- Authentication: prepare a test account to validate server-backed preference sync.
- Network simulation: use DevTools Network tab to toggle Offline/Online and throttling.

Note: Next.js does not serve files from the project `tests/` folder. Use one of:
- Option 1 (recommended): copy/paste the test files into DevTools Snippets and run them from there.
- Option 2: copy the desired test files into `public/tests/` so they are served by the dev server, then import from `/tests/...` in the console.

## React Query Cache Persistence Testing
- Navigate the feed and open several threads to populate cache.
- Option 1: Load `tests/react-query-persistence-validation.js` as a DevTools Snippet and run: `await runReactQueryPersistenceValidation()`.
- Option 2: After copying the file into `public/tests/`, run in console: `await (await import('/tests/react-query-persistence-validation.js')).runReactQueryPersistenceValidation()`.
- Verify:
  - Cache exists under `REACT_QUERY_OFFLINE_CACHE`.
  - Only feed/thread queries with pages are persisted.
  - Cache buster includes app version (when available).
  - Staleness (2m) and maxAge (7d) constraints.
- Refresh the page and re-run; confirm cache rehydrates.

## LocalForage Multi-Instance Testing
- Option 1: Load `tests/localforage-multi-instance-test.js` as a DevTools Snippet and run: `await runLocalForageMultiInstanceTests()`.
- Option 2: After copying the file into `public/tests/`, run in console: `await (await import('/tests/localforage-multi-instance-test.js')).runLocalForageMultiInstanceTests()`.
- Verify instances exist: `rq_cache`, `userPrefs`, `readPosts`, `seenPosts`, `subInfoCache`, `subredditFilters`, `userFilters`.
- Confirm data isolation (keys saved in one instance not visible in others).
- Validate roundtrip performance and basic quota handling.

## Preference Synchronization Testing
- Ensure you are authenticated (if applicable).
- Option 1: Load `tests/preference-cross-session-sync-test.js` as a DevTools Snippet and run: `await runPreferenceCrossSessionSyncTests()`.
- Option 2: After copying the file into `public/tests/`, run in console: `await (await import('/tests/preference-cross-session-sync-test.js')).runPreferenceCrossSessionSyncTests()`.
- Verify:
  - Local preference updates apply immediately.
  - Offline queueing records changes in `unsentPrefs`.
  - On reconnect, queued changes process and clear.
  - Server precedence resolves conflicts.

## Browser Console Testing Procedures
- Load `tests/browser-console-persistence-debugger.js` as a DevTools Snippet (recommended).
  - Alternatively, copy it to `public/tests/` and then import it from the console.
- Use helpers:
  - `window.inspectReactQueryCache()`, `window.clearReactQueryCache()`
  - `window.inspectLocalForageInstances()`, `window.clearAllLocalForage()`
  - `window.inspectPreferenceState()`, `window.testPreferenceSync()`
  - `window.runPersistenceTestSuite()` to run a quick overall check.

## Cross-Session and Cross-Tab Testing
- Open two tabs to the app.
- Change a preference in Tab A; validate propagation to Tab B (after refresh if needed).
- Close and reopen the browser; verify preferences and cache restore.
- Confirm no leakage of data across instances.

## Offline Functionality Testing
- Toggle DevTools to Offline.
- Navigate previously visited feeds/threads; confirm cached content is shown.
- Change preferences offline; confirm items are queued in `unsentPrefs`.
- Return Online; verify automatic revalidation and queue processing.

## Performance Testing Procedures
- Populate a large cache by browsing multiple subreddits/threads.
- Use `window.measureStoragePerformance()` and `window.measureSyncPerformance()`.
- Monitor memory via `window.monitorMemoryUsage()` (when supported).
- Validate cache operations complete within acceptable times.

## Error Scenario Testing
- Simulate quota limits by saving large objects via console to `rq_cache`.
- Corrupt `REACT_QUERY_OFFLINE_CACHE` manually (set malformed JSON) and reload; verify graceful recovery and logging.
- Toggle intermittent connectivity and observe stability.

## Troubleshooting and Diagnostics
- Use `window.generateDiagnosticReport()` and `window.validateSystemHealth()`.
- If persistence misbehaves:
  - Clear `rq_cache` and `userPrefs`.
  - Disable/enable debug mode: `window.enablePersistenceDebugMode()`.
  - Inspect network calls and server responses for preference sync.

## References
- See `tests/auth-integration-test-guide.md` for auth flows.
- See `tests/pwa-testing-guide.md` for PWA/offline specifics.

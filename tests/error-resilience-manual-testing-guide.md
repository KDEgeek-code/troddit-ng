# Error Resilience Manual Testing Guide

This guide provides step-by-step instructions for manually testing error handling, rate limiting, offline behavior, database resilience, and security configurations.

## Prerequisites and Setup
- Development server: `npm run build && npm run start`
- Database: `docker-compose up -d db` (or a running Postgres configured via env)
- Browsers: Chrome (desktop + mobile emulation), Firefox, Safari, Edge
- Tools: DevTools (Network throttling, offline), Docker, curl
- Authentication: Sign in via app (NextAuth) to exercise authenticated flows

## Rate Limiting Manual Testing
- User Prefs API: rapidly POST 12 updates within a minute to `/api/user/prefs`; expect 429 with `Retry-After`.
- Reset: wait past 60 seconds; retry POST; expect 200.
- Isolation: repeat with a different authenticated user; ensure independent counters.
- UI: trigger Reddit API rate limiting (or use `window.simulateRateLimit()`); ensure RateLimitModal shows countdown and retries.
- Cross-session: open in multiple tabs; confirm modal state sync and non-interference.

## Error Boundary Manual Testing
- Components: induce errors in Feed, PostBody, ParseBodyHTML, Settings; verify fallback UI renders.
- Reset flows: interact to reset boundaries (navigate away/back, retry actions); verify recovery without full reload.
- Global: throw unhandled errors (e.g., via console) and confirm whether a root-level boundary is needed.
- Async/React Query: simulate network errors; ensure boundaries and query error states are user-friendly.
- Logging: confirm error messages are formatted and do not leak sensitive data.

## Offline Behavior Manual Testing
- Offline toggle: DevTools > Network > Offline; navigate through app; cached routes load, uncached show `fallback.html`.
- Fallback UI: verify branding, accessibility, responsive layout, and Try Again button behavior.
- React Query: confirm `offlineFirst` serves cached feed/thread; revalidate upon reconnection.
- Service Worker: check cache names/entries; validate updates are applied when back online.
- Transitions: repeatedly move offline→online; confirm state continuity and no crashes.

## Database Failure Manual Testing
- Connection failures: `docker-compose stop db`; call `/api/user/prefs`; expect 5xx responses with sanitized messages.
- Pool exhaustion: induce high load (multiple tabs saving prefs); app remains responsive.
- Recovery: `docker-compose start db`; app resumes normal operations without manual intervention.
- Queued prefs: if supported, verify unsent preference changes are applied after DB recovery.

## Security Configuration Manual Testing
- Headers: verify CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy on pages and API.
- CSP: attempt to load blocked scripts/styles; confirm violations are blocked; app remains functional.
- CORS: exercise API with various origins/methods; ensure strict handling for sensitive endpoints.
- Embeds: ensure `frame-src` permits intended domains only (YouTube, Twitch, etc.).

## Browser Console Testing Procedures
- Load `tests/browser-console-error-debugger.js` in DevTools.
- Rate limiting: `window.runRateLimitingTestSuite()`; inspect `window.inspectRateLimitState()`.
- Offline: `window.runOfflineBehaviorSuite()`; inspect caches via `window.inspectServiceWorkerCache()`.
- Security: `window.runSecurityValidationSuite()`; attempt `window.simulateCSPViolation()`.
- DB: `window.testDatabaseConnection()`; monitor errors.

## Cross-Browser Testing
- Chrome: desktop + device emulation (iPhone/Android); validate UI and error surfaces.
- Safari: verify CSP enforcement and service worker compatibility.
- Firefox/Edge: repeat core scenarios; watch for header differences or SW quirks.

## Integration Testing Scenarios
- Compound failures: offline + DB down; rate limited + network slow; confirm graceful degradation.
- User journey: login, browse, save preferences, media interactions, error recovery across flows.

## Performance Testing Procedures
- Measure recovery time: simulate error and time to usable state (Performance panel).
- Memory: snapshot before/after errors; ensure no leaks.
- Load: many tabs/requests; monitor responsiveness.

## Security Testing Procedures
- Header enforcement: validate across pages, API, and static assets.
- OAuth: verify redirects and tokens remain secure during failures.
- Data protection: no sensitive data in error messages or client logs.

## Error Scenario Testing
- Network: throttle/timeout; observe handling, retries, and user feedback.
- Database: stop/start; observe 5xx → recovery.
- Rate limiting: trigger 429; ensure countdown and retry UX.
- CSP: attempt policy violations; ensure blocking and app stability.
- Component: force throws; verify boundaries.

## Recovery and Resilience Testing
- Automatic: confirm revalidation and reconnection without manual reloads.
- Manual: document steps to recover if automation fails.
- Stability: run long sessions with intermittent failures; monitor robustness.

## Troubleshooting and Diagnostics
- Common issues: server not started, DB unreachable, auth missing → follow console/test notes.
- Diagnostics: Server logs, Network panel, React Query Devtools, Docker logs.
- Optimization: reduce redundant retries, ensure timeouts, debounce actions under stress.

## Test Documentation
- Record results: keep logs/screenshots, note versions and environment.
- Report issues: include reproduction steps, headers, and console logs.
- Track coverage: map scenarios to pass/fail; regressions tracked over time.


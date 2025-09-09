#!/usr/bin/env node
/**
 * User Preferences API comprehensive test script
 * Targets: /api/user/prefs (GET, POST)
 *
 * Usage:
 *   node tests/user-prefs-api-test.js [--url http://localhost:3000] [--cookie "next-auth.session-token=..."] [--run-rate-limit]
 *
 * Notes:
 * - Designed to be run against a running Next.js app in dev.
 * - Authentication is provided via --cookie header or Authorization bearer if your app supports it.
 */

const getArg = (flag, dflt) => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : dflt;
};
const hasFlag = (flag) => process.argv.includes(flag);

const BASE_URL = getArg('--url', process.env.NEXTAUTH_URL || 'http://localhost:3000');
const COOKIE = getArg('--cookie', process.env.TEST_SESSION_COOKIE || '');
const RUN_RATE_LIMIT = hasFlag('--run-rate-limit');

if (typeof fetch !== 'function') {
  console.error('Global fetch not found. Please run on Node.js 18+');
  process.exit(1);
}

function logSection(t) { console.log(`\n=== ${t} ===`); }
function assert(c, m) { if (!c) throw new Error(m); }

function headers(json = true) {
  const h = {};
  if (json) h['content-type'] = 'application/json';
  if (COOKIE) h['cookie'] = COOKIE;
  return h;
}

async function getPrefs() {
  const res = await fetch(`${BASE_URL}/api/user/prefs`, { method: 'GET', headers: headers(false) });
  const body = await res.text();
  let json; try { json = JSON.parse(body); } catch { json = body; }
  return { status: res.status, json, headers: Object.fromEntries(res.headers.entries()) };
}

async function postPrefs(data, opts = {}) {
  const h = headers(!opts.noJson);
  const body = opts.noJson ? data : JSON.stringify(data);
  const res = await fetch(`${BASE_URL}/api/user/prefs`, { method: 'POST', headers: h, body });
  const txt = await res.text();
  let json; try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: res.status, json, headers: Object.fromEntries(res.headers.entries()) };
}

async function testAuthentication() {
  logSection('Authentication');
  // Without cookie
  const res1 = await fetch(`${BASE_URL}/api/user/prefs`, { method: 'GET' });
  assert([401, 403].includes(res1.status), 'GET without auth should be unauthorized');
  console.log('OK: Unauthorized GET rejected');

  // Unauthenticated POST should also be rejected
  const resPost = await fetch(`${BASE_URL}/api/user/prefs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ a: 1 })
  });
  assert([401, 403].includes(resPost.status), 'POST without auth should be unauthorized');
  console.log('OK: Unauthorized POST rejected');

  // With cookie if provided
  if (COOKIE) {
    const r = await getPrefs();
    assert([200, 204].includes(r.status), `Authorized GET should succeed; got ${r.status}`);
    console.log('OK: Authorized GET succeeded');
  } else {
    console.log('Note: No cookie provided; skipping authorized scenarios.');
  }
}

async function testGetRequest() {
  logSection('GET Request');
  if (!COOKIE) { console.log('Skipping GET tests requiring auth (no cookie).'); return; }
  const r = await getPrefs();
  assert([200, 204].includes(r.status), 'GET should return success');
  if (r.status === 200) {
    assert(typeof r.json === 'object', 'GET should return a JSON object');
    console.log('OK: Existing preferences retrieved:', r.json);
  } else {
    console.log('OK: No content for new user or empty prefs.');
  }
}

async function testPostRequest() {
  logSection('POST Request: save and retrieve');
  if (!COOKIE) { console.log('Skipping POST tests requiring auth (no cookie).'); return; }

  const prefs = { theme: 'dark', filters: { nsfw: false }, ts: Date.now() };
  const res = await postPrefs(prefs);
  assert([200, 201, 204].includes(res.status), `POST should succeed, got ${res.status}`);
  console.log('OK: Preferences saved.');

  const r2 = await getPrefs();
  assert(r2.status === 200 && typeof r2.json === 'object', 'GET after POST should return JSON');
  assert(r2.json.theme === 'dark', 'Saved theme should match');
  console.log('OK: Preferences round-trip verified.');
}

async function testContentTypeValidation() {
  logSection('POST: Content-Type and size validation');
  if (COOKIE) {
    // Missing content-type
    const res1 = await postPrefs('{"a":1}', { noJson: true });
    assert([400, 415].includes(res1.status), 'POST without application/json should be rejected');
    console.log('OK: Content-Type validation works.');

    // Malformed JSON with application/json header
    const malformed = await fetch(`${BASE_URL}/api/user/prefs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: COOKIE },
      body: '{"a":' // intentionally malformed
    });
    assert([400, 422].includes(malformed.status), 'Malformed JSON should be rejected with 400/422');
    console.log('OK: Malformed JSON rejected.');

    // Reject non-object JSON payloads
    const invalids = [[], 42, null, "str"]; // array, number, null, string
    for (const payload of invalids) {
      const r = await postPrefs(payload);
      assert([400, 422].includes(r.status), `Non-object JSON (${JSON.stringify(payload)}) should be rejected`);
    }
    console.log('OK: Non-object JSON payloads rejected.');

    // Oversized payload (~101KB)
    const big = { blob: 'x'.repeat(101 * 1024) };
    const res2 = await postPrefs(big);
    assert([400, 413, 422].includes(res2.status), 'Oversized prefs should be rejected');
    console.log('OK: Size limit enforced.');
  } else {
    console.log('Skipping Content-Type/size tests (no cookie).');
  }
}

async function testMethodValidation() {
  logSection('Method Validation');
  // PUT should not be allowed
  const res = await fetch(`${BASE_URL}/api/user/prefs`, { method: 'PUT', headers: headers(false) });
  assert(res.status === 405, `PUT should return 405, got ${res.status}`);
  console.log('OK: PUT is rejected with 405 Method Not Allowed.');
}

async function testRateLimiting() {
  logSection('Rate Limiting');
  if (!COOKIE) { console.log('Skipping rate limit tests (no cookie).'); return; }
  if (!RUN_RATE_LIMIT) { console.log('Use --run-rate-limit to execute this test.'); return; }
  const attempts = 12;
  let limited = false;
  for (let i = 0; i < attempts; i++) {
    const r = await getPrefs();
    if (r.status === 429) { limited = true; break; }
  }
  assert(limited, 'Expected a 429 response when exceeding rate limit');
  console.log('OK: Rate limiting reached and enforced.');
}

// Optional extended rate-limit checks: window reset and per-user isolation
const RUN_RATE_LIMIT_WINDOW = hasFlag('--run-rate-limit-window');
const RUN_RATE_LIMIT_MULTI = hasFlag('--run-rate-limit-multiuser');
const COOKIE2 = getArg('--cookie2', process.env.TEST_SESSION_COOKIE_2 || '');

async function testRateLimitWindowReset() {
  logSection('Rate Limit: window reset (~60s)');
  if (!COOKIE) { console.log('Skipping (no cookie).'); return; }
  if (!RUN_RATE_LIMIT_WINDOW) { console.log('Use --run-rate-limit-window to execute.'); return; }
  // Trip the limiter
  let hit = false;
  for (let i = 0; i < 20; i++) {
    const r = await getPrefs();
    if (r.status === 429) { hit = true; break; }
  }
  assert(hit, 'Should hit 429 first');
  console.log('Waiting ~65s for window reset...');
  await new Promise(r => setTimeout(r, 65000));
  const after = await getPrefs();
  assert(after.status !== 429, 'After window, request should succeed');
  console.log('OK: Rate-limit window resets as expected.');
}

async function testRateLimitPerUserIsolation() {
  logSection('Rate Limit: per-user isolation');
  if (!COOKIE || !COOKIE2) { console.log('Skipping (need --cookie and --cookie2).'); return; }
  if (!RUN_RATE_LIMIT_MULTI) { console.log('Use --run-rate-limit-multiuser to execute.'); return; }
  // Helper to GET with custom cookie
  const getWithCookie = async (cookie) => {
    const res = await fetch(`${BASE_URL}/api/user/prefs`, { method: 'GET', headers: { cookie } });
    return res.status;
  };
  // Exhaust user1
  let status1 = 200, limited1 = false;
  for (let i = 0; i < 20; i++) {
    status1 = await getWithCookie(COOKIE);
    if (status1 === 429) { limited1 = true; break; }
  }
  assert(limited1, 'User1 should be rate limited');
  // User2 should not be affected
  const status2 = await getWithCookie(COOKIE2);
  assert(status2 !== 429, 'User2 should not be rate limited by User1 traffic');
  console.log('OK: Rate limit is isolated per user.');
}

async function testSecurityAndHeaders() {
  logSection('Security Headers');
  if (!COOKIE) { console.log('Skipping header checks (no cookie).'); return; }
  const r = await getPrefs();
  const h = r.headers;
  assert(/no-cache/i.test(h['cache-control'] || ''), 'Response should include no-cache');
  console.log('OK: Security/cache headers present.');
}

async function run() {
  let passed = 0, failed = 0;
  const runCase = async (name, fn) => { try { await fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${name} ->`, e.message); } };

  console.log('User Prefs API Test');
  console.log('BASE_URL =', BASE_URL);
  await runCase('Authentication', testAuthentication);
  await runCase('GET request', testGetRequest);
  await runCase('POST request', testPostRequest);
  await runCase('Content-Type & size', testContentTypeValidation);
  await runCase('Method validation', testMethodValidation);
  await runCase('Rate limiting', testRateLimiting);
  await runCase('Rate limit window', testRateLimitWindowReset);
  await runCase('Rate limit multi-user', testRateLimitPerUserIsolation);
  await runCase('Security/headers', testSecurityAndHeaders);

  console.log(`\nSummary: passed=${passed}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}

run();

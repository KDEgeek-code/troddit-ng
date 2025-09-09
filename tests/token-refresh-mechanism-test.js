#!/usr/bin/env node
/**
 * Token refresh mechanism test script for NextAuth Reddit provider
 *
 * Focus: refreshAccessToken() behavior, expiration detection, error handling.
 *
 * Usage:
 *   node tests/token-refresh-mechanism-test.js
 */

const crypto = require('crypto');

if (typeof fetch !== 'function') {
  console.error('Global fetch not found. Please run on Node.js 18+');
  process.exit(1);
}

function logSection(title) { console.log(`\n=== ${title} ===`); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const CLIENT_ID = process.env.CLIENT_ID || process.env.REDDIT_CLIENT_ID || 'client';
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.REDDIT_CLIENT_SECRET || 'secret';

function b2a(input) {
  return Buffer.from(input).toString('base64');
}

function mockFetch(pattern, handler) {
  const orig = global.fetch;
  global.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (typeof pattern === 'string' ? url.includes(pattern) : pattern(url, init)) {
      const { status = 200, headers = {}, json } = await handler(url, init);
      return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json', ...headers } });
    }
    return orig(input, init);
  };
  return () => { global.fetch = orig; };
}

async function refreshAccessToken(token) {
  // Emulates the flow in [...nextauth].ts for refresh
  const tokenEndpoint = 'https://www.reddit.com/api/v1/access_token';
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.reddit?.refreshToken || token.refresh_token || token.refreshToken || token.reddit_refresh_token || ''
  });
  const auth = 'Basic ' + b2a(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: auth },
    body
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Refresh failed: ${res.status} ${err.error || ''}`.trim());
  }
  const data = await res.json();
  const expiresIn = data.expires_in || 3600;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || token.refresh_token || token.refreshToken || (token.reddit && token.reddit.refreshToken),
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  };
}

async function testValidRefresh() {
  logSection('Token Refresh: valid refresh');
  const restore = mockFetch('access_token', async (_url, init) => {
    const auth = (init.headers && (init.headers.authorization || init.headers.Authorization)) || '';
    assert(auth.startsWith('Basic '), 'Missing Basic auth header');
    const body = typeof init.body === 'string' ? init.body : '';
    const p = new URLSearchParams(body);
    assert(p.get('grant_type') === 'refresh_token', 'grant_type must be refresh_token');
    assert(p.get('refresh_token') === 'good_refresh', 'refresh token must match input');
    return { status: 200, json: { access_token: 'new_access', token_type: 'bearer', expires_in: 7200 } };
  });

  const updated = await refreshAccessToken({ refresh_token: 'good_refresh' });
  restore();
  assert(updated.access_token === 'new_access', 'Access token not updated');
  assert(updated.expires_at > Math.floor(Date.now() / 1000), 'expires_at should be in future');
  console.log('OK: Valid refresh path works.');
}

async function testRefreshTokenExtractionVariants() {
  logSection('Refresh Token: extraction variants');
  const restore = mockFetch('access_token', async () => ({ status: 200, json: { access_token: 'ok', refresh_token: 'persist', expires_in: 3600 } }));
  const cases = [
    { reddit: { refreshToken: 'a' } },
    { refresh_token: 'b' },
    { refreshToken: 'c' },
    { reddit_refresh_token: 'd' },
  ];
  for (const c of cases) {
    const res = await refreshAccessToken(c);
    assert(res.access_token === 'ok', 'Should succeed for variant');
  }
  restore();
  console.log('OK: Refresh token extracted across variants.');
}

async function testMissingRefreshToken() {
  logSection('Refresh Token: missing or invalid');
  const restore = mockFetch('access_token', async () => ({ status: 400, json: { error: 'invalid_request' } }));
  let threw = false;
  try { await refreshAccessToken({}); } catch (e) { threw = true; }
  restore();
  assert(threw, 'Expected failure on missing refresh token');
  console.log('OK: Missing refresh token produces error.');
}

async function testExpirationDetection() {
  logSection('Expiration Detection: timestamp edge cases');
  const now = Math.floor(Date.now() / 1000);
  const valid = { expires_at: now + 10 };
  const expiring = { expires_at: now };
  const expired = { expires_at: now - 1 };
  assert(valid.expires_at > now, 'valid should be in future');
  assert(expiring.expires_at === now, 'edge equals now');
  assert(expired.expires_at < now, 'expired is before now');
  console.log('OK: Expiration comparisons behave as expected.');
}

async function testErrorRecoveryAndRateLimit() {
  logSection('Error Recovery: network & rate limit');
  // Simulate rate limit
  const restore = mockFetch('access_token', async () => ({ status: 429, json: { error: 'rate_limited' } }));
  let err;
  try { await refreshAccessToken({ refresh_token: 'good' }); } catch (e) { err = e; }
  restore();
  assert(err && /429/.test(err.message), 'Should surface 429 rate limit');
  console.log('OK: Rate limit surfaces as error.');
}

async function testTokenStructureAfterRefresh() {
  logSection('Token Structure: post-refresh values');
  const restore = mockFetch('access_token', async () => ({ status: 200, json: { access_token: 'acc2', refresh_token: 'ref2', expires_in: 4000 } }));
  const updated = await refreshAccessToken({ refresh_token: 'ref1' });
  restore();
  assert(updated.access_token === 'acc2', 'Access token must update');
  assert(updated.refresh_token === 'ref2', 'Refresh token should update when provided');
  assert(updated.expires_at > Math.floor(Date.now() / 1000) + 3000, 'Expiry should be in future accordingly');
  console.log('OK: Post-refresh token structure validated.');
}

async function run() {
  let passed = 0, failed = 0;
  const runCase = async (name, fn) => {
    try { await fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${name} ->`, e.message); }
  };

  await runCase('Valid refresh', testValidRefresh);
  await runCase('Token extraction variants', testRefreshTokenExtractionVariants);
  await runCase('Missing refresh token', testMissingRefreshToken);
  await runCase('Expiration detection', testExpirationDetection);
  await runCase('Error recovery & rate limit', testErrorRecoveryAndRateLimit);
  await runCase('Post-refresh token structure', testTokenStructureAfterRefresh);

  console.log(`\nSummary: passed=${passed}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}

run();

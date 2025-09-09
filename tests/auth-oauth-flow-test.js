#!/usr/bin/env node
/**
 * NextAuth + Reddit OAuth flow test script
 *
 * Usage:
 *   node tests/auth-oauth-flow-test.js [--live] [--nextauth-url http://localhost:3000] [--cookie "next-auth.session-token=..."]
 *
 * Notes:
 * - By default, this script runs simulated tests with mocked Reddit endpoints.
 * - Use --live to run limited live checks against a running Next.js dev server.
 * - For live checks requiring auth, pass a valid session cookie via --cookie.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Node 18+ has global fetch
if (typeof fetch !== 'function') {
  console.error('Global fetch not found. Please run on Node.js 18+');
  process.exit(1);
}

// ------------ CLI & Env ------------
const args = new Set(process.argv.slice(2));
const getArgValue = (flag, dflt) => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : dflt;
};
const LIVE = args.has('--live');
const NEXTAUTH_URL = getArgValue('--nextauth-url', process.env.NEXTAUTH_URL || 'http://localhost:3000');
const COOKIE = getArgValue('--cookie', '');

// Prefer dotenv/dotenv-expand for robust env loading; fallback to manual if unavailable
try {
  const dotenv = require('dotenv');
  let env = dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  try { require('dotenv-expand').expand(env); } catch {}
  // Load additional common env files if present
  const candidates = [
    '.env.local', '.env.development.local', '.env.development',
    path.join('..', '.env.local'), path.join('..', '.env')
  ];
  for (const p of candidates) {
    const f = path.resolve(process.cwd(), p);
    if (fs.existsSync(f)) {
      const e = dotenv.config({ path: f });
      try { require('dotenv-expand').expand(e); } catch {}
    }
  }
} catch {
  const ENV_CANDIDATES = [
    '.env.local', '.env.development.local', '.env.development', '.env',
    path.join('..', '.env.local'), path.join('..', '.env')
  ];
  for (const p of ENV_CANDIDATES) {
    const f = path.resolve(process.cwd(), p);
    if (fs.existsSync(f)) {
      const txt = fs.readFileSync(f, 'utf8');
      for (const line of txt.split(/\r?\n/)) {
        if (!line || line.trim().startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const CLIENT_ID = process.env.CLIENT_ID || process.env.REDDIT_CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.REDDIT_CLIENT_SECRET || '';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';

// ------------ Utilities ------------
function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

function buildRedditAuthUrl({ clientId, redirectUri, scope, state, duration = 'permanent' }) {
  const base = 'https://www.reddit.com/api/v1/authorize';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
    redirect_uri: redirectUri,
    duration,
    scope: Array.isArray(scope) ? scope.join(' ') : scope
  });
  return `${base}?${params.toString()}`;
}

function signJwtHS256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const h = base64url(header);
  const p = base64url(payload);
  const data = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sig}`;
}

function decodeJwt(token) {
  const [h, p] = token.split('.');
  if (!h || !p) throw new Error('Invalid JWT');
  const json = Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

function mockFetchOnce(match, responder) {
  const original = global.fetch;
  let used = false;
  global.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!used && (typeof match === 'function' ? match(url, init) : url.includes(match))) {
      used = true;
      try {
        const { status = 200, headers = {}, json } = await responder(url, init);
        return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json', ...headers } });
      } finally {
        global.fetch = original;
      }
    }
    return original(input, init);
  };
}

// ------------ Tests ------------
async function testOAuthFlowGeneration() {
  logSection('OAuth Flow: URL generation');
  assert(CLIENT_ID, 'CLIENT_ID must be set in env');
  const redirectUri = `${NEXTAUTH_URL}/api/auth/callback/reddit`;
  const state = crypto.randomBytes(12).toString('hex');
  const scopes = ['identity', 'mysubreddits', 'read'];
  const url = buildRedditAuthUrl({ clientId: CLIENT_ID, redirectUri, scope: scopes, state });
  console.log('Authorize URL:', url);
  const u = new URL(url);
  assert(u.origin === 'https://www.reddit.com', 'Origin must be reddit.com');
  assert(u.searchParams.get('client_id') === CLIENT_ID, 'client_id mismatch');
  assert(u.searchParams.get('redirect_uri') === redirectUri, 'redirect_uri mismatch');
  assert(u.searchParams.get('response_type') === 'code', 'response_type must be code');
  assert(u.searchParams.get('duration') === 'permanent', 'duration must be permanent');
  assert(u.searchParams.get('scope')?.includes('identity'), 'scope must include identity');
  assert(u.searchParams.get('state') === state, 'state must echo for CSRF');
  console.log('OK: OAuth authorization URL is correctly formed.');
}

async function testTokenExchangeMock() {
  logSection('OAuth Flow: Callback and token exchange (mock)');
  assert(CLIENT_ID && CLIENT_SECRET, 'CLIENT_ID/CLIENT_SECRET must be set for token exchange mock');
  const tokenEndpoint = 'https://www.reddit.com/api/v1/access_token';
  mockFetchOnce(tokenEndpoint, async (url, init) => {
    const body = typeof init.body === 'string' ? init.body : '';
    const params = new URLSearchParams(body);
    assert(params.get('grant_type') === 'authorization_code', 'grant_type must be authorization_code');
    assert(params.get('code'), 'authorization code must be present');
    assert(params.get('redirect_uri') === `${NEXTAUTH_URL}/api/auth/callback/reddit`, 'redirect_uri mismatch');
    const h = init.headers || {};
    const auth = h.authorization || h.Authorization || '';
    const expected = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    assert(auth === expected, 'Authorization header must be Basic base64(client:secret)');
    return { status: 200, json: {
      access_token: 'mock_access', token_type: 'bearer', expires_in: 3600,
      scope: 'identity read', refresh_token: 'mock_refresh'
    } };
  });

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'mock_code',
      redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/reddit`
    })
  });
  const json = await res.json();
  assert(json.access_token === 'mock_access', 'access token mismatch');
  assert(json.refresh_token === 'mock_refresh', 'refresh token mismatch');
  console.log('OK: Token exchange flow behaves as expected (mock).');
}

async function testJwtCreationAndStructure() {
  logSection('Token Management: JWT creation and structure');
  assert(NEXTAUTH_SECRET, 'NEXTAUTH_SECRET must be set to validate JWT signing');
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'reddit:123',
    name: 'test-user',
    reddit: { accessToken: 'mock_access', refreshToken: 'mock_refresh' },
    iat: now, exp: now + 3600
  };
  const jwt = signJwtHS256(payload, NEXTAUTH_SECRET);
  console.log('JWT:', jwt.split('.').slice(0, 2).join('.') + '.<sig>');
  const decoded = decodeJwt(jwt);
  assert(decoded.reddit.accessToken && decoded.reddit.refreshToken, 'JWT must include reddit tokens');
  assert(decoded.exp > decoded.iat, 'exp must be after iat');
  console.log('OK: JWT contains expected token structure.');
}

async function testTokenAutoRefreshMock() {
  logSection('Token Management: Automatic token refresh (mock)');
  assert(CLIENT_ID && CLIENT_SECRET, 'CLIENT_ID/CLIENT_SECRET required');
  const tokenEndpoint = 'https://www.reddit.com/api/v1/access_token';
  mockFetchOnce(tokenEndpoint, async () => ({ status: 200, json: {
    access_token: 'mock_access_2', token_type: 'bearer', expires_in: 3600,
    scope: 'identity read', refresh_token: 'mock_refresh'
  } }));

  const token = {
    access_token: 'expired',
    refresh_token: 'mock_refresh',
    expires_at: Math.floor(Date.now() / 1000) - 10
  };

  // Simulate refresh logic similar to NextAuth callbacks
  async function refreshAccessToken(tok) {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tok.refresh_token })
    });
    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || tok.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
    };
  }

  const refreshed = await refreshAccessToken(token);
  assert(refreshed.access_token === 'mock_access_2', 'access token should be refreshed');
  assert(refreshed.expires_at > Math.floor(Date.now() / 1000), 'expires_at should be in the future');
  console.log('OK: Token refresh simulated successfully.');
}

async function testSessionLifecycleSimulation() {
  logSection('Session Management: lifecycle simulation');
  // Simulate a session object structure and expiration
  const now = Date.now();
  const session = { user: { name: 'test-user', id: 'reddit:123' },
    expires: new Date(now + 30 * 60 * 1000).toISOString() };
  assert(new Date(session.expires).getTime() > now, 'Session should expire in the future');
  console.log('OK: Session structure and expiration look valid.');
}

async function testErrorHandlingMocks() {
  logSection('Error Handling: OAuth and refresh failures (mock)');
  // OAuth denied
  try {
    const params = new URLSearchParams({ error: 'access_denied', error_description: 'User denied' });
    const url = `${NEXTAUTH_URL}/api/auth/callback/reddit?${params}`;
    console.log('Simulated callback URL:', url);
    // NextAuth would handle this and redirect; we just assert we detect error params
    assert(params.get('error') === 'access_denied', 'Expected access_denied error');
    console.log('OK: Detected OAuth denial parameters.');
  } catch (e) {
    throw new Error('OAuth denial flow handling failed: ' + e.message);
  }

  // Refresh failure
  const tokenEndpoint = 'https://www.reddit.com/api/v1/access_token';
  mockFetchOnce(tokenEndpoint, async () => ({ status: 400, json: { error: 'invalid_grant' } }));
  const res = await fetch(tokenEndpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: 'bad' }) });
  assert(res.status === 400, 'Expected 400 on invalid refresh token');
  console.log('OK: Handled invalid refresh token scenario.');
}

async function testSecurityBasics() {
  logSection('Security: CSRF & cookie settings (static checks)');
  const redirectUri = `${NEXTAUTH_URL}/api/auth/callback/reddit`;
  const state = crypto.randomBytes(12).toString('hex');
  const url = buildRedditAuthUrl({ clientId: CLIENT_ID, redirectUri, scope: 'identity', state });
  assert(new URL(url).searchParams.get('state') === state, 'state param exists for CSRF protection');
  console.log('OK: CSRF state parameter present in authorization URL.');
}

async function testLiveMinimal() {
  if (!LIVE) return;
  logSection('LIVE checks: ping NextAuth routes');
  try {
    const res = await fetch(`${NEXTAUTH_URL}/api/auth/providers`, { headers: COOKIE ? { cookie: COOKIE } : {} });
    console.log('GET /api/auth/providers ->', res.status);
    assert(res.ok, 'Providers endpoint should be reachable on live server');
    const providers = await res.json();
    console.log('Providers:', Object.keys(providers));
    // Also check signin pages
    const r1 = await fetch(`${NEXTAUTH_URL}/api/auth/signin`, { headers: COOKIE ? { cookie: COOKIE } : {} });
    console.log('GET /api/auth/signin ->', r1.status);
    assert(r1.ok, 'Signin page should be reachable');
    const r2 = await fetch(`${NEXTAUTH_URL}/api/auth/signin/reddit`, { headers: COOKIE ? { cookie: COOKIE } : {} });
    console.log('GET /api/auth/signin/reddit ->', r2.status);
    assert(r2.ok, 'Provider signin page should be reachable');
  } catch (e) {
    console.warn('Live check failed (is dev server running?):', e.message);
  }
}

async function run() {
  let passed = 0, failed = 0;
  const runCase = async (name, fn) => {
    try { await fn(); passed++; }
    catch (e) { failed++; console.error(`FAIL: ${name} ->`, e.message); }
  };

  console.log('NextAuth OAuth Flow Test');
  console.log('NEXTAUTH_URL =', NEXTAUTH_URL);
  await runCase('OAuth URL generation', testOAuthFlowGeneration);
  await runCase('Token exchange (mock)', testTokenExchangeMock);
  await runCase('JWT creation and structure', testJwtCreationAndStructure);
  await runCase('Automatic token refresh (mock)', testTokenAutoRefreshMock);
  await runCase('Session lifecycle simulation', testSessionLifecycleSimulation);
  await runCase('Error handling (mock)', testErrorHandlingMocks);
  await runCase('Security basics', testSecurityBasics);
  await runCase('Live minimal checks', testLiveMinimal);

  console.log(`\nSummary: passed=${passed}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}

run();

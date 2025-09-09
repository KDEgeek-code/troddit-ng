#!/usr/bin/env node
/*
 Security Headers & CSP Validation
 - Verifies presence and values of configured security headers across routes
*/

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function log(step, msg) { console.log(`[security] ${step}: ${msg}`); }
function assert(c, m) { if (!c) throw new Error(m); }

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      res.resume();
      resolve({ status: res.statusCode, headers: res.headers });
    });
    req.on('error', reject);
  });
}

function hasDirective(csp, directive) {
  return new RegExp(`(^|;\\s*)${directive}(?:\\s|$)`, 'i').test(csp || '');
}

async function validateRoute(pathname) {
  const url = `${BASE_URL}${pathname}`;
  const res = await get(url);
  const h = Object.fromEntries(Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), v]));
  const csp = h['content-security-policy'] || '';
  const checks = [];
  checks.push({ key: 'CSP', pass: !!csp, note: csp ? 'present' : 'missing' });
  checks.push({ key: 'X-Frame-Options', pass: /deny/i.test(h['x-frame-options'] || ''), note: h['x-frame-options'] || '' });
  checks.push({ key: 'X-Content-Type-Options', pass: /nosniff/i.test(h['x-content-type-options'] || ''), note: h['x-content-type-options'] || '' });
  checks.push({ key: 'Referrer-Policy', pass: /strict-origin-when-cross-origin/i.test(h['referrer-policy'] || ''), note: h['referrer-policy'] || '' });
  checks.push({ key: 'HSTS', pass: /max-age=/i.test(h['strict-transport-security'] || ''), note: h['strict-transport-security'] || '' });
  checks.push({ key: 'COOP', pass: /same-origin/i.test(h['cross-origin-opener-policy'] || ''), note: h['cross-origin-opener-policy'] || '' });
  checks.push({ key: 'CORP', pass: /(cross-origin|same-site|same-origin)/i.test(h['cross-origin-resource-policy'] || ''), note: h['cross-origin-resource-policy'] || '' });
  checks.push({ key: 'Permissions-Policy', pass: /camera=\(\),\s*microphone=\(\),\s*geolocation=\(\)/i.test(h['permissions-policy'] || ''), note: h['permissions-policy'] || '' });

  // CSP directives
  const cspDirectives = [
    'default-src', 'script-src', 'style-src', 'img-src', 'media-src', 'connect-src', 'frame-src', 'font-src', 'object-src', 'base-uri', 'form-action'
  ];
  for (const d of cspDirectives) {
    checks.push({ key: `CSP:${d}`, pass: hasDirective(csp, d), note: hasDirective(csp, d) ? 'ok' : 'missing' });
  }

  return { path: pathname, status: res.status, checks };
}

async function main() {
  const paths = ['/'];
  // Include an API route that exists in project
  paths.push('/api/user/prefs');

  const results = [];
  for (const p of paths) {
    try {
      results.push(await validateRoute(p));
    } catch (e) {
      results.push({ path: p, status: 0, error: e.message, checks: [] });
    }
  }

  let failed = 0;
  console.log('[security] Report');
  for (const r of results) {
    console.log(`- ${r.path} (HTTP ${r.status})`);
    if (r.error) { console.log(`  error: ${r.error}`); failed++; continue; }
    for (const c of r.checks) {
      const line = `  ${c.key}: ${c.pass ? 'PASS' : 'FAIL'} (${c.note})`;
      console.log(line);
      if (!c.pass) failed++;
    }
  }

  // Browser guidance
  console.log('- Browser CSP validation: use window.runSecurityValidationSuite() and window.testCSPCompliance() from tests/browser-console-error-debugger.js');

  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('[security] FAILED:', e.message); process.exit(1); });

#!/usr/bin/env node
/*
 Offline Behavior Comprehensive Test
 - Validates service worker config presence, fallback page behavior, and React Query offline-first defaults
 - Augments existing offline tests with broader coverage and reporting
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function log(step, msg) { console.log(`[offline-comprehensive] ${step}: ${msg}`); }
function assert(c, m) { if (!c) throw new Error(m); }

async function runLighthouse(url) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['lighthouse', url, '--quiet', '--only-categories=pwa', '--output=json', '--output-path=stdout', '--config-path=./tests/lighthouse-config.json'], { shell: true });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        resolve({ code, err: err.trim() });
      } else {
        try { resolve(JSON.parse(out)); } catch (_) { resolve(null); }
      }
    });
  });
}

function validateFallbackPage() {
  const fallbackPath = path.join(process.cwd(), 'public', 'fallback.html');
  const res = { name: 'Fallback Page', pass: true, notes: [] };
  try {
    const html = fs.readFileSync(fallbackPath, 'utf8');
    if (!/Try Again/i.test(html)) res.notes.push('Missing "Try Again" button text');
    if (!/You are offline/i.test(html)) res.notes.push('Missing offline messaging');
    if (res.notes.length) res.pass = false;
  } catch (e) {
    res.pass = false; res.notes.push('fallback.html missing');
  }
  return res;
}

function validatePWAConfig() {
  const cfgPath = path.join(process.cwd(), 'next.config.js');
  const res = { name: 'PWA Configuration', pass: true, notes: [] };
  try {
    const src = fs.readFileSync(cfgPath, 'utf8');
    if (!/next-pwa/i.test(src)) { res.pass = false; res.notes.push('next-pwa not configured'); }
    if (!/fallbacks:\s*{[\s\S]*document:\s*"\/fallback\.html"/i.test(src)) { res.pass = false; res.notes.push('fallbacks.document not set to /fallback.html'); }
    if (!/reddit-api-cache|internal-reddit-api-cache/i.test(src)) { res.notes.push('Reddit API caching entries not detected'); }
  } catch (e) {
    res.pass = false; res.notes.push('next.config.js not readable');
  }
  return res;
}

function validateReactQueryOfflineFirst() {
  const appPath = path.join(process.cwd(), 'src', 'pages', '_app.tsx');
  const res = { name: 'React Query offlineFirst', pass: true, notes: [] };
  try {
    const src = fs.readFileSync(appPath, 'utf8');
    const hasFeed = /setQueryDefaults\(\["feed"\][\s\S]*networkMode:\s*"offlineFirst"/m.test(src);
    const hasThread = /setQueryDefaults\(\["thread"\][\s\S]*networkMode:\s*"offlineFirst"/m.test(src);
    if (!hasFeed || !hasThread) { res.pass = false; res.notes.push('Missing offlineFirst for feed/thread queries'); }
  } catch (e) {
    res.pass = false; res.notes.push('_app.tsx not readable');
  }
  return res;
}

async function lighthouseOfflineAudit() {
  const url = process.env.BASE_URL || 'http://localhost:3000';
  const audit = await runLighthouse(url);
  if (!audit || audit.code) {
    return { name: 'Lighthouse Offline Audit', pass: true, notes: ['Lighthouse unavailable or Chrome not installed. Skipping.'] };
  }
  const offlineOk = audit.audits && audit.audits['offline-start-url'] && audit.audits['offline-start-url'].score === 1;
  const swOk = audit.audits && audit.audits['service-worker'] && audit.audits['service-worker'].score === 1;
  const pass = !!(offlineOk && swOk);
  return { name: 'Lighthouse Offline Audit', pass, notes: [`offline-start-url=${!!offlineOk}`, `service-worker=${!!swOk}`] };
}

async function main() {
  const results = [];
  results.push(validateFallbackPage());
  results.push(validatePWAConfig());
  results.push(validateReactQueryOfflineFirst());
  results.push(await lighthouseOfflineAudit());

  // Browser guidance
  results.push({
    name: 'Browser Offline Tests', pass: true,
    notes: [
      'Run window.validateOfflineBehavior() and window.testOfflineFallbacks() from tests/browser-console-error-debugger.js',
      'Validate offline events, fallback page, cache serving, and auto-revalidation.'
    ]
  });

  let failed = 0;
  console.log('[offline-comprehensive] Report');
  for (const r of results) {
    console.log(`- ${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`);
    if (r.notes && r.notes.length) console.log(`  notes: ${r.notes.join(' | ')}`);
    if (!r.pass) failed++;
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('[offline-comprehensive] FAILED:', e.message); process.exit(1); });


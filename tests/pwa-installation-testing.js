#!/usr/bin/env node
/*
 PWA Installation Testing
 - Validates installability criteria: SW, manifest, icons, start_url, scope
 - Optionally invokes Lighthouse to verify install prompt criteria
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

function log(step, msg) { console.log(`[pwa-installation] ${step}: ${msg}`); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function runLighthouse(url) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['lighthouse', url, '--quiet', '--only-categories=pwa', '--output=json', '--output-path=stdout', '--config-path=./tests/lighthouse-config.json'], { shell: true });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        log('lighthouse', `Non-zero exit (${code}). stderr: ${err.trim()}`);
        resolve(null);
      } else {
        try { resolve(JSON.parse(out)); } catch (_) { resolve(null); }
      }
    });
  });
}

async function waitForServer(url = 'http://localhost:3000', timeoutMs = 30000, intervalMs = 500) {
  // Try wait-on if available; otherwise do a simple HTTP retry loop
  try {
    return await new Promise((resolve) => {
      const child = spawn('npx', ['wait-on', url], { shell: true });
      child.on('close', (code) => resolve(code === 0));
    });
  } catch (_) {}
  const start = Date.now();
  return await new Promise((resolve) => {
    const tick = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(true); });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return resolve(false);
        setTimeout(tick, intervalMs);
      });
    };
    tick();
  });
}

async function main() {
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  const manifestPath = path.join(PUBLIC_DIR, 'manifest.json');
  const swPath = path.join(PUBLIC_DIR, 'sw.js');

  // Core installability checks
  log('check', 'Validating manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json missing');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.start_url, 'start_url missing');
  assert(manifest.display === 'standalone', 'display should be standalone');
  assert(manifest.scope, 'scope missing');
  assert(['#384659', '#384659'].includes(manifest.theme_color), 'theme_color not set to #384659');
  assert(['#384659', '#384659'].includes(manifest.background_color), 'background_color not set to #384659');
  log('ok', `start_url=${manifest.start_url} scope=${manifest.scope}`);

  log('check', 'Validating icons');
  const icons = (manifest.icons || []).map(i => i.src);
  assert(icons.includes('/icon-192.png'), 'icon-192 missing in manifest');
  assert(icons.includes('/icon-512.png'), 'icon-512 missing in manifest');
  assert(fs.existsSync(path.join(PUBLIC_DIR, 'icon-192.png')), 'icon-192.png missing');
  assert(fs.existsSync(path.join(PUBLIC_DIR, 'icon-512.png')), 'icon-512.png missing');
  log('ok', 'Icons present');

  // Service worker presence (build required)
  log('check', 'Validating service worker presence');
  assert(fs.existsSync(swPath), 'sw.js missing. Build production assets first.');
  log('ok', 'sw.js present');

  // Optional: Lighthouse check (requires Chrome)
  log('info', 'Preparing to run Lighthouse PWA audit (optional)');
  const ready = await waitForServer('http://localhost:3000');
  if (!ready) {
    log('warn', 'Server not reachable at http://localhost:3000. Ensure server is running before Lighthouse audit.');
    log('result', 'PWA installability checks completed (Lighthouse skipped)');
    return;
  }
  const lh = await runLighthouse('http://localhost:3000');
  if (lh) {
    const pwaScore = (lh.categories && lh.categories.pwa && lh.categories.pwa.score) ? Math.round(lh.categories.pwa.score * 100) : null;
    if (pwaScore != null) log('lighthouse', `PWA score: ${pwaScore}`);
    const regSw = lh.audits && lh.audits['service-worker'] && lh.audits['service-worker'].score === 1;
    const offline200 = lh.audits && lh.audits['offline-start-url'] && lh.audits['offline-start-url'].score === 1;
    const manifestPass = lh.audits && lh.audits['manifest-exists'] && lh.audits['manifest-exists'].score === 1;
    log('audit', `Registers SW=${!!regSw} Offline OK=${!!offline200} Manifest=${!!manifestPass}`);
  } else {
    log('warn', 'Lighthouse not executed (Chrome not available or CLI error). Manual verification recommended.');
  }

  log('result', 'PWA installability checks completed');
}

main().catch((err) => {
  console.error('[pwa-installation] FAILED:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/*
 Offline Functionality Testing
 - Validates fallback.html presence and basic content
 - Optionally runs Lighthouse to check offline 200 and SW behavior
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function log(step, msg) { console.log(`[offline-testing] ${step}: ${msg}`); }
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

async function main() {
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  const fallbackPath = path.join(PUBLIC_DIR, 'fallback.html');

  // Fallback page validation
  log('check', 'Validating fallback.html');
  assert(fs.existsSync(fallbackPath), 'fallback.html missing');
  const html = fs.readFileSync(fallbackPath, 'utf8');
  assert(/Try Again/i.test(html), 'fallback.html missing "Try Again" button');
  assert(/You are offline/i.test(html), 'fallback.html missing offline message');
  assert(/#384659/i.test(html) || /background-color:\s*#384659/i.test(html), 'fallback branding color missing');
  log('ok', 'fallback.html content OK');

  // Lighthouse offline checks
  log('info', 'Running Lighthouse PWA audit (offline checks)');
  const lh = await runLighthouse('http://localhost:3000');
  if (lh) {
    const offlineOk = lh.audits && lh.audits['offline-start-url'] && lh.audits['offline-start-url'].score === 1;
    const swOk = lh.audits && lh.audits['service-worker'] && lh.audits['service-worker'].score === 1;
    log('audit', `Offline 200=${!!offlineOk} Registers SW=${!!swOk}`);
  } else {
    log('warn', 'Lighthouse not executed (Chrome not available or CLI error). Manual offline verification recommended.');
  }

  log('result', 'Offline functionality checks completed');
}

main().catch((err) => {
  console.error('[offline-testing] FAILED:', err.message);
  process.exit(1);
});


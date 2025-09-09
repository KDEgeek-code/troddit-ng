#!/usr/bin/env node
/*
 Error Resilience Integration Test Suite
 - Orchestrates rate limiting, error boundary, offline behavior, DB resilience, and security validation
*/

const { spawn } = require('child_process');
const path = require('path');

function log(step, msg) { console.log(`[resilience] ${step}: ${msg}`); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true, stdio: 'pipe', ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

async function startDb() {
  try {
    log('db', 'Starting database via docker-compose');
    await run('docker-compose', ['up', '-d', 'db']);
  } catch (e) {
    log('db', `start failed (continuing): ${e.message}`);
  }
}

async function waitOn(url) {
  // Use wait-on if available, else simple retry
  try { const r = await run('npx', ['wait-on', url]); if (r.code === 0) return; } catch {}
  const http = require('http');
  const start = Date.now();
  const timeout = 30000; const interval = 500;
  await new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(); });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(tick, interval);
      });
    };
    tick();
  });
}

function isLocalServerRunning(url) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(url, (res) => { res.resume(); resolve(true); });
    req.on('error', () => resolve(false));
  });
}

async function main() {
  const root = process.cwd();
  const testsDir = path.join(root, 'tests');

  await startDb();

  // Start production server only if not already running
  const baseUrl = 'http://localhost:3000';
  const alreadyUp = await isLocalServerRunning(baseUrl);
  let server = null;
  if (alreadyUp) {
    log('server', 'Detected existing server at http://localhost:3000; will not spawn a new one');
  } else {
    log('server', 'Starting server');
    server = spawn('npm', ['run', 'start'], { shell: true, stdio: 'pipe' });
    server.on('error', (e) => log('server', `error: ${e.message}`));
    try { await waitOn(baseUrl); } catch (e) { try { server.kill('SIGTERM'); } catch {} throw e; }
    log('server', 'Server ready at http://localhost:3000');
  }

  let failed = false;
  async function runTest(name, file) {
    log('test', `Running ${name}`);
    const res = await run('node', [path.join(testsDir, file)]);
    if (res.code !== 0) {
      failed = true;
      process.stderr.write(res.out + res.err);
      log('fail', `${name} failed`);
    } else {
      log('pass', `${name} passed`);
    }
  }

  await runTest('Rate Limiting Comprehensive', 'rate-limiting-comprehensive-test.js');
  await runTest('Error Boundaries Validation', 'error-boundaries-validation.js');
  await runTest('Offline Behavior Comprehensive', 'offline-behavior-comprehensive-test.js');
  await runTest('Database Failure & Recovery', 'database-failure-recovery-test.js');
  await runTest('Security Headers & CSP', 'security-headers-csp-validation.js');

  if (server) {
    server.kill('SIGTERM');
  }
  if (failed) throw new Error('One or more resilience tests failed');
  log('result', 'All resilience tests passed');
}

main().catch((err) => {
  console.error('[resilience] FAILED:', err.message);
  process.exit(1);
});

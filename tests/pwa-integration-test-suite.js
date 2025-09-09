#!/usr/bin/env node
/*
 PWA Integration Test Suite
 - Orchestrates environment setup, build, server, and PWA test runners
*/

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function log(step, msg) { console.log(`[pwa-integration] ${step}: ${msg}`); }

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
  log('db', 'Starting database via docker-compose');
  await run('docker-compose', ['up', '-d', 'db']);
}

async function waitOn(url) {
  // Use wait-on if available, else simple retry
  try {
    const r = await run('npx', ['wait-on', url]);
    if (r.code === 0) return;
  } catch {}
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

async function main() {
  const root = process.cwd();
  const testsDir = path.join(root, 'tests');

  // 1) Environment setup
  try {
    await startDb();
  } catch (e) {
    log('warn', `Database start failed/skipped: ${e.message}`);
  }

  // 2) Production build
  log('build', 'Running production build');
  const build = await run('node', [path.join(testsDir, 'production-build-validation.js')]);
  if (build.code !== 0) {
    process.stderr.write(build.out + build.err);
    throw new Error('Production build validation failed');
  }

  // 3) Start server
  log('server', 'Starting server');
  const server = spawn('npm', ['run', 'start'], { shell: true, stdio: 'pipe' });
  server.on('error', (e) => log('server', `error: ${e.message}`));
  try {
    await waitOn('http://localhost:3000');
  } catch (e) {
    server.kill('SIGTERM');
    throw e;
  }
  log('server', 'Server is up at http://localhost:3000');

  let failed = false;
  const runTest = async (name, file) => {
    log('test', `Running ${name}`);
    const res = await run('node', [path.join(testsDir, file)]);
    if (res.code !== 0) {
      failed = true;
      process.stderr.write(res.out + res.err);
      log('fail', `${name} failed`);
    } else {
      log('pass', `${name} passed`);
    }
  };

  // 4) Sequential tests
  await runTest('Service Worker Caching Validation', 'service-worker-caching-validation.js');
  await runTest('PWA Installation Testing', 'pwa-installation-testing.js');
  await runTest('Offline Functionality Testing', 'offline-functionality-testing.js');
  await runTest('Lighthouse PWA Audit Runner', 'lighthouse-pwa-audit-runner.js');

  // 5) Cleanup
  server.kill('SIGTERM');

  if (failed) throw new Error('One or more PWA integration tests failed');
  log('result', 'All PWA integration tests passed');
}

main().catch((err) => {
  console.error('[pwa-integration] FAILED:', err.message);
  process.exit(1);
});


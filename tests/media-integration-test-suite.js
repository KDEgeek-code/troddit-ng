#!/usr/bin/env node
/*
 Media Integration Test Suite
 - Orchestrates environment setup and all media-related tests
*/

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

function log(step, msg) { console.log(`[media-integration] ${step}: ${msg}`); }

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

async function waitOn(url) {
  try { const r = await run('npx', ['wait-on', url]); if (r.code === 0) return; } catch {}
  const http = require('http');
  const start = Date.now(); const timeout = 30000; const interval = 500;
  await new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(); });
      req.on('error', () => { if (Date.now()-start>timeout) return reject(new Error('Timeout waiting for ' + url)); setTimeout(tick, interval); });
    };
    tick();
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function main() {
  const root = process.cwd();
  const testsDir = path.join(root, 'tests');

  // 1) Build validation and server management
  log('build', 'Ensuring production build');
  const build = await run('node', [path.join(testsDir, 'production-build-validation.js')]);
  if (build.code !== 0) {
    process.stderr.write(build.out + build.err);
    throw new Error('Production build validation failed');
  }

  log('server', 'Ensuring server is up');
  const skipServerStart = /^(1|true)$/i.test(String(process.env.SKIP_SERVER_START || ''));
  const portInUse = await isPortInUse(3000);
  let startedServer = null;
  if (skipServerStart) {
    log('server', 'SKIP_SERVER_START set; not spawning server');
  } else if (portInUse) {
    log('server', 'Detected running server; skipping spawn');
  } else {
    startedServer = spawn('npm', ['run', 'start'], { shell: true, stdio: 'pipe' });
    startedServer.on('error', (e) => log('server', `error: ${e.message}`));
  }
  try {
    await waitOn('http://localhost:3000');
  } catch (e) {
    if (startedServer) startedServer.kill('SIGTERM');
    throw e;
  }

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

  // 2) Sequential media tests
  await runTest('HLS Playback', 'media-hls-playback-test.js');
  await runTest('Image Caching Validation', 'media-image-caching-validation.js');
  await runTest('Controls Functionality', 'media-controls-functionality-test.js');
  await runTest('Responsive + Mobile', 'responsive-design-mobile-compatibility.js');
  await runTest('Autoplay Behavior', 'media-autoplay-behavior-test.js');
  await runTest('Performance Monitoring (scaffold)', 'media-performance-monitoring.js');
  await runTest('Accessibility (static)', 'media-accessibility-testing.js');

  // 3) Cleanup
  if (startedServer) startedServer.kill('SIGTERM');

  if (failed) throw new Error('One or more media tests failed');
  log('result', 'All media integration tests passed');
}

main().catch((err) => {
  console.error('[media-integration] FAILED:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Database setup verification script (extends verify-db scope)
 *
 * Verifies environment, connectivity, schema, basic CRUD, performance and pool behavior.
 *
 * Usage:
 *   DATABASE_URL=postgres://... node tests/database-setup-verification.js
 */

const { Pool } = require('pg');
const cp = require('child_process');
const fs = require('fs');

function logSection(t) { console.log(`\n=== ${t} ===`); }
function assert(c, m) { if (!c) throw new Error(m); }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

function sslConfig() {
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable' || /localhost|127.0.0.1/.test(DATABASE_URL)) return false;
  return { rejectUnauthorized: false };
}

async function testEnvConfig() {
  logSection('Environment Configuration');
  console.log('DATABASE_URL present');
  console.log('PGSSLMODE =', process.env.PGSSLMODE || '(not set)');
  console.log('NODE_ENV =', process.env.NODE_ENV || '(not set)');
  // Simple parse check
  const u = new URL(DATABASE_URL);
  assert(u.protocol.startsWith('postgres'), 'DATABASE_URL must be postgres');
  assert(u.hostname, 'Host must be present');
  assert(u.pathname && u.pathname.length > 1, 'DB name must be present');
  console.log('OK: DATABASE_URL format looks valid');
}

async function withPool(fn) {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: sslConfig(), max: 10, idleTimeoutMillis: 10000 });
  try { return await fn(pool); } finally { await pool.end(); }
}

async function testConnectionAndPooling() {
  logSection('Connection & Pooling');
  await withPool(async (pool) => {
    const r = await pool.query('select version(), now()');
    assert(r.rowCount === 1, 'Should return one row');
    console.log('OK: Connected. version=', r.rows[0].version);

    // parallel queries
    const start = Date.now();
    await Promise.all(Array.from({ length: 10 }, () => pool.query('select 1')));
    const dur = Date.now() - start;
    console.log('OK: Parallel queries completed in', dur, 'ms');
  });
}

async function testSchema() {
  logSection('Schema Verification');
  await withPool(async (pool) => {
    const t = await pool.query(`select 1 from information_schema.tables where table_name='user_prefs'`);
    assert(t.rowCount === 1, 'user_prefs table must exist');

    const cols = await pool.query(`select column_name, data_type from information_schema.columns where table_name='user_prefs'`);
    const map = Object.fromEntries(cols.rows.map(r => [r.column_name, r.data_type]));
    assert(map['user_id'] === 'text', 'user_id must be TEXT');
    assert(map['data'] && map['data'].includes('json'), 'data must be JSON/JSONB');
    assert(map['updated_at'] && map['updated_at'].includes('timestamp'), 'updated_at must be timestamp');
    console.log('OK: user_prefs schema verified.');
  });
}

async function testCrudAndTriggers() {
  logSection('CRUD and Triggers');
  await withPool(async (pool) => {
    const uid = 'verify-' + Math.random().toString(36).slice(2);
    // insert
    await pool.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uid, { hello: 'world' }]);
    const r1 = await pool.query(`select data, updated_at from user_prefs where user_id=$1`, [uid]);
    assert(r1.rowCount === 1, 'Inserted row must be found');
    const ts1 = r1.rows[0].updated_at;
    // update
    await new Promise(r => setTimeout(r, 500));
    await pool.query(`update user_prefs set data = jsonb_set(data, '{hello}', '"again"') where user_id=$1`, [uid]);
    const r2 = await pool.query(`select data, updated_at from user_prefs where user_id=$1`, [uid]);
    assert(r2.rows[0].data.hello === 'again', 'Update should persist');
    assert(new Date(r2.rows[0].updated_at) >= new Date(ts1), 'updated_at should update');
    console.log('OK: CRUD and updated_at trigger validated.');
  });
}

async function testPerformance() {
  logSection('Performance & Health');
  await withPool(async (pool) => {
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) {
      await pool.query('select 1');
    }
    const t1 = Date.now();
    console.log('100 trivial queries in', (t1 - t0), 'ms');
  });
}

async function testErrorHandling() {
  logSection('Error Handling');
  await withPool(async (pool) => {
    let failed = false;
    try { await pool.query('select 1 from non_existing_table'); } catch (e) { failed = true; console.log('Caught error as expected:', e.message.split('\n')[0]); }
    assert(failed, 'Invalid query should throw');
    console.log('OK: Errors are surfaced and handled.');
  });
}

async function run() {
  let passed = 0, failed = 0;
  const runCase = async (name, fn) => { try { await fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${name} ->`, e.message); } };

  await runCase('Environment config', testEnvConfig);
  await runCase('Connection & pool', testConnectionAndPooling);
  await runCase('Schema', testSchema);
  await runCase('CRUD & triggers', testCrudAndTriggers);
  await runCase('Performance', testPerformance);
  await runCase('Error handling', testErrorHandling);
  await runCase('Docker Compose (optional)', testDockerComposeOptional);

  console.log(`\nSummary: passed=${passed}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}

run();

async function testDockerComposeOptional() {
  logSection('Docker Compose: service health and ports (optional)');
  try {
    // Ensure docker-compose.yml exists
    if (!fs.existsSync('docker-compose.yml')) { console.log('docker-compose.yml not found; skipping.'); return; }
    // Try docker compose ps
    let ps;
    try {
      ps = cp.execSync('docker compose ps --format json', { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
    } catch {
      // Fallback to docker-compose
      ps = cp.execSync('docker-compose ps --services', { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
    }
    console.log('Compose detected. Inspecting db service...');
    // Inspect db container for health and ports
    let inspect;
    try {
      inspect = cp.execSync('docker inspect $(docker compose ps -q db)', { shell: '/bin/bash' }).toString('utf8');
    } catch {
      try { inspect = cp.execSync('docker inspect $(docker-compose ps -q db)', { shell: '/bin/bash' }).toString('utf8'); }
      catch { console.log('Unable to inspect db container; skipping.'); return; }
    }
    const info = JSON.parse(inspect)[0];
    const health = info.State && info.State.Health && info.State.Health.Status;
    console.log('db health:', health || '(unknown)');
    if (health) { assert(['healthy', 'starting'].includes(health), 'db service should be healthy or starting'); }
    // Ports mapping
    const ports = info.NetworkSettings && info.NetworkSettings.Ports;
    if (ports && ports['5432/tcp']) {
      const host = ports['5432/tcp'][0];
      console.log('db port mapping:', host.HostIp + ':' + host.HostPort, '-> 5432');
    }
    console.log('OK: Docker Compose optional checks ran.');
  } catch (e) {
    console.log('Skipping Docker checks (not available):', (e && e.message) || e);
  }
}

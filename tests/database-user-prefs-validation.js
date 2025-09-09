#!/usr/bin/env node
/**
 * Database validation script for user preferences storage
 *
 * Focus areas:
 * - Connection + SSL + pooling (via pg)
 * - Schema: user_prefs table, columns, PK, indexes
 * - Triggers: updated_at, size limit
 * - JSONB insert/retrieve/update, UPSERT
 * - Concurrency, transactions, error handling
 *
 * Usage:
 *   DATABASE_URL=postgres://... node tests/database-user-prefs-validation.js
 */

const { Client, Pool } = require('pg');

function logSection(t) { console.log(`\n=== ${t} ===`); }
function assert(c, m) { if (!c) throw new Error(m); }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

async function withClient(fn) {
  const client = new Client({ connectionString: DATABASE_URL, ssl: sslConfig() });
  try { await client.connect(); return await fn(client); } finally { await client.end(); }
}

function sslConfig() {
  // Rely on DATABASE_URL and env like PGSSLMODE; if PGSSLMODE=disable, turn off ssl
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable' || /localhost|127.0.0.1/.test(DATABASE_URL)) return false;
  return { rejectUnauthorized: false };
}

async function testConnection() {
  logSection('DB Connection');
  await withClient(async (c) => {
    const r = await c.query('select now() as now');
    assert(r.rows.length === 1, 'Should get a row');
    console.log('OK: Connected, now =', r.rows[0].now);
  });
}

async function testSchema() {
  logSection('Schema Validation');
  await withClient(async (c) => {
    const table = await c.query(`select 1 from information_schema.tables where table_name='user_prefs'`);
    assert(table.rowCount === 1, 'Table user_prefs must exist');

    const cols = await c.query(`select column_name, data_type from information_schema.columns where table_name='user_prefs'`);
    const def = Object.fromEntries(cols.rows.map(r => [r.column_name, r.data_type]));
    assert(def['user_id'] === 'text', 'user_id must be TEXT');
    assert(def['data'] && def['data'].includes('json'), 'data must be JSON/JSONB');
    assert(def['updated_at'] && def['updated_at'].includes('timestamp'), 'updated_at must be timestamp');

    const pk = await c.query(`select tc.constraint_name from information_schema.table_constraints tc where tc.table_name='user_prefs' and tc.constraint_type='PRIMARY KEY'`);
    assert(pk.rowCount === 1, 'Primary key must exist');

    const idx = await c.query(`select indexname from pg_indexes where tablename='user_prefs'`);
    assert(idx.rows.some(r => /updated_at/i.test(r.indexname)), 'Index on updated_at should exist');
    console.log('OK: Table, columns, PK, and index validated.');
  });
}

async function testTriggers() {
  logSection('Triggers Validation');
  await withClient(async (c) => {
    const trg = await c.query(`select tgname from pg_trigger t join pg_class c2 on t.tgrelid=c2.oid where c2.relname='user_prefs' and not t.tgisinternal`);
    assert(trg.rowCount >= 1, 'At least one trigger should be present');
    const names = trg.rows.map(r => r.tgname);
    console.log('Triggers:', names);
    // Expect specific trigger names from db/init.sql
    const expected = ['update_user_prefs_updated_at', 'check_user_prefs_data_size_trigger'];
    for (const name of expected) {
      assert(names.includes(name), `Expected trigger missing: ${name}`);
    }
    console.log('OK: Expected triggers present.');
  });
}

async function testJsonbOperations() {
  logSection('JSONB Insert/Retrieve/Update/Upsert');
  const uid = 'test-user-' + Math.random().toString(36).slice(2);
  await withClient(async (c) => {
    await c.query('begin');
    try {
      await c.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uid, { theme: 'light', nested: { a: 1 } }]);
      const r1 = await c.query(`select data from user_prefs where user_id=$1`, [uid]);
      assert(r1.rowCount === 1 && r1.rows[0].data.theme === 'light', 'Insert/Select JSONB works');

      // Update
      await c.query(`update user_prefs set data = jsonb_set(data, '{theme}', '"dark"') where user_id=$1`, [uid]);
      const r2 = await c.query(`select data from user_prefs where user_id=$1`, [uid]);
      assert(r2.rows[0].data.theme === 'dark', 'Update JSONB works');

      // Upsert
      await c.query(`insert into user_prefs (user_id, data) values ($1, $2) on conflict (user_id) do update set data=excluded.data`, [uid, { theme: 'blue' }]);
      const r3 = await c.query(`select data from user_prefs where user_id=$1`, [uid]);
      assert(r3.rows[0].data.theme === 'blue', 'Upsert works');

      await c.query('commit');
      console.log('OK: JSONB ops and upsert validated.');
    } catch (e) {
      await c.query('rollback');
      throw e;
    }
  });
}

async function testUpdatedAtTrigger() {
  logSection('Trigger: updated_at auto-update');
  const uid = 'test-ts-' + Math.random().toString(36).slice(2);
  await withClient(async (c) => {
    await c.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uid, { x: 1 }]);
    const a = await c.query(`select updated_at from user_prefs where user_id=$1`, [uid]);
    await new Promise(r => setTimeout(r, 1000));
    await c.query(`update user_prefs set data = jsonb_set(data, '{x}', '2') where user_id=$1`, [uid]);
    const b = await c.query(`select updated_at from user_prefs where user_id=$1`, [uid]);
    assert(new Date(b.rows[0].updated_at) > new Date(a.rows[0].updated_at), 'updated_at should advance on update');
    console.log('OK: updated_at trigger fires.');
  });
}

async function testSizeLimitEnforcement() {
  logSection('Trigger: size limit enforcement');
  const uid = 'test-size-' + Math.random().toString(36).slice(2);
  await withClient(async (c) => {
    const big = { blob: 'x'.repeat(101 * 1024) };
    let failed = false;
    try {
      await c.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uid, big]);
    } catch (e) {
      failed = true;
      console.log('Got expected error on oversized JSON:', e.message.split('\n')[0]);
    }
    assert(failed, 'Oversized JSON should be rejected by trigger');
    console.log('OK: Size limit enforced.');
  });
}

function byteLengthOfJson(obj) {
  return Buffer.byteLength(JSON.stringify(obj));
}

function makeSizedBlob(targetBytes) {
  // Create a { blob: 'x' * n } where JSON string length ~ targetBytes
  // Adjust iteratively for precise byte size considering JSON overhead
  let low = 0, high = targetBytes, best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const obj = { blob: 'x'.repeat(mid) };
    const len = byteLengthOfJson(obj);
    if (len === targetBytes) { return obj; }
    if (len < targetBytes) { best = mid; low = mid + 1; } else { high = mid - 1; }
  }
  return { blob: 'x'.repeat(best) };
}

async function testSizeBoundaryDeterministic() {
  logSection('Trigger: deterministic size boundaries (~99KB pass, ~101KB fail)');
  const uidOk = 'test-size-ok-' + Math.random().toString(36).slice(2);
  const uidBad = 'test-size-bad-' + Math.random().toString(36).slice(2);
  await withClient(async (c) => {
    // Accept just under 100KB (e.g., 99*1024 bytes)
    const okObj = makeSizedBlob(99 * 1024);
    const okSize = byteLengthOfJson(okObj);
    assert(okSize <= 100 * 1024, 'OK object should be <= 100KB');
    await c.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uidOk, okObj]);
    const r = await c.query(`select data from user_prefs where user_id=$1`, [uidOk]);
    assert(r.rowCount === 1, 'Row should insert under size limit');

    // Reject a bit over 100KB (e.g., 101*1024 bytes)
    const badObj = makeSizedBlob(101 * 1024);
    const badSize = byteLengthOfJson(badObj);
    assert(badSize > 100 * 1024, 'Bad object should exceed 100KB');
    let threw = false;
    try {
      await c.query(`insert into user_prefs (user_id, data) values ($1, $2)`, [uidBad, badObj]);
    } catch (e) {
      threw = true;
    }
    assert(threw, 'Insert over size limit should fail');
    console.log('OK: Deterministic size boundary checks passed (', okSize, 'bytes ok; ', badSize, 'bytes rejected ).');
  });
}

async function testConcurrency() {
  logSection('Concurrency: parallel upserts');
  const uid = 'test-conc-' + Math.random().toString(36).slice(2);
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: sslConfig(), max: 5 });
  try {
    const tasks = Array.from({ length: 5 }).map((_, i) => pool.query(
      `insert into user_prefs (user_id, data) values ($1, $2) on conflict (user_id) do update set data = jsonb_set(user_prefs.data, '{counter}', to_jsonb((coalesce((user_prefs.data->>'counter')::int, 0) + 1)))`,
      [uid, { counter: i }]
    ));
    await Promise.all(tasks);
    const r = await pool.query(`select data from user_prefs where user_id=$1`, [uid]);
    assert(r.rowCount === 1, 'Row must exist');
    assert(typeof r.rows[0].data.counter === 'number', 'Counter should be a number');
    console.log('OK: Concurrency upserts succeeded; final data:', r.rows[0].data);
  } finally {
    await pool.end();
  }
}

async function run() {
  let passed = 0, failed = 0;
  const runCase = async (name, fn) => { try { await fn(); passed++; } catch (e) { failed++; console.error(`FAIL: ${name} ->`, e.message); } };

  await runCase('DB connection', testConnection);
  await runCase('Schema', testSchema);
  await runCase('Triggers exist', testTriggers);
  await runCase('JSONB ops & upsert', testJsonbOperations);
  await runCase('updated_at trigger', testUpdatedAtTrigger);
  await runCase('Size limit trigger', testSizeLimitEnforcement);
  await runCase('Size boundary deterministic', testSizeBoundaryDeterministic);
  await runCase('Concurrency', testConcurrency);

  console.log(`\nSummary: passed=${passed}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}

run();

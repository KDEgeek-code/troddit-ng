#!/usr/bin/env ts-node
/**
 * Small harness to exercise app's db.ts connection lifecycle
 * Usage: DATABASE_URL=postgres://... npm run test:db-app-module
 */

import pool, { query } from '../src/server/db';

async function main() {
  try {
    const res = await query('select 1 as one');
    if (res.rowCount !== 1 || res.rows[0].one !== 1) {
      throw new Error('Unexpected result from select 1');
    }
    console.log('OK: db.ts query works (select 1).');
  } catch (e: any) {
    console.error('FAIL: db.ts query failed ->', e?.message || e);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch {}
  }
}

main();


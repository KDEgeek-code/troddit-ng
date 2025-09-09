#!/usr/bin/env node
/*
 PWA Performance Monitoring
 - Executes Lighthouse and extracts PWA-relevant performance metrics
 - Generates a concise metrics report for trend tracking
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function log(step, msg) { console.log(`[pwa-perf] ${step}: ${msg}`); }

const REPORT_DIR = path.join(process.cwd(), 'tests', 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

function runLighthouse(url) {
  return new Promise((resolve) => {
    const jsonOut = path.join(REPORT_DIR, `perf-${Date.now()}.json`);
    const args = [
      'lighthouse', url,
      '--output=json', `--output-path=${jsonOut}`,
      '--quiet',
      '--throttling-method=simulate',
      '--only-categories=performance,pwa',
      `--config-path=./tests/lighthouse-config.json`
    ];
    const child = spawn('npx', args, { shell: true });
    let err = '';
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) log('warn', `Lighthouse exit ${code}: ${err.trim()}`);
      try {
        const json = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
        resolve({ jsonOut, json });
      } catch (_) {
        resolve(null);
      }
    });
  });
}

function extractMetrics(lh) {
  const audits = lh.audits || {};
  const metric = (id) => audits[id] && audits[id].numericValue;
  const score = (cat) => lh.categories[cat] ? Math.round((lh.categories[cat].score || 0) * 100) : null;
  return {
    pwaScore: score('pwa'),
    perfScore: score('performance'),
    LCP: metric('largest-contentful-paint'),
    CLS: metric('cumulative-layout-shift'),
    TBT: metric('total-blocking-time'),
    TTI: metric('interactive'),
    FCP: metric('first-contentful-paint'),
  };
}

async function main() {
  const url = process.env.PERF_URL || 'http://localhost:3000';
  const runs = Number(process.env.PERF_RUNS || 1);
  const rows = [];
  for (let i = 1; i <= runs; i++) {
    log('run', `Perf iteration ${i}`);
    const res = await runLighthouse(url);
    if (!res) continue;
    const metrics = extractMetrics(res.json);
    rows.push({ iteration: i, ...metrics });
  }
  const csv = ['iteration,pwaScore,perfScore,LCP,CLS,TBT,TTI,FCP']
    .concat(rows.map(r => [r.iteration, r.pwaScore, r.perfScore, r.LCP, r.CLS, r.TBT, r.TTI, r.FCP].join(',')))
    .join('\n');
  const out = path.join(REPORT_DIR, 'pwa-performance-metrics.csv');
  fs.writeFileSync(out, csv);
  log('output', `Metrics CSV: ${out}`);
  log('result', 'Performance monitoring completed');
}

main().catch((err) => {
  console.error('[pwa-perf] FAILED:', err.message);
  process.exit(1);
});


#!/usr/bin/env node
/*
 Lighthouse PWA Audit Runner
 - Runs multiple PWA audits, aggregates scores, and enforces thresholds
 - Outputs HTML and JSON reports under tests/reports
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function log(step, msg) { console.log(`[lighthouse-runner] ${step}: ${msg}`); }

const REPORT_DIR = path.join(process.cwd(), 'tests', 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

function runLighthouseOnce(url, idx) {
  return new Promise((resolve) => {
    const htmlOut = path.join(REPORT_DIR, `lighthouse-pwa-${idx}.html`);
    const jsonOut = path.join(REPORT_DIR, `lighthouse-pwa-${idx}.json`);
    const args = [
      'lighthouse', url,
      '--only-categories=pwa',
      `--config-path=./tests/lighthouse-config.json`,
      `--output=html`, `--output-path=${htmlOut}`,
      `--output=json`, `--output-path=${jsonOut}`,
      '--quiet'
    ];
    const child = spawn('npx', args, { shell: true });
    let err = '';
    child.stderr.on('data', d => { err += d.toString(); });
    child.on('close', (code) => {
      if (code !== 0) log('warn', `Run ${idx} exited ${code}. ${err.trim()}`);
      try {
        const json = JSON.parse(fs.readFileSync(jsonOut, 'utf8'));
        resolve(json);
      } catch (_) {
        resolve(null);
      }
    });
  });
}

function summarize(results) {
  const valid = results.filter(Boolean);
  const scores = valid.map(r => Math.round((r.categories.pwa.score || 0) * 100));
  const avg = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
  const min = scores.length ? Math.min(...scores) : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  return { count: results.length, ok: valid.length, avg, min, max, scores };
}

async function main() {
  const url = process.env.LH_URL || 'http://localhost:3000';
  const runs = Number(process.env.LH_RUNS || 2);
  const threshold = Number(process.env.PWA_THRESHOLD || 90);
  log('start', `Running Lighthouse PWA x${runs} on ${url} (threshold ${threshold})`);

  const results = [];
  for (let i = 1; i <= runs; i++) {
    log('run', `Iteration ${i}`);
    results.push(await runLighthouseOnce(url, i));
  }

  const summary = summarize(results);
  log('summary', `scores=${summary.scores.join(', ')} avg=${summary.avg.toFixed(1)} min=${summary.min} max=${summary.max}`);

  const csvPath = path.join(REPORT_DIR, 'lighthouse-pwa-summary.csv');
  fs.writeFileSync(csvPath, `scores,avg,min,max\n"${summary.scores.join(' ')}",${summary.avg.toFixed(1)},${summary.min},${summary.max}\n`);
  log('output', `Summary CSV: ${csvPath}`);

  if (summary.min < threshold) {
    throw new Error(`PWA score below threshold: min=${summary.min} < ${threshold}`);
  }

  log('result', 'Lighthouse PWA audits passed threshold');
}

main().catch((err) => {
  console.error('[lighthouse-runner] FAILED:', err.message);
  process.exit(1);
});


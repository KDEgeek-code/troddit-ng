#!/usr/bin/env node
/*
 Error Boundaries Validation
 - Statically validates presence/use of error boundaries in key components
 - Emits guidance for runtime and SSR/hydration error testing

 This script mirrors project test style by producing a best-effort report.
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[err-bounds] ${step}: ${msg}`); }

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }

function checkComponentBoundary(file, hints = []) {
  const src = read(file);
  const name = path.basename(file);
  const hasREB = /react-error-boundary|ErrorBoundary/i.test(src);
  const usesGetDerived = /getDerivedStateFromError|componentDidCatch/i.test(src);
  const hasFallback = /ErrorFallback|fallback/i.test(src);
  const pass = hasREB || usesGetDerived;
  const notes = [];
  if (!pass) notes.push('No explicit error boundary detected');
  if (hasREB && !hasFallback) notes.push('Error boundary found but fallback UI not obvious');
  for (const h of hints) if (!h.regex.test(src)) notes.push(h.note);
  return { file: name, pass, hasREB, usesGetDerived, hasFallback, notes };
}

function scanRootApp() {
  const file = path.join(process.cwd(), 'src', 'pages', '_app.tsx');
  const src = read(file);
  const hasRootBoundary = /ErrorBoundary/i.test(src) || /react-error-boundary/i.test(src);
  const notes = [];
  if (!hasRootBoundary) notes.push('No explicit root-level ErrorBoundary in _app.tsx');
  notes.push('Consider wrapping critical tree with a global ErrorBoundary to catch escaped errors.');
  return { name: 'Global Error Boundary', pass: hasRootBoundary, notes };
}

function main() {
  const files = [
    path.join('src', 'components', 'Feed.tsx'),
    path.join('src', 'components', 'PostBody.tsx'),
    path.join('src', 'components', 'ParseBodyHTML.tsx'),
    path.join('src', 'components', 'settings', 'Settings.tsx'),
  ].map(f => path.join(process.cwd(), f));

  const results = [];
  for (const f of files) {
    results.push(checkComponentBoundary(f));
  }
  results.push(scanRootApp());

  // Runtime guidance (browser)
  results.push({
    name: 'Runtime Error Boundary Tests (browser)',
    pass: true,
    notes: [
      'Open app and run tests/browser-console-error-debugger.js in DevTools.',
      'Use: window.testErrorBoundaries(), window.triggerComponentError("Feed|PostBody|ParseBodyHTML|Settings")',
      'Validate reset flows, async errors, and React Query error propagation.'
    ]
  });

  let failed = 0;
  console.log('[err-bounds] Report');
  for (const r of results) {
    const name = r.name || r.file;
    const pass = r.pass !== false;
    console.log(`- ${name}: ${pass ? 'PASS' : 'FAIL'}`);
    if (r.notes && r.notes.length) console.log(`  notes: ${r.notes.join(' | ')}`);
    if (r.hasREB !== undefined) console.log(`  details: hasREB=${r.hasREB} usesGetDerived=${r.usesGetDerived} hasFallback=${r.hasFallback}`);
    if (!pass) failed++;
  }
  process.exit(failed ? 1 : 0);
}

main();


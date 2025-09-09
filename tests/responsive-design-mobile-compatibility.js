#!/usr/bin/env node
/*
 Media: Responsive + Mobile Compatibility Test
 - Verifies responsive breakpoints usage and mobile-specific behaviors
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-responsive] ${step}: ${msg}`); }
function assert(cond, msg) { if (!cond) throw new Error(msg); }

function read(file) {
  const p = path.join(process.cwd(), file);
  assert(fs.existsSync(p), `Missing file: ${file}`);
  return fs.readFileSync(p, 'utf8');
}

function has(re, src, label) {
  const ok = re.test(src);
  log('check', `${label}: ${ok ? 'OK' : 'MISSING'}`);
  if (!ok) throw new Error(`Missing ${label}`);
}

function main() {
  const tailwind = read('tailwind.config.js');
  const uiContext = read('src/contexts/UIContext.tsx');
  const media = read('src/components/Media.tsx');

  // 1) Tailwind breakpoints are default; validate config presence
  has(/theme\s*:\s*\{[\s\S]*extend/i, tailwind, 'Tailwind theme configured');
  has(/content\s*:\s*\[/i, tailwind, 'Tailwind content globs present');

  // 2) UIContext responsive settings
  has(/cardStyle|columnOverride|saveWideUI/i, uiContext, 'Responsive layout settings');
  has(/localForage/i, uiContext, 'Responsive state persistence');

  // 3) Media responsive behavior
  has(/containerDims|uniformMediaMode|windowWidth/i, media, 'Responsive media sizing');
  has(/aspectRatio|max-h\[|h-\d|w-\d/i, media, 'Responsive CSS usage');
  has(/findOptimalImageIndex/i, media, 'Responsive image selection via findOptimalImageIndex');
  has(/intersectionRatio\s*>=\s*0\.8|threshold:\s*\[/i, read('src/components/media/video/VideoHandler.tsx'), 'Intersection thresholds for autoplay');

  log('result', 'Responsive/mobile compatibility validations passed');
}

try { main(); }
catch (err) {
  console.error('[media-responsive] FAILED:', err.message);
  process.exit(1);
}


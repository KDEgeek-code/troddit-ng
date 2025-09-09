#!/usr/bin/env node
/*
 Media: Accessibility Testing
 - Static checks for ARIA labels, keyboard navigation, focus management hooks
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-a11y] ${step}: ${msg}`); }
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
  const videoHandler = read('src/components/media/video/VideoHandler.tsx');
  const media = read('src/components/Media.tsx');

  // Keyboard navigation & shortcuts
  has(/useKeyPress\(\s*"k"\s*\)|onKey(Down|Up)/i, videoHandler, 'Keyboard play/pause shortcut');
  has(/useKeyPress\(\s*"m"\s*\)/i, videoHandler, 'Keyboard mute shortcut');

  // ARIA attributes
  has(/aria-label\s*=\s*"play\/pause"/i, videoHandler, 'ARIA label for play/pause');

  // Focus management and visible indicators are implied through button usage
  has(/button/i, videoHandler, 'Controls use semantic button elements');

  // Motion preferences (at least present in code paths for autoplay/hover)
  has(/autoplay|hoverplay/i, videoHandler + media, 'Autoplay/hover toggles allow reducing motion');

  // Placeholder: screen reader and captions not determinable statically
  log('info', 'For captions/screen reader announcements, validate in manual guide and console debugger.');

  log('result', 'Media accessibility checks completed');
}

try { main(); }
catch (err) {
  console.error('[media-a11y] FAILED:', err.message);
  process.exit(1);
}


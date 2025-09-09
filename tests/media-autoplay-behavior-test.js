#!/usr/bin/env node
/*
 Media: Autoplay Behavior Test
 - Validates autoplay logic, mute fallback, intersection observer, and context wiring
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-autoplay] ${step}: ${msg}`); }
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
  const mediaContext = read('src/contexts/MediaContext.tsx');

  // Autoplay policy: try unmuted, fallback to muted when blocked
  has(/play\(\)\s*\.\s*then\(/i, videoHandler, 'Autoplay promise handling');
  has(/catch\s*\(\s*\w+\s*\)\s*=>[\s\S]*(setMuted\(true\)|video\s*\.\s*muted\s*=\s*true|muted\s*=\s*true)/i, videoHandler, 'Autoplay mute fallback on failure');

  // Intersection observer triggers
  has(/useInView|intersectionRatio/i, videoHandler, 'IntersectionObserver in use');

  // Context-based toggles
  has(/autoplay|autoPlayMode|audioOnHover/i, mediaContext + videoHandler, 'Autoplay settings present');

  // Mobile considerations (windowWidth checks)
  has(/useWindowWidth|windowWidth/i, videoHandler, 'Viewport-aware autoplay logic');

  log('result', 'Autoplay behavior validations passed');
}

try { main(); }
catch (err) {
  console.error('[media-autoplay] FAILED:', err.message);
  process.exit(1);
}

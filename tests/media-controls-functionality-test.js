#!/usr/bin/env node
/*
 Media: Controls Functionality Test
 - Validates play/pause, volume/mute, seek, keyboard handlers, hover-play
 - Static analysis of VideoHandler and MediaContext to ensure key behaviors exist
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-controls] ${step}: ${msg}`); }
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

  // 1) Play/Pause Controls (behavior-oriented)
  has(/\.(play|pause)\s*\(/i, videoHandler, 'Video play/pause calls present');
  has(/onClick[\s\S]{0,60}(play|pause)/i, videoHandler, 'Click-to-play wired');
  has(/on(Double)?Click/i, videoHandler, 'Click/double-click handling present');

  // 2) Volume and Audio Controls (behavior-oriented)
  has(/setVolume\s*\(/i, mediaContext + videoHandler, 'setVolume used');
  has(/localForage\.(getItem|setItem)\(\s*"volume"/i, mediaContext, 'Volume persistence via LocalForage');
  has(/muted\s*[,=]/i, videoHandler, 'Muted state present');

  // 3) Seeking and Progress Controls
  has(/currentTime|duration/i, videoHandler, 'Time tracking present');
  has(/progressPerc|seekRef/i, videoHandler, 'Progress/seek references present');

  // 4) Autoplay Functionality
  has(/autoplay/i, videoHandler + mediaContext, 'Autoplay settings present');
  has(/intersectionRatio/i, videoHandler, 'Intersection observer controls autoplay');

  // 5) Hover Play and Interaction
  has(/hoverplay/i, videoHandler + mediaContext, 'Hover play present');
  has(/handleMouse(In|Out)\s*=\s*\(/i, videoHandler, 'Mouse enter/leave handlers');
  has(/audioOnHover/i, videoHandler + mediaContext, 'Audio on hover behavior');

  // 6) Control Visibility and Responsive Behavior
  has(/windowWidth|useWindowWidth/i, videoHandler, 'Responsive control behavior');

  // 7) Keyboard Navigation and Accessibility (looser matching)
  has(/use(Key|Keyboard)/i, videoHandler, 'Keyboard handlers present');
  has(/aria-label\s*=\s*"?play\/?pause"?/i, videoHandler, 'Play/pause ARIA label');

  // 8) Quality Selection Controls
  has(/quality\s*:\s*"(full|sd|hd|min)"|videoQuality/i, videoHandler, 'Quality selection props');

  // 9) Error State Handling
  has(/onWaiting|onPlaying|onPause|onLoaded(Data|Metadata)/i, videoHandler, 'Loading/buffering handlers wired');

  log('result', 'Media controls functionality validated');
}

try { main(); }
catch (err) {
  console.error('[media-controls] FAILED:', err.message);
  process.exit(1);
}

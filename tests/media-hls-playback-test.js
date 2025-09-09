#!/usr/bin/env node
/*
 Media: HLS Playback Test
 - Static and semi-dynamic checks for HLS.js integration
 - Validates configuration patterns, quality selection, error recovery hooks
 - Integrates with VideoHandler for control props surface checks
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-hls] ${step}: ${msg}`); }
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
  const hlsPlayer = read('src/components/media/video/HLSPlayer.tsx');
  const videoHandler = read('src/components/media/video/VideoHandler.tsx');

  // 1) HLS.js Library Integration
  has(/Hls\s*\.\s*isSupported\s*\(/, hlsPlayer, 'Hls.isSupported() detection');
  has(/new\s+Hls\s*\(/, hlsPlayer, 'Hls instance construction');
  has(/hls\.?loadSource\s*\(/i, hlsPlayer, 'hls.loadSource configured');
  has(/attachMedia\s*\(/i, hlsPlayer, 'hls.attachMedia configured');
  has(/video\s*\.\s*canPlayType\(\s*['\"]application\/(vnd\.apple\.mpegurl|x-mpegURL)['\"]\s*\)/i, hlsPlayer, 'Native HLS fallback');

  // 2) Quality Selection
  has(/selectLevel\s*\(/, hlsPlayer, 'selectLevel() implementation');
  has(/auto\s*:\s*true|autoQuality/i, hlsPlayer + videoHandler, 'auto quality behavior present');
  has(/(full|hd|sd|min)/i, hlsPlayer, 'quality aliases referenced');

  // 3) Manifest Processing and Audio Detection
  has(/manifestParsed|MANIFEST_PARSED/i, hlsPlayer, 'manifest parsed handling');
  has(/audio|hasAudio|triggerHasAudio/i, hlsPlayer, 'audio track detection / callback');

  // 4) Autoplay + Mute Handling
  has(/autoplay/i, videoHandler + hlsPlayer, 'autoplay logic present');
  has(/mut(e|ed)/i, videoHandler + hlsPlayer, 'mute fallback behavior');

  // 5) Error Recovery and Resilience
  has(/Hls\s*\.\s*ErrorTypes\s*\.\s*NETWORK_ERROR/i, hlsPlayer, 'NETWORK_ERROR handling');
  has(/recover(Media|)Error\s*\(/i, hlsPlayer, 'recoverMediaError() present');
  has(/fatal/i, hlsPlayer, 'fatal error handling');

  // 6) Cleanup and Destruction
  has(/destroy\s*\(\)/i, hlsPlayer, 'hls.destroy() on cleanup');

  // 7) Integration with VideoHandler
  has(/poster|thumbnail/i, videoHandler, 'poster/thumbnail handling');
  has(/on(Play|Pause|TimeUpdate|Waiting|Error)/i, videoHandler, 'video event handlers connected');

  // Additional sanity checks
  log('info', `HLSPlayer.tsx size: ${hlsPlayer.length} bytes`);
  log('info', `VideoHandler.tsx size: ${videoHandler.length} bytes`);

  log('result', 'HLS integration patterns validated');
}

try { main(); }
catch (err) {
  console.error('[media-hls] FAILED:', err.message);
  process.exit(1);
}

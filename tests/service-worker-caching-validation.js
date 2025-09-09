#!/usr/bin/env node
/*
 Service Worker Caching Validation
 - Static verification of generated sw.js against next.config.js strategies
 - Confirms presence of NetworkFirst/CacheFirst rules and rangeRequest support
*/

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function log(step, msg) {
  console.log(`[sw-caching-validation] ${step}: ${msg}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function readSw() {
  const swPath = path.join(PUBLIC_DIR, 'sw.js');
  assert(fs.existsSync(swPath), 'sw.js not found. Run a production build first.');
  return fs.readFileSync(swPath, 'utf8');
}

function has(pattern, target, label) {
  const ok = pattern.test(target);
  log('check', `${label}: ${ok ? 'OK' : 'MISSING'}`);
  if (!ok) throw new Error(`Missing ${label}`);
}

function main() {
  const sw = readSw();
  log('info', `sw.js size: ${sw.length} bytes`);

  // Core strategies
  has(/NetworkFirst/i, sw, 'NetworkFirst strategy present');
  has(/CacheFirst/i, sw, 'CacheFirst strategy present');

  // Reddit API caching rules
  has(/reddit-api-cache/i, sw, 'reddit-api-cache present');
  has(/reddit-oauth-cache/i, sw, 'reddit-oauth-cache present');
  has(/internal-reddit-api-cache/i, sw, 'internal-reddit-api-cache present');

  // Media and video caching (range requests, status 206)
  has(/reddit-videos-cache/i, sw, 'reddit-videos-cache present');
  // Broaden detection: look for RangeRequestsPlugin or workbox-range-requests to allow for minified/output variants
  has(/(RangeRequestsPlugin|workbox-range-requests)/i, sw, 'range request support present');
  has(/statuses\W*:\W*\[\s*0\s*,\s*200\s*,\s*206\s*\]/i, sw, '206 cacheable status present');

  // Known media caches (spot-checks)
  const mediaCaches = [
    'reddit-images-cache', 'reddit-previews-cache', 'reddit-external-previews-cache',
    'reddit-static-cache', 'redditmedia-images-cache', 'imgur-cache', 'gfycat-thumbs-cache',
    'youtube-thumbnails-cache', 'redgifs-cache'
  ];
  mediaCaches.forEach(name => has(new RegExp(name, 'i'), sw, `${name} present`));

  // Expiration and quotas
  has(/maxAgeSeconds\W*:\W*30\s*\*\s*24\s*\*\s*60\s*\*\s*60/i, sw, '30-day expiration configured');
  has(/purgeOnQuotaError\W*:\W*true/i, sw, 'purgeOnQuotaError enabled');

  // Basic sanity on routes from next.config.js
  has(/v\.redd\.it/i, sw, 'v.redd.it video rule');
  has(/i\.redd\.it/i, sw, 'i.redd.it image rule');
  has(/preview\.redd\.it/i, sw, 'preview.redd.it rule');
  has(/external-preview\.redd\.it/i, sw, 'external-preview.redd.it rule');
  has(/i\.imgur\.com/i, sw, 'i.imgur.com rule');
  has(/(?:redgifs|gfycat)/i, sw, 'redgifs/gfycat rules');

  // Specific range support validations for gfycat/redgifs video rules
  function hasNear(anchorRe, nearRe, distance, label) {
    const idx = sw.search(anchorRe);
    const ok = idx >= 0 && (function () {
      const start = Math.max(0, idx - distance);
      const end = Math.min(sw.length, idx + distance);
      const slice = sw.slice(start, end);
      return nearRe.test(slice);
    })();
    log('check', `${label}: ${ok ? 'OK' : 'MISSING'}`);
    if (!ok) throw new Error(`Missing ${label}`);
  }

  // Ensure giant.gfycat.com rule includes 206 status and video destination nearby
  has(/giant\.gfycat\.com/i, sw, 'giant.gfycat.com rule');
  hasNear(/giant\.gfycat\.com/i, /statuses\W*:\W*\[\s*0\s*,\s*200\s*,\s*206\s*\]/i, 1200, 'gfycat 206 cacheable status');
  hasNear(/giant\.gfycat\.com/i, /destination\W*:\W*['\"]?video['\"]?/i, 1200, 'gfycat video destination');

  // Ensure *.redgifs.com rule includes 206 status and video destination nearby
  has(/redgifs\.com/i, sw, 'redgifs rule');
  hasNear(/redgifs\.com/i, /statuses\W*:\W*\[\s*0\s*,\s*200\s*,\s*206\s*\]/i, 1200, 'redgifs 206 cacheable status');
  hasNear(/redgifs\.com/i, /destination\W*:\W*['\"]?video['\"]?/i, 1200, 'redgifs video destination');

  log('result', 'Service worker caching configuration validated in sw.js');
}

try {
  main();
} catch (err) {
  console.error('[sw-caching-validation] FAILED:', err.message);
  process.exit(1);
}

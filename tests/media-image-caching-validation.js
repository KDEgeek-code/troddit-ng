#!/usr/bin/env node
/*
 Media: Image Caching Validation
 - Verifies image/service worker caching strategies and image selection helpers
*/

const fs = require('fs');
const path = require('path');

function log(step, msg) { console.log(`[media-images] ${step}: ${msg}`); }
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
  const nextConfig = read('next.config.js');
  const utils = read('lib/utils.ts');

  // 1) Service Worker Media Caching (CacheFirst image domains)
  const imageDomains = [
    'i.redd.it', 'preview.redd.it', 'external-preview.redd.it',
    'www.redditstatic.com', 'i.redditmedia.com', 'i.imgur.com',
    'thumbs.gfycat.com', 'i.ytimg.com'
  ];
  imageDomains.forEach(d => has(new RegExp(d.replace(/\./g, '\\.'), 'i'), nextConfig, `${d} rule present`));
  has(/redgifs\.com/i, nextConfig, 'RedGifs domain referenced');
  has(/\*\.redgifs\.com/i, nextConfig, 'RedGifs wildcard pattern referenced');

  // CacheFirst handler presence for media-generated rules
  has(/handler\s*:\s*("CacheFirst"|'CacheFirst'|CacheFirst|new\s+workbox\.[\w.]*CacheFirst)/i, nextConfig, 'CacheFirst handler present');

  // Range request support and 206 statuses for video caches (for completeness)
  has(/statuses\W*:\W*\[\s*0\s*,\s*200\s*,\s*206\s*\]/i, nextConfig, '206 status cacheable for range requests');

  // Expiration
  has(/maxAgeSeconds\W*:\W*30\s*\*\s*24\s*\*\s*60\s*\*\s*60/i, nextConfig, '30 day expiration present');
  has(/maxEntries\W*:\W*(50|100|200)/i, nextConfig, 'maxEntries set for caches');

  // 2) Image Optimization and Loading Utilities
  has(/export\s+const\s+findOptimalImageIndex\s*=\s*\(/, utils, 'findOptimalImageIndex() defined');
  has(/imageInfo|galleryInfo/i, utils, 'image info structures present');

  // 3) CSP checks: warn unless headers() defines CSP
  const hasHeaders = /async\s+headers\s*\(\)/.test(nextConfig);
  if (hasHeaders) {
    has(/img-src[^\n]+i\.redd\.it/i, nextConfig, 'CSP img-src includes i.redd.it');
    has(/img-src[^\n]+i\.imgur\.com/i, nextConfig, 'CSP img-src includes i.imgur.com');
    has(/img-src[^\n]+redgifs/i, nextConfig, 'CSP img-src includes redgifs');
  } else {
    log('info', 'CSP not set in next.config.js; skipping strict checks');
  }

  log('result', 'Image caching strategies and utilities validated');
}

try { main(); }
catch (err) {
  console.error('[media-images] FAILED:', err.message);
  process.exit(1);
}

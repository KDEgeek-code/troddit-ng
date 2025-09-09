/*
 Paste this entire file into the browser DevTools Console while Troddit is running.
 It exposes window.* helpers to inspect, test and debug media functionality in real-time.
*/
(function () {
  const log = (...a) => console.log('[media-console]', ...a);
  const warn = (...a) => console.warn('[media-console]', ...a);
  const err = (...a) => console.error('[media-console]', ...a);

  const state = {
    listeners: [],
    perf: { start: null, entries: [] },
  };

  function getVideos() {
    const vids = Array.from(document.querySelectorAll('video'));
    if (vids.length === 0) warn('No <video> elements found');
    return vids;
  }

  function getFirstVideo() { return getVideos()[0]; }

  function getHlsInstance(video) {
    // Best-effort: common attachment points used by apps
    const v = video || getFirstVideo();
    if (!v) return null;
    return v.__hls || v._hls || window.__lastHls || null;
  }

  function debugHLSEvents() {
    const v = getFirstVideo();
    if (!v) return;
    const Hls = window.Hls;
    if (!Hls) { warn('Hls not found on window'); return; }
    const hls = getHlsInstance(v);
    if (!hls) { warn('No Hls instance bound to video'); return; }
    const events = Hls.Events;
    const handler = (evt, data) => log('HLS evt', evt, data);
    Object.keys(events).forEach(k => {
      const e = events[k];
      const cb = (data) => handler(e, data);
      hls.on(e, cb);
      state.listeners.push({ hls, e, cb });
    });
    log('HLS event logging enabled');
  }

  function disableHLSEventDebug() {
    if (!state.listeners || state.listeners.length === 0) {
      warn('No HLS event listeners to remove');
      return;
    }
    state.listeners.forEach(({ hls, e, cb }) => {
      try { hls?.off?.(e, cb); } catch (ex) { /* noop */ }
    });
    state.listeners = [];
    log('HLS event logging disabled and listeners removed');
  }

  function inspectHLSPlayer() {
    const v = getFirstVideo();
    const Hls = window.Hls;
    const hls = getHlsInstance(v);
    const info = {
      hlsSupported: !!(Hls && Hls.isSupported && Hls.isSupported()),
      hasHls: !!hls,
      levels: hls?.levels?.map(l => ({ height: l.height, bitrate: l.bitrate, name: l.name })) || [],
      currentLevel: hls?.currentLevel,
      nextLevel: hls?.nextLevel,
      autoLevelEnabled: hls?.autoLevelEnabled,
      audioTracks: hls?.audioTracks?.length || 0,
      media: {
        src: v?.currentSrc,
        paused: v?.paused,
        muted: v?.muted,
        volume: v?.volume,
        readyState: v?.readyState,
      }
    };
    log('HLS Player:', info);
    return info;
  }

  function testHLSQuality(q) {
    const v = getFirstVideo();
    const hls = getHlsInstance(v);
    if (!hls) return warn('No Hls instance');
    const map = { full: '1080', hd: '720', sd: '480', min: '360' };
    const match = map[q] || q;
    let levelIndex = hls.levels.findIndex(l => (l.name || `${l.height}`).includes(match));
    if (levelIndex < 0 && typeof q === 'number') levelIndex = q;
    if (levelIndex < 0) return warn('No matching level for', q);
    hls.currentLevel = levelIndex;
    log('Set HLS level to', levelIndex, hls.levels[levelIndex]);
  }

  function analyzeHLSPerformance() {
    const v = getFirstVideo();
    const info = inspectHLSPlayer();
    const metrics = {
      buffered: v ? v.buffered?.length : 0,
      droppedFrames: v?.getVideoPlaybackQuality?.().droppedVideoFrames,
      totalFrames: v?.getVideoPlaybackQuality?.().totalVideoFrames,
      playbackRate: v?.playbackRate,
      readyState: v?.readyState,
      timestamp: Date.now(),
    };
    log('HLS Performance:', metrics, info);
    return { info, metrics };
  }

  function simulateHLSErrors() {
    warn('Error simulation is limited in console debugger. Consider throttling network in DevTools and blocking segments to trigger errors.');
  }

  // Media controls tests
  function testMediaControls() {
    const v = getFirstVideo(); if (!v) return;
    v.play().then(() => {
      log('Play OK');
      setTimeout(() => { v.pause(); log('Pause OK'); }, 500);
    }).catch(e => err('Play failed', e));
  }
  function simulateKeyboardControls() {
    ['k','m',' '].forEach(key => document.dispatchEvent(new KeyboardEvent('keydown', { key })));
    log('Dispatched keyboard events: k, m, space');
  }
  function testVolumeControls() {
    const v = getFirstVideo(); if (!v) return;
    const orig = v.volume; v.volume = Math.max(0, orig - 0.2); log('Volume down', v.volume);
    v.muted = !v.muted; log('Toggled muted', v.muted);
    v.volume = orig; log('Volume restore', v.volume);
  }
  function testSeekControls() {
    const v = getFirstVideo(); if (!v) return;
    if (Number.isFinite(v.duration)) {
      const t = Math.min(v.duration - 1, Math.max(0, (v.duration * 0.5)));
      v.currentTime = t; log('Seeked to', t);
    } else { warn('Duration unknown'); }
  }
  function validateControlAccessibility() {
    const buttons = Array.from(document.querySelectorAll('button[aria-label]'));
    const ok = buttons.some(b => /play\/pause/i.test(b.getAttribute('aria-label')||''));
    log('ARIA play/pause button present:', ok);
    return ok;
  }

  // Image cache helpers (requires PWA and SW running)
  async function inspectImageCache() {
    if (!('caches' in window)) return warn('Caches API unavailable');
    const keys = await caches.keys();
    const mediaKeys = keys.filter(k => /imgur|reddit.*(image|preview)|gfycat|ytimg|redgifs/i.test(k));
    log('Cache keys:', mediaKeys);
    return mediaKeys;
  }
  async function clearImageCache() {
    const keys = await inspectImageCache();
    await Promise.all(keys.map(k => caches.delete(k)));
    log('Cleared image caches');
  }
  async function testImageLoading(url) {
    const img = new Image();
    state.perf.start = performance.now();
    return new Promise((resolve) => {
      img.onload = () => {
        const dt = performance.now() - state.perf.start;
        log('Image loaded in', Math.round(dt), 'ms'); resolve(dt);
      };
      img.onerror = () => { err('Image failed to load'); resolve(null); };
      img.src = url;
    });
  }
  async function analyzeImagePerformance() {
    log('Use DevTools Network panel to observe cache hits/misses and sizes.');
  }
  async function testImageFallbacks() {
    const dt = await testImageLoading('https://example.invalid/nonexistent.jpg');
    log('Fallback image test completed (expect error) ->', dt);
  }

  // Responsive helpers
  function testBreakpoints() {
    const sizes = [
      [360, 640], [640, 800], [768, 900], [1024, 900], [1280, 900]
    ];
    let i = 0;
    function step() {
      if (i >= sizes.length) return log('Breakpoint test done');
      const [w,h] = sizes[i++];
      window.resizeTo(w,h); log('Resized to', w, h);
      setTimeout(step, 350);
    }
    step();
  }
  function simulateDeviceSize(w, h) { window.resizeTo(w, h); log('Resized to', w, h); }
  function testMobileCompatibility() { log('Manually verify touch actions, viewport meta, and control sizes.'); }
  function analyzeLayoutShift() { log('CLS should be measured via PerformanceObserver in Performance panel.'); }
  function testOrientationChange() { log('Rotate device/emulation; verify video resizes properly.'); }

  // Autoplay helpers
  function testAutoplayPolicies() { log('Play a video without user gesture; check if muted fallback engages.'); }
  function simulateUserGesture() { document.body.dispatchEvent(new MouseEvent('click', { bubbles:true })); log('Simulated click'); }
  function testAutoplayFallbacks() { log('Ensure muted=true when autoplay promise rejects.'); }
  function analyzeAutoplayBehavior() { return inspectHLSPlayer(); }
  function testIntersectionObserver() { log('Scroll video in/out of view; verify play/pause.'); }

  // Performance monitoring
  function startMediaPerformanceMonitoring() {
    if (!('PerformanceObserver' in window)) return warn('PerformanceObserver missing');
    state.perf.entries = [];
    const po = new PerformanceObserver((list) => {
      state.perf.entries.push(...list.getEntries());
    });
    try { po.observe({ entryTypes: ['largest-contentful-paint','layout-shift','first-input','navigation','resource'] }); } catch {}
    state.perf.po = po;
    log('Performance monitoring started');
  }
  function stopMediaPerformanceMonitoring() {
    state.perf.po?.disconnect();
    const summary = {
      count: state.perf.entries.length,
      lcp: state.perf.entries.filter(e => e.entryType==='largest-contentful-paint').slice(-1)[0]?.startTime,
      cls: state.perf.entries.filter(e => e.entryType==='layout-shift').reduce((a,b)=>a+(b.value||0),0),
    };
    log('Performance summary:', summary);
    return summary;
  }
  function measureMediaLoadTimes() { return stopMediaPerformanceMonitoring(); }
  function analyzeMemoryUsage() { if ('memory' in performance) log('Memory', performance.memory); else warn('performance.memory not available'); }
  function testNetworkConditions(speed) { log('Use DevTools Network throttling to', speed); }

  // Service worker cache helpers
  async function inspectServiceWorkerCache() { return inspectImageCache(); }
  async function testCacheStrategies() { log('Manually verify CacheFirst/NetworkFirst via DevTools > Application > Cache Storage'); }
  async function simulateOfflineMode() { log('Enable DevTools offline to test fallback behavior.'); }
  async function analyzeCacheHitRates() { log('Use DevTools/Workbox logs to compute hit rates.'); }
  async function testRangeRequests() { log('Play v.redd.it videos and verify 206 responses cached.'); }

  // Context and state
  function inspectMediaContext() { return window.__MEDIA_CONTEXT__ || null; }
  function inspectUIContext() { return window.__UI_CONTEXT__ || null; }
  function testContextUpdates() { log('Toggle settings in UI; verify contexts update.'); }
  async function validateContextPersistence() { log('Reload page; verify LocalForage-backed settings persist.'); }
  function resetMediaSettings() { localStorage.clear(); indexedDB.databases?.().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name))); log('Cleared storage'); }

  // Errors
  function simulateNetworkErrors() { log('Use Network panel to block requests or throttle to offline.'); }
  function simulateMediaErrors() { log('Change video src to an invalid URL in Elements; watch error recovery.'); }
  function testErrorRecovery() { debugHLSEvents(); log('Observe on error events for recovery attempts.'); }
  function simulateSlowNetwork() { testNetworkConditions('Slow 3G'); }
  function testBrowserQuirks() { log('Test Safari iOS autoplay/muted policies; Android Chrome differences.'); }

  // Accessibility
  function testKeyboardNavigation() { simulateKeyboardControls(); }
  function validateARIALabels() { return validateControlAccessibility(); }
  function testScreenReaderCompat() { log('Use VoiceOver/TalkBack to verify announcements.'); }
  function checkColorContrast() { log('Use Lighthouse/axe to check contrast on controls.'); }
  function testReducedMotion() { log('Set prefers-reduced-motion and validate autoplay/animations respect it.'); }

  // Automated runners
  function runMediaTestSuite() {
    debugHLSEvents();
    testMediaControls();
    simulateKeyboardControls();
    testVolumeControls();
    testSeekControls();
    validateControlAccessibility();
    analyzeHLSPerformance();
    startMediaPerformanceMonitoring();
    setTimeout(stopMediaPerformanceMonitoring, 3000);
    log('Media test suite executed');
  }
  function runPerformanceTests() { startMediaPerformanceMonitoring(); setTimeout(stopMediaPerformanceMonitoring, 5000); }
  function runAccessibilityTests() { validateARIALabels(); testKeyboardNavigation(); }
  function runCrossDeviceTests() { testBreakpoints(); testOrientationChange(); }
  function generateTestReport() { return { hls: inspectHLSPlayer(), perf: stopMediaPerformanceMonitoring() }; }

  // Expose to window
  Object.assign(window, {
    inspectHLSPlayer,
    testHLSQuality,
    debugHLSEvents,
    disableHLSEventDebug,
    analyzeHLSPerformance,
    simulateHLSErrors,

    testMediaControls,
    simulateKeyboardControls,
    testVolumeControls,
    testSeekControls,
    validateControlAccessibility,

    inspectImageCache,
    testImageLoading,
    analyzeImagePerformance,
    clearImageCache,
    testImageFallbacks,

    testBreakpoints,
    simulateDeviceSize,
    testMobileCompatibility,
    analyzeLayoutShift,
    testOrientationChange,

    testAutoplayPolicies,
    simulateUserGesture,
    testAutoplayFallbacks,
    analyzeAutoplayBehavior,
    testIntersectionObserver,

    startMediaPerformanceMonitoring,
    stopMediaPerformanceMonitoring,
    measureMediaLoadTimes,
    analyzeMemoryUsage,
    testNetworkConditions,

    inspectServiceWorkerCache,
    testCacheStrategies,
    simulateOfflineMode,
    analyzeCacheHitRates,
    testRangeRequests,

    inspectMediaContext,
    inspectUIContext,
    testContextUpdates,
    validateContextPersistence,
    resetMediaSettings,

    simulateNetworkErrors,
    simulateMediaErrors,
    testErrorRecovery,
    simulateSlowNetwork,
    testBrowserQuirks,

    testKeyboardNavigation,
    validateARIALabels,
    testScreenReaderCompat,
    checkColorContrast,
    testReducedMotion,

    runMediaTestSuite,
    runPerformanceTests,
    runAccessibilityTests,
    runCrossDeviceTests,
    generateTestReport,
  });

  log('Media console debugger loaded. Try window.inspectHLSPlayer()');
})();

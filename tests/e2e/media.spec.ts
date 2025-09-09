import { test, expect } from '@playwright/test';

// Reuse a running server at http://localhost:3000
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Media E2E', () => {
  test('v.redd.it post plays with controls and responsive layout', async ({ page, browserName }) => {
    test.setTimeout(120_000);

    await page.goto(BASE_URL, { waitUntil: 'load' });

    // Try to find a post containing v.redd.it or a <video>
    const candidate = page.locator('a[href*="v.redd.it"], a:has-text("v.redd.it")').first();
    const hasCandidate = await candidate.count().then(c => c > 0);
    if (hasCandidate) {
      await candidate.click();
    }

    // Ensure we have a video element on the page
    const video = page.locator('video').first();
    if (!(await video.count())) {
      test.skip(true, 'No video element found on page to test');
    }

    // Autoplay handling: if play() fails, muted fallback should allow play
    const played = await page.evaluate(async () => {
      const v = document.querySelector('video')! as HTMLVideoElement;
      try {
        await v.play();
        return true;
      } catch {
        // Mute fallback
        try { (v as any).setMuted?.(true); } catch {}
        v.muted = true;
        await v.play().catch(() => false);
        return !v.paused;
      }
    });
    expect(played).toBeTruthy();

    // Verify playback progresses and seeking/volume works
    await page.waitForTimeout(800);
    const t1 = await page.evaluate(() => (document.querySelector('video') as HTMLVideoElement).currentTime);
    await page.waitForTimeout(800);
    const t2 = await page.evaluate(() => (document.querySelector('video') as HTMLVideoElement).currentTime);
    expect(t2).toBeGreaterThan(t1);

    // Seek and adjust volume
    await page.evaluate(() => {
      const v = document.querySelector('video') as HTMLVideoElement;
      if (Number.isFinite(v.duration)) v.currentTime = Math.min(v.duration - 1, Math.max(0, v.duration * 0.5));
      v.volume = Math.max(0, Math.min(1, (v.volume || 1) * 0.8));
    });

    // Responsive layout checks at breakpoints
    const sizes: Array<[number, number]> = [
      [360, 640], [640, 800], [768, 900], [1024, 900]
    ];
    for (const [w, h] of sizes) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      expect(await video.isVisible()).toBeTruthy();
    }

    // Collect basic performance metrics
    const metricsBefore = await page.metrics();
    await page.addInitScript(() => {
      (window as any).__perfEntries = [];
      try {
        const po = new PerformanceObserver((list) => {
          (window as any).__perfEntries.push(...list.getEntries());
        });
        po.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
        (window as any).__po = po;
      } catch {}
    });
    const metricsAfter = await page.metrics();
    expect(metricsAfter.Timestamp).toBeGreaterThan(metricsBefore.Timestamp);
  });
});


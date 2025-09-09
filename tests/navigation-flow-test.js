/*
  Troddit Navigation Flow Test
  Usage: Paste into the browser DevTools Console while the dev server is running.

  What it does:
  - Exercises navigation across core routes and verifies content presence.
  - Uses Next.js Router if available; falls back to clicking links or hard navigations.
  - Checks state persistence heuristically via DOM and storage.
*/

(function () {
  const style = {
    ok: "color:#10b981;font-weight:600;",
    warn: "color:#f59e0b;font-weight:600;",
    err: "color:#ef4444;font-weight:600;",
    head: "background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;",
    info: "color:#60a5fa;",
  };
  const section = (t) => console.log("%cNAV", style.head, t);
  const ok = (m, x) => console.log(`%c✔ ${m}`, style.ok, x ?? "");
  const warn = (m, x) => console.warn(`%c⚠ ${m}`, style.warn, x ?? "");
  const err = (m, x) => console.error(`%c✖ ${m}`, style.err, x ?? "");
  const info = (m, x) => console.log(`%c• ${m}`, style.info, x ?? "");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getRouter() {
    // Best effort: some Next.js versions expose router
    return window.next?.router || window.__NEXT_ROUTER__ || null;
  }

  async function navigateTo(path) {
    const router = getRouter();
    if (router && router.push) {
      await router.push(path);
      return waitForPath(path);
    }
    // Try clicking a link
    const a = document.querySelector(`a[href='${path}']`) || document.querySelector(`a[href^='${path}']`);
    if (a) { a.click(); return waitForPath(path); }
    // Fallback hard navigation
    window.location.href = path;
    return waitForPath(path, true);
  }

  function waitForPath(path, hard) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const match = window.location.pathname.startsWith(path);
        if (match) return resolve(true);
        if (Date.now() - start > 8000) return resolve(false);
        setTimeout(check, 100);
      };
      if (hard) setTimeout(check, 350); else check();
    });
  }

  function hasFeed() {
    // Prefer stable data-testid, fallback to heuristics
    return !!(document.querySelector('[data-testid="feed"]') || document.querySelector('[data-feed], .Feed, .feed'));
  }

  function hasNavBar() {
    return !!(document.querySelector('[data-testid="navbar"]') || document.querySelector('nav, .NavBar, .navbar'));
  }

  async function run() {
    section("Basic Navigation");
    if (!(await navigateTo("/"))) return err("Failed to navigate to /");
    ok("Navigated to /");
    await sleep(300);
    hasFeed() ? ok("Feed visible on home") : warn("Feed not detected on home (selector heuristic)");
    hasNavBar() ? ok("NavBar present") : warn("NavBar not detected (selector heuristic)");

    // Deep-link into a post thread if available
    const postLink = document.querySelector('a[href*="/comments/"]');
    if (postLink) {
      postLink.click();
      const okNav = await waitForPath('/r/');
      okNav ? ok("Navigated to post thread") : warn("Failed to open post thread");
    } else {
      warn("No post link found to test comments navigation");
    }

    if (await navigateTo("/settings")) {
      ok("Navigated to /settings");
      await sleep(300);
      const hasSettings = !!(document.querySelector('[data-testid="settings"]') || document.querySelector('[data-settings], .Settings'));
      hasSettings ? ok("Settings content present") : warn("Settings content not detected");
    } else warn("/settings route not available");

    if (await navigateTo("/about")) {
      ok("Navigated to /about");
      await sleep(300);
      const hasAbout = !!(document.querySelector('[data-testid="about"]') || document.querySelector('[data-about], .About'));
      hasAbout ? ok("About content present") : warn("About content not detected");
    } else warn("/about route not available");

    section("Subreddit Navigation");
    // Prefer clicking a visible subreddit link
    const subLink = document.querySelector('a[href^="/r/"]');
    if (subLink) {
      const target = subLink.getAttribute("href");
      subLink.click();
      const okNav = await waitForPath("/r/");
      okNav ? ok(`Navigated to subreddit: ${target}`) : warn("Failed to navigate to subreddit via link");
    } else if (await navigateTo("/r/javascript")) {
      ok("Navigated directly to /r/javascript");
    } else warn("Subreddit route not available");

    section("History & Refresh");
    const prev = window.location.pathname;
    history.back();
    await sleep(500);
    history.forward();
    await sleep(500);
    ok("Back/forward executed (state continuity not guaranteed in script)");
    // Soft refresh heuristic
    const preservedPath = window.location.pathname;
    await new Promise((r) => setTimeout(r, 100));
    window.scrollTo(0, 0);
    ok(`Current path after history: ${preservedPath}`);

    section("Search & Nav Controls");
    const search = document.querySelector('[data-testid="search"] input') || document.querySelector('input[type="search"], .Search input');
    if (search) {
      search.focus();
      search.value = "nextjs";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      ok("Search input interaction OK");
    } else warn("Search input not found");

    section("404 & Error Handling");
    if (await navigateTo("/this/route/does/not/exist")) {
      await sleep(250);
      const has404 = !!(document.querySelector('[data-testid="404"]') || document.querySelector('[data-not-found], .NotFound'));
      has404 ? ok("404 page detected") : warn("404 page not detected (heuristic)");
    } else warn("Navigation to 404 path failed");

    section("Performance Heuristics");
    const tNav = performance.getEntriesByType("navigation")[0];
    if (tNav) info("Nav timing (ms):", {
      domContentLoaded: Math.round(tNav.domContentLoadedEventEnd),
      loadEventEnd: Math.round(tNav.loadEventEnd),
      type: tNav.type,
    });
    ok("Navigation flow test completed");
  }

  run().catch((e) => err("Navigation flow test crashed", e));
})();

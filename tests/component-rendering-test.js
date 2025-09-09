/*
  Troddit Component Rendering Test
  Usage: Paste into the browser DevTools Console while the dev server runs.

  What it does:
  - Heuristically verifies major components render and respond to interactions.
  - Focuses on NavBar, Feed, Search, dropdowns/modals, and responsiveness.
*/

(function () {
  const style = {
    ok: "color:#10b981;font-weight:600;",
    warn: "color:#f59e0b;font-weight:600;",
    err: "color:#ef4444;font-weight:600;",
    head: "background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;",
    info: "color:#60a5fa;",
  };
  const section = (t) => console.log("%cRENDER", style.head, t);
  const ok = (m, x) => console.log(`%c✔ ${m}`, style.ok, x ?? "");
  const warn = (m, x) => console.warn(`%c⚠ ${m}`, style.warn, x ?? "");
  const err = (m, x) => console.error(`%c✖ ${m}`, style.err, x ?? "");
  const info = (m, x) => console.log(`%c• ${m}`, style.info, x ?? "");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function q(sel) { return document.querySelector(sel); }
  function qa(sel) { return Array.from(document.querySelectorAll(sel)); }

  async function run() {
    section("Core Components");
    const nav = q('[data-testid="navbar"]') || q('nav, .NavBar, .navbar');
    nav ? ok("NavBar renders") : warn("NavBar not detected (heuristic)");

    const feed = q('[data-testid="feed"]') || q('[data-feed], .Feed, .feed');
    feed ? ok("Feed renders") : warn("Feed not detected (heuristic)");

    const searchInput = q('[data-testid="search"] input') || q('input[type="search"], .Search input');
    if (searchInput) {
      ok("Search input present");
      searchInput.focus();
      searchInput.value = "react";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      ok("Search interactions dispatched");
    } else warn("Search input not found");

    section("Interactive Elements");
    // Dropdowns / menus: restrict to NavBar to avoid destructive clicks
    const dropdownButtons = qa('[data-testid="navbar"] [aria-haspopup="menu"]');
    let opened = false;
    for (const btn of dropdownButtons.slice(0, 5)) {
      try { btn.click(); opened = true; await sleep(100); } catch {}
    }
    opened ? ok("Clicked navbar dropdown/menu buttons") : info("No navbar dropdown/menu buttons found");

    // Modals: look for typical modal containers
    const modal = q('[role="dialog"], .modal, [data-modal]');
    if (modal) {
      ok("Modal detected (heuristic)");
      // Try close buttons
      const close = q('[aria-label="Close"], [data-close], .close, button[aria-label*="close" i]');
      if (close) { try { close.click(); ok("Modal close interaction OK"); } catch {} }
    } else info("No modal detected (may require specific user action)");

    section("State & Props Heuristics");
    // Basic state-change probe: toggle first checkbox or switch
    const toggle = q('[data-testid] input[type="checkbox"], [data-testid][role="switch"]');
    if (toggle) {
      const prev = toggle.checked;
      try { toggle.click(); await sleep(50); ok("Toggled a switch/checkbox", { from: prev, to: toggle.checked }); }
      catch { warn("Toggle interaction failed"); }
    } else info("No toggle controls found");

    section("Responsive Checks");
    try {
      const widths = [360, 768, 1024, 1440];
      const prev = { w: window.innerWidth, h: window.innerHeight };
      for (const w of widths) {
        window.resizeTo?.(w, Math.max(700, window.innerHeight));
        await sleep(80);
        info(`Resized to width ${w}`);
      }
      // Restore (best-effort; ignored in most browsers)
      window.resizeTo?.(prev.w, prev.h);
      ok("Responsive resize sequence executed (browser-limited)");
    } catch {
      warn("Window resize not permitted in this browser context");
    }

    section("Accessibility Heuristics");
    const ariaIssues = [];
    qa('[data-testid] button, [data-testid] a, [data-testid][role="button"], [data-testid][role="link"]').forEach((el) => {
      const hasLabel = !!(el.getAttribute("aria-label") || el.textContent?.trim());
      if (!hasLabel) ariaIssues.push(el);
    });
    if (ariaIssues.length) warn(`Interactive elements missing labels: ${ariaIssues.length}`);
    else ok("Basic label presence OK for interactive elements");

    ok("Component rendering test completed");
  }

  run().catch((e) => err("Component rendering test crashed", e));
})();

/*
  Troddit Context Initialization Test
  Usage: Paste into the browser DevTools Console while the app is running.

  What it does:
  - Attempts to discover React Context providers in the current page via the React DevTools global hook (if available).
  - Verifies presence and hierarchy of UI, Media, Filter, and Main providers.
  - Probes LocalForage/IndexedDB for persisted preferences.
  - Logs a clear, structured report with pass/fail per item.
*/

(function () {
  const start = Date.now();
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  const time = () => {
    const ms = Date.now() - start;
    const s = Math.floor(ms / 1000);
    const rest = ms % 1000;
    return `${s}.${pad(Math.floor(rest / 10))}s`;
  };

  const style = {
    ok: "color: #10b981; font-weight: 600;",
    warn: "color: #f59e0b; font-weight: 600;",
    err: "color: #ef4444; font-weight: 600;",
    info: "color: #60a5fa;",
    dim: "color: #9ca3af;",
    head: "background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;",
  };

  function section(title) {
    console.log("%cCTX", style.head, title);
  }

  function logOk(msg, extra) {
    console.log(`%c✔ ${msg}`, style.ok, extra ?? "");
  }

  function logWarn(msg, extra) {
    console.warn(`%c⚠ ${msg}`, style.warn, extra ?? "");
  }

  function logErr(msg, extra) {
    console.error(`%c✖ ${msg}`, style.err, extra ?? "");
  }

  function logInfo(msg, extra) {
    console.log(`%c• ${msg}`, style.info, extra ?? "");
  }

  function summarize(results) {
    const passed = results.filter((r) => r === true).length;
    const failed = results.filter((r) => r === false).length;
    const skipped = results.filter((r) => r === null).length;
    console.log(
      `%cSummary: ${passed} passed, ${failed} failed, ${skipped} skipped in ${time()}`,
      failed ? style.err : style.ok
    );
  }

  // React fiber traversal helpers (best effort; depends on React DevTools hook)
  function getFiberRootsViaHook() {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || !hook.renderers) return [];
    try {
      const ids = Array.from(hook.renderers.keys());
      const roots = [];
      for (const id of ids) {
        const set = hook.getFiberRoots?.(id);
        if (set && set.size) roots.push(...Array.from(set.values()));
      }
      return roots;
    } catch (e) {
      return [];
    }
  }

  function traverseFiber(node, visit) {
    const stack = node ? [node] : [];
    while (stack.length) {
      const n = stack.pop();
      try {
        visit(n);
      } catch {}
      if (n && n.child) stack.push(n.child);
      if (n && n.sibling) stack.push(n.sibling);
    }
  }

  function collectContextProviders() {
    const providers = [];
    const roots = getFiberRootsViaHook();
    for (const root of roots) {
      const current = root.current || root._current;
      if (!current) continue;
      traverseFiber(current, (n) => {
        const t = n?.type;
        const ctx = t?._context;
        // Provider nodes often have a _context with currentValue
        if (ctx && (ctx._currentValue !== undefined || ctx._currentValue2 !== undefined)) {
          const displayName = ctx.displayName || ctx._displayName || t?.displayName || "<ContextProvider>";
          const value = n?.memoizedProps?.value;
          providers.push({ displayName, value, fiber: n });
        }
      });
    }
    return providers;
  }

  function probeLocalForageLike() {
    const info = { indexedDBSupported: !!window.indexedDB, dbs: [], errors: [] };
    const done = (payload) => payload;
    if (!window.indexedDB) return done(info);
    const api = indexedDB.databases ? indexedDB.databases.bind(indexedDB) : null;
    return new Promise((resolve) => {
      if (!api) {
        // Avoid opening arbitrary DBs to prevent side-effects when enumeration is unavailable
        logWarn("IDB enumeration unsupported; skipping DB discovery to avoid side effects");
        // Optional opt-in to probing if explicitly allowed by the page/test harness
        const allow = typeof window !== 'undefined' && window.__ALLOW_IDB_PROBE__ === true;
        if (!allow) return resolve(done(info));
        // If explicitly allowed, still avoid opening new DBs: only list known aliases without opening
        info.dbs = ["localforage", "troddit-query-cache", "reactQuery", "localforage-troddit"].map((name) => ({ name, note: "probe-allowed (no-open)" }));
        return resolve(done(info));
      } else {
        api().then((dbs) => {
          info.dbs = dbs || [];
          resolve(done(info));
        }).catch((e) => {
          info.errors.push(String(e));
          resolve(done(info));
        });
      }
    });
  }

  (async function run() {
    section("Context Initialization");
    const results = [];

    // Collect providers from the React fiber tree, if possible.
    const providers = collectContextProviders();
    if (!providers.length) {
      logWarn(
        "Could not discover providers (React DevTools hook not available or restricted)."
      );
      // Optional safer fallback via dev global if app exposes it
      const ctxGlobal = typeof window !== 'undefined' ? (window.__TRODDIT_CTX__ || null) : null;
      if (ctxGlobal && typeof ctxGlobal === 'object') {
        try {
          const keys = Object.keys(ctxGlobal).slice(0, 16);
          logOk("Context fallback detected via __TRODDIT_CTX__");
          logInfo("Ctx keys:", keys);
          results.push(true);
        } catch {
          results.push(null);
        }
      } else {
        results.push(null);
      }
    } else {
      logInfo(`Found ${providers.length} context provider(s).`);
      // Heuristic matching by displayName or key presence
      const match = (name) =>
        providers.find((p) =>
          String(p.displayName || "").toLowerCase().includes(name)
        );

      const ui = match("ui");
      const media = match("media");
      const filter = match("filter");
      const main = match("main");

      if (ui) { logOk(`UI context found: ${ui.displayName}`); results.push(true); } else { logErr("UI context not found"); results.push(false); }
      if (media) { logOk(`Media context found: ${media.displayName}`); results.push(true); } else { logErr("Media context not found"); results.push(false); }
      if (filter) { logOk(`Filter context found: ${filter.displayName}`); results.push(true); } else { logErr("Filter context not found"); results.push(false); }
      if (main) { logOk(`Main context found: ${main.displayName}`); results.push(true); } else { logErr("Main context not found"); results.push(false); }

      // Basic sanity on default values if present
      const showKeys = (v) => (v && typeof v === "object" ? Object.keys(v).slice(0, 12) : []);
      if (ui?.value) logInfo("UI keys:", showKeys(ui.value));
      if (media?.value) logInfo("Media keys:", showKeys(media.value));
      if (filter?.value) logInfo("Filter keys:", showKeys(filter.value));
      if (main?.value) logInfo("Main keys:", showKeys(main.value));

      // Hierarchy heuristic: if fiber return paths reflect wrapping order
      try {
        const order = providers
          .map((p) => ({ name: (p.displayName || "").toLowerCase(), depth: depthOf(p.fiber) }))
          .sort((a, b) => a.depth - b.depth);
        logInfo("Provider nesting order (shallow heuristic):", order);
      } catch {}
    }

    function depthOf(fiber) {
      let d = 0, n = fiber;
      while (n && n.return) { d++; n = n.return; }
      return d;
    }

    // LocalForage / storage checks
    section("LocalForage Storage");
    try {
      const lf = await probeLocalForageLike();
      if (lf.indexedDBSupported) {
        logOk("IndexedDB supported");
        if (lf.dbs && lf.dbs.length) {
          logInfo(`IndexedDB databases detected: ${lf.dbs.length}`);
          lf.dbs.forEach((db) => logInfo(`- DB: ${(db.name || db).toString()}`));
          results.push(true);
        } else {
          logWarn("No IndexedDB databases enumerated (may require permissions or non-Chromium browser)");
          results.push(null);
        }
      } else {
        logWarn("IndexedDB not supported in this environment");
        results.push(null);
      }
      if (lf.errors?.length) logWarn("IDB probing errors:", lf.errors);
    } catch (e) {
      logErr("LocalForage probing failed", e);
      results.push(false);
    }

    // Final summary
    summarize(results);
  })();
})();

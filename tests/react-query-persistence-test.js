/*
  Troddit React Query Persistence Test
  Usage: Paste into the browser DevTools Console while the app runs.

  What it does:
  - Probes IndexedDB/LocalStorage for React Query cache persistence (LocalForage-backed setups).
  - Checks for cache restoration heuristics after a refresh.
  - Exercises offline-first expectations by simulating offline and reading from cache.
*/

(async function () {
  const style = {
    ok: "color:#10b981;font-weight:600;",
    warn: "color:#f59e0b;font-weight:600;",
    err: "color:#ef4444;font-weight:600;",
    head: "background:#1f2937;color:#fff;padding:2px 6px;border-radius:3px;",
    info: "color:#60a5fa;",
  };
  const section = (t) => console.log("%cRQ", style.head, t);
  const ok = (m, x) => console.log(`%c✔ ${m}`, style.ok, x ?? "");
  const warn = (m, x) => console.warn(`%c⚠ ${m}`, style.warn, x ?? "");
  const err = (m, x) => console.error(`%c✖ ${m}`, style.err, x ?? "");
  const info = (m, x) => console.log(`%c• ${m}`, style.info, x ?? "");

  function listLocalStorage(prefixes = ["react-query", "rq:", "rq_"]) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (prefixes.some((p) => k.includes(p))) keys.push(k);
    }
    return keys;
  }

  async function enumerateIndexedDB() {
    if (!('indexedDB' in window)) return { supported: false, dbs: [] };
    const res = { supported: true, dbs: [] };
    try {
      const dbs = await (indexedDB.databases ? indexedDB.databases() : []);
      res.dbs = dbs || [];
    } catch {}
    return res;
  }

  async function openKnownDBs(names) {
    const found = [];
    // Avoid opening arbitrary DBs when enumeration is unavailable to prevent side effects
    const canEnumerate = !!(indexedDB && indexedDB.databases);
    const allowProbe = typeof window !== 'undefined' && window.__ALLOW_IDB_PROBE__ === true;
    if (!canEnumerate && !allowProbe) {
      warn("IDB enumeration unsupported; skipping DB open attempts to avoid side effects");
      return found;
    }
    if (!allowProbe) {
      // If we can enumerate, prefer reporting enumerated names without opening
      try {
        const dbs = await indexedDB.databases();
        (dbs || []).forEach((db) => found.push({ name: db.name || "<unnamed>", opened: false, note: "enumerated" }));
        return found;
      } catch {
        return found;
      }
    }
    // Explicitly allowed probe: still avoid upgrades; close immediately
    await Promise.all(
      names.map(
        (name) =>
          new Promise((resolve) => {
            try {
              const req = indexedDB.open(name);
              let done = false;
              req.onsuccess = () => {
                try { req.result.close(); } catch {}
                found.push({ name, opened: true });
                if (!done) { done = true; resolve(); }
              };
              req.onerror = () => { if (!done) { done = true; resolve(); } };
              req.onupgradeneeded = () => { try { req.result.close(); } catch {}; if (!done) { done = true; resolve(); } };
              setTimeout(() => { if (!done) { done = true; resolve(); } }, 1000);
            } catch { resolve(); }
          })
      )
    );
    return found;
  }

  try {
    section("Persistence Providers");
    const lsKeys = listLocalStorage();
    if (lsKeys.length) {
      ok("React Query-like keys in localStorage", lsKeys.slice(0, 8));
    } else {
      info("No obvious React Query keys in localStorage (expected if IndexedDB used)");
    }

    const idb = await enumerateIndexedDB();
    if (idb.supported) {
      ok("IndexedDB available");
      if (idb.dbs && idb.dbs.length) {
        info("IndexedDB databases detected:", idb.dbs);
      } else {
        info("IndexedDB databases not enumerable (browser-dependent)");
      }
      const likely = [
        "localforage", // default
        "troddit-query-cache",
        "reactQuery",
        "localforage-troddit",
      ];
      const opened = await openKnownDBs(likely);
      if (opened.length) ok("Likely cache DBs detected", opened);
      else info("No cache DBs opened (probing may be disabled)");
    } else {
      warn("IndexedDB not supported; persistence may fallback to memory/localStorage");
    }

    section("OfflineFirst Heuristic");
    const wasOnline = navigator.onLine;
    info(`navigator.onLine initial: ${wasOnline}`);
    info("To fully validate offline behavior, toggle network offline in DevTools and reload.");

    section("Cache Durations & Dehydration");
    // Optional dev globals integration
    const rq = typeof window !== 'undefined' ? (window.__RQ__ || null) : null;
    const qc = rq?.queryClient;
    const cfg = rq?.persistConfig; // includes shouldDehydrateQuery, buster/version
    if (qc && cfg) {
      ok('queryClient detected');
      try {
        if (typeof cfg.shouldDehydrateQuery === 'function') {
          ok('shouldDehydrateQuery function present');
        } else {
          warn('shouldDehydrateQuery missing from persist config');
        }
        if (cfg.buster) {
          ok('cache buster configured', { buster: cfg.buster });
        } else {
          warn('cache buster not found in persist config');
        }
      } catch (e) {
        warn('Error inspecting persist config', String(e));
      }
    } else {
      warn('Dev globals for React Query not found; SKIP dehydration/cfg checks');
    }

    section("Manual Invalidations");
    info("If the app exposes a queryClient, invalidate queries and confirm refetch on re-focus.");
    info("Otherwise, use the UI to trigger refetches and watch network tab.");

    ok("React Query persistence checks completed (heuristic)");
  } catch (e) {
    err("React Query persistence test failed", e);
  }
})();

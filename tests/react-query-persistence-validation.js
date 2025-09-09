/*
  React Query Persistence Validation
  Comprehensive validation of React Query persistence, dehydration/rehydration,
  LocalForage persister setup, version-based cache busting, and offline behavior.

  Usage:
  - Browser console: copy/paste or import via bundler. Call window.runReactQueryPersistenceValidation().
  - Node (best effort): node tests/react-query-persistence-validation.js

  Notes:
  - Attempts to use window.localforage if available; otherwise tries require('localforage').
  - Reads REACT_QUERY_OFFLINE_CACHE from LocalForage and inspects metadata structure.
  - Tries to read package.json version when running in Node to validate cache buster.
*/

;(function factory(root, factoryFn) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factoryFn()
  } else {
    root.runReactQueryPersistenceValidation = factoryFn().runReactQueryPersistenceValidation
  }
})(typeof self !== 'undefined' ? self : globalThis, function create() {
  const now = () => Date.now()

  function getLocalForage() {
    if (typeof window !== 'undefined' && window.localforage) return window.localforage
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies, global-require
      const lf = require('localforage')
      return lf
    } catch (e) {
      return null
    }
  }

  function getAppVersion() {
    // Browser apps usually embed version into cache buster; in Node we can require package.json
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const pkg = require('../package.json')
      return pkg.version || null
    } catch (e) {
      return null
    }
  }

  function ms(days) {
    return days * 24 * 60 * 60 * 1000
  }

  const DEFAULTS = {
    persisterKey: 'REACT_QUERY_OFFLINE_CACHE',
    maxAgeMs: ms(7),
  }

  async function safeGet(lf, key) {
    try {
      return await lf.getItem(key)
    } catch (e) {
      return { __error: String(e) }
    }
  }

  async function safeSet(lf, key, value) {
    try {
      await lf.setItem(key, value)
      return true
    } catch (e) {
      return { __error: String(e) }
    }
  }

  async function validateSafePersistProvider(lf) {
    const result = { name: 'SafePersistProvider Initialization', pass: true, notes: [] }
    if (!lf) {
      result.pass = false
      result.notes.push('LocalForage not available. Ensure LocalForage is loaded in the browser/app context.')
      return result
    }

    // Verify drivers priority if available
    try {
      const drivers = lf.supports || lf.driver // varies by localforage version
      result.notes.push(`LocalForage present. Current driver: ${lf.driver() || drivers || 'unknown'}`)
    } catch (e) {
      result.notes.push('LocalForage present; unable to determine active driver.')
    }

    // Basic set/get sanity check on a temp key
    const tempKey = '__rq_persist_temp__'
    const payload = { t: now(), r: Math.random() }
    const setRes = await safeSet(lf, tempKey, payload)
    if (setRes !== true) {
      result.pass = false
      result.notes.push(`Set failed: ${JSON.stringify(setRes)}`)
    } else {
      const got = await safeGet(lf, tempKey)
      if (!got || (got.t !== payload.t)) {
        result.pass = false
        result.notes.push('Roundtrip set/get mismatch on LocalForage instance.')
      }
      try { await lf.removeItem(tempKey) } catch (_) {}
    }

    result.notes.push('SSR-safe init assumed. Validate client hydration by reloading page and re-running suite.')
    return result
  }

  function isWithinMaxAge(timestamp, maxAgeMs) {
    if (!timestamp) return false
    return now() - timestamp < maxAgeMs
  }

  function analyzeDehydratedCache(cache) {
    const details = {
      hasClientState: !!(cache && cache.clientState),
      queryCount: 0,
      feedQueries: 0,
      threadQueries: 0,
      withPagesData: 0,
      updatedAtFresh: 0,
      keys: [],
    }
    try {
      const queries = cache?.clientState?.queries || []
      details.queryCount = queries.length
      for (const q of queries) {
        const qk = JSON.stringify(q.queryKey)
        details.keys.push(qk)
        const keyStr = qk.toLowerCase()
        const isFeed = keyStr.includes('feed') || keyStr.includes('home')
        const isThread = keyStr.includes('thread') || keyStr.includes('comments')
        if (isFeed) details.feedQueries += 1
        if (isThread) details.threadQueries += 1
        const hasPages = q?.state?.data && (Array.isArray(q.state.data.pages) ? q.state.data.pages.length > 0 : !!q.state.data)
        if (hasPages) details.withPagesData += 1
        if (isWithinMaxAge(q.state?.dataUpdatedAt, DEFAULTS.maxAgeMs)) details.updatedAtFresh += 1
      }
    } catch (_) {}
    return details
  }

  async function validateReactQueryCachePersistence(lf) {
    const result = { name: 'React Query Cache Persistence', pass: true, notes: [], metrics: {} }
    const cache = await safeGet(lf, DEFAULTS.persisterKey)
    if (!cache || cache.__error) {
      result.pass = false
      result.notes.push('No persisted cache found in LocalForage under REACT_QUERY_OFFLINE_CACHE.')
      if (cache?.__error) result.notes.push(`Read error: ${cache.__error}`)
      return result
    }

    const details = analyzeDehydratedCache(cache)
    result.metrics = details
    if (!details.hasClientState) {
      result.pass = false
      result.notes.push('Persisted object missing clientState.')
    }

    // Version-based cache busting check
    const appVersion = getAppVersion()
    if (appVersion && cache.buster && String(cache.buster).includes(appVersion)) {
      result.notes.push(`Cache buster matches app version: ${appVersion}`)
    } else if (cache.buster) {
      result.notes.push(`Cache buster present: ${cache.buster}. Unable to confirm app version in browser.`)
    } else {
      result.notes.push('No cache buster found. Ensure version-based busting is configured.')
    }

    // Age validation
    const ts = cache.timestamp || cache.clientState?.timestamp || null
    if (ts && !isWithinMaxAge(ts, DEFAULTS.maxAgeMs)) {
      result.pass = false
      result.notes.push('Persisted cache exceeds maxAge (7 days).')
    }

    // Query-specific checks
    if (details.feedQueries === 0 && details.threadQueries === 0) {
      result.notes.push('No feed/thread queries detected. Populate cache by navigating the app, then re-run.')
    }
    if (details.withPagesData === 0) {
      result.pass = false
      result.notes.push('No queries with pages data found; dehydration likely filtered all data.')
    }
    return result
  }

  async function validateDehydrationLogic(lf) {
    const result = { name: 'Cache Dehydration Logic', pass: true, notes: [] }
    const cache = await safeGet(lf, DEFAULTS.persisterKey)
    if (!cache || cache.__error) {
      result.pass = false
      result.notes.push('No persisted cache to analyze dehydration logic.')
      return result
    }
    const queries = cache?.clientState?.queries || []
    let selectivelyPersisted = 0
    for (const q of queries) {
      const hasPages = q?.state?.data && (Array.isArray(q.state.data.pages) ? q.state.data.pages.length > 0 : !!q.state.data)
      const keyStr = JSON.stringify(q.queryKey).toLowerCase()
      const isFeedOrThread = keyStr.includes('feed') || keyStr.includes('thread') || keyStr.includes('comments') || keyStr.includes('home')
      if (hasPages && isFeedOrThread) selectivelyPersisted += 1
    }
    if (selectivelyPersisted === 0) {
      result.pass = false
      result.notes.push('No feed/thread queries with pages detected in persisted cache.')
    } else {
      result.notes.push(`Selectively persisted queries: ${selectivelyPersisted}`)
    }
    return result
  }

  async function validateOfflineBehavior(lf) {
    const result = { name: 'Offline Behavior (offlineFirst)', pass: true, notes: [] }
    if (typeof navigator !== 'undefined') {
      result.notes.push(`Navigator online: ${navigator.onLine}`)
    } else {
      result.notes.push('Navigator not available in this context; offline simulation not executed.')
    }
    // Best effort: ensure cache exists to serve offline
    const cache = await safeGet(lf, DEFAULTS.persisterKey)
    if (!cache || cache.__error) {
      result.pass = false
      result.notes.push('No persisted cache available to serve while offline.')
    } else {
      result.notes.push('Persisted cache present for offline usage.')
    }
    return result
  }

  async function runReactQueryPersistenceValidation(options = {}) {
    const lf = options.localforage || getLocalForage()
    const rq = lf?.createInstance?.({ name: 'troddit', storeName: 'rq_cache' }) || lf
    const results = []
    const start = now()

    results.push(await validateSafePersistProvider(lf))
    results.push(await validateReactQueryCachePersistence(rq))
    results.push(await validateDehydrationLogic(rq))
    results.push(await validateOfflineBehavior(rq))

    const durationMs = now() - start
    const pass = results.every(r => r.pass)
    const summary = {
      suite: 'React Query Persistence Validation',
      pass,
      durationMs,
      timestamp: new Date().toISOString(),
      results,
    }
    if (typeof window !== 'undefined') {
      // pretty print in browser
      // eslint-disable-next-line no-console
      console.log('[RQ Persistence Validation]', summary)
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(summary, null, 2))
    }
    return summary
  }

  return { runReactQueryPersistenceValidation }
})

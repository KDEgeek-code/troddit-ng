/*
  Browser Console Persistence Debugger
  Attaches a suite of helpers to window.* for interactive testing of
  React Query cache persistence, LocalForage multi-instance storage,
  and preference synchronization.

  Load this in the browser (e.g., via devtools Snippets or bundler) and
  call the exported functions from the console.
*/

;(function attachDebugger(root) {
  if (typeof window === 'undefined') return

  const lf = window.localforage || null
  const LF_INSTANCES = lf
    ? {
        rq_cache: lf.createInstance({ name: 'troddit', storeName: 'rq_cache' }),
        userPrefs: lf.createInstance({ name: 'troddit', storeName: 'userPrefs' }),
        readPosts: lf.createInstance({ name: 'troddit', storeName: 'readPosts' }),
        seenPosts: lf.createInstance({ name: 'troddit', storeName: 'seenPosts' }),
        subInfoCache: lf.createInstance({ name: 'troddit', storeName: 'subInfoCache' }),
        subredditFilters: lf.createInstance({ name: 'troddit', storeName: 'subredditFilters' }),
        userFilters: lf.createInstance({ name: 'troddit', storeName: 'userFilters' }),
      }
    : {}

  // Utilities
  async function listKeys(lfi) { try { return await lfi.keys() } catch (e) { return { __error: String(e) } } }
  async function getAll(lfi) {
    const out = {}
    try {
      const ks = await lfi.keys()
      for (const k of ks) out[k] = await lfi.getItem(k)
      return out
    } catch (e) {
      return { __error: String(e) }
    }
  }

  // React Query Cache Inspector
  window.inspectReactQueryCache = async function inspectReactQueryCache() {
    if (!lf) return console.warn('LocalForage not available')
    const persisted = await LF_INSTANCES.rq_cache.getItem('REACT_QUERY_OFFLINE_CACHE')
    console.log('[RQ Cache]', persisted)
    return persisted
  }

  window.testCachePersistence = async function testCachePersistence() {
    if (!lf) return console.warn('LocalForage not available')
    const key = 'REACT_QUERY_OFFLINE_CACHE'
    const before = await LF_INSTANCES.rq_cache.getItem(key)
    console.log('[Before Cache]', before)
    // Simulate a write/read cycle
    if (before) await LF_INSTANCES.rq_cache.setItem(key, before)
    const after = await LF_INSTANCES.rq_cache.getItem(key)
    console.log('[After Cache]', after)
    return { before, after }
  }

  window.clearReactQueryCache = async function clearReactQueryCache() {
    if (!lf) return console.warn('LocalForage not available')
    await LF_INSTANCES.rq_cache.removeItem('REACT_QUERY_OFFLINE_CACHE')
    console.log('Cleared REACT_QUERY_OFFLINE_CACHE')
  }

  window.validateCacheDehydration = async function validateCacheDehydration() {
    const cache = await window.inspectReactQueryCache()
    if (!cache) return { pass: false, notes: ['No cache found'] }
    const queries = cache?.clientState?.queries || []
    let persisted = 0
    for (const q of queries) {
      const keyStr = JSON.stringify(q.queryKey).toLowerCase()
      const isFeedOrThread = keyStr.includes('feed') || keyStr.includes('thread') || keyStr.includes('comments') || keyStr.includes('home')
      const hasPages = q?.state?.data && (Array.isArray(q.state.data.pages) ? q.state.data.pages.length > 0 : !!q.state.data)
      if (isFeedOrThread && hasPages) persisted += 1
    }
    const pass = persisted > 0
    const res = { pass, notes: [`Selective persisted queries: ${persisted}`] }
    console.log('[Dehydration Validation]', res)
    return res
  }

  window.monitorCachePerformance = function monitorCachePerformance() {
    console.warn('Implement app-specific cache hit rate hooks if available.')
  }

  // LocalForage Instance Manager
  window.inspectLocalForageInstances = async function inspectLocalForageInstances() {
    if (!lf) return console.warn('LocalForage not available')
    const summary = {}
    for (const [k, v] of Object.entries(LF_INSTANCES)) {
      summary[k] = await getAll(v)
    }
    console.log('[LF Instances]', summary)
    return summary
  }

  window.testLocalForagePerformance = async function testLocalForagePerformance() {
    if (!lf) return console.warn('LocalForage not available')
    const t0 = performance.now()
    await LF_INSTANCES.userPrefs.setItem('__perf__', { t: Date.now() })
    const mid = performance.now()
    await LF_INSTANCES.userPrefs.getItem('__perf__')
    const t1 = performance.now()
    await LF_INSTANCES.userPrefs.removeItem('__perf__')
    const res = { setMs: mid - t0, getMs: t1 - mid }
    console.log('[LF Performance]', res)
    return res
  }

  window.migrateStorageData = async function migrateStorageData() {
    console.warn('Call app-specific storage migration utilities from src/utils/storage.ts if exported to window in dev.')
  }

  window.clearAllLocalForage = async function clearAllLocalForage() {
    if (!lf) return console.warn('LocalForage not available')
    for (const v of Object.values(LF_INSTANCES)) await v.clear()
    console.log('Cleared all LocalForage instances')
  }

  window.validateStorageIntegrity = async function validateStorageIntegrity() {
    if (!lf) return console.warn('LocalForage not available')
    const keys = await Promise.all(Object.values(LF_INSTANCES).map(i => i.keys()))
    const totals = keys.map(a => a.length).reduce((a, b) => a + b, 0)
    const res = { instances: Object.keys(LF_INSTANCES).length, totalKeys: totals }
    console.log('[Storage Integrity]', res)
    return res
  }

  // Preference Sync Debugger
  window.inspectPreferenceState = async function inspectPreferenceState() {
    if (!lf) return console.warn('LocalForage not available')
    const prefs = await LF_INSTANCES.userPrefs.getItem('preferences')
    const unsent = await LF_INSTANCES.userPrefs.getItem('unsentPrefs')
    const res = { prefs, unsent }
    console.log('[Preference State]', res)
    return res
  }

  window.testPreferenceSync = async function testPreferenceSync() {
    if (!lf) return console.warn('LocalForage not available')
    const prefs = (await LF_INSTANCES.userPrefs.getItem('preferences')) || {}
    prefs.__debug_lastChange = Date.now()
    await LF_INSTANCES.userPrefs.setItem('preferences', prefs)
    console.log('Updated prefs with __debug_lastChange')
    return prefs
  }

  window.simulateOfflinePrefs = async function simulateOfflinePrefs() {
    if (!lf) return console.warn('LocalForage not available')
    const snapshot = { op: 'merge', data: { __offline: Date.now() }, queuedAt: Date.now() }
    await LF_INSTANCES.userPrefs.setItem('unsentPrefs', snapshot)
    console.log('Queued offline preference change (single snapshot)')
    return 1
  }

  window.validatePreferenceMapping = function validatePreferenceMapping() {
    console.warn('Validate mapping by inspecting contexts and UI state in the running app.')
  }

  window.resetPreferencesToDefaults = async function resetPreferencesToDefaults() {
    if (!lf) return console.warn('LocalForage not available')
    await LF_INSTANCES.userPrefs.removeItem('preferences')
    console.log('Removed prefs to allow app to restore defaults on next load')
  }

  // Cross-Session Tools
  window.exportPreferences = async function exportPreferences() {
    if (!lf) return console.warn('LocalForage not available')
    return LF_INSTANCES.userPrefs.getItem('preferences')
  }

  window.importPreferences = async function importPreferences(data) {
    if (!lf) return console.warn('LocalForage not available')
    await LF_INSTANCES.userPrefs.setItem('preferences', data)
    console.log('Imported preferences')
  }

  window.simulateSessionRestart = function simulateSessionRestart() {
    console.log('Close tab and reopen to simulate session restart. State is persisted in LocalForage.')
  }

  window.validateCrossSessionSync = async function validateCrossSessionSync() {
    const prefs = await window.exportPreferences()
    const ok = !!prefs
    const res = { pass: ok, notes: [ok ? 'Prefs available for next session' : 'Prefs missing'] }
    console.log('[Cross-Session Sync]', res)
    return res
  }

  window.comparePreferenceStates = function comparePreferenceStates(a, b) {
    const same = JSON.stringify(a) === JSON.stringify(b)
    const res = { equal: same, aOnly: diffKeys(a, b), bOnly: diffKeys(b, a) }
    console.log('[Compare Prefs]', res)
    return res
  }

  function diffKeys(a = {}, b = {}) {
    return Object.keys(a).filter(k => !(k in b))
  }

  // Network and Offline Testing
  window.simulateNetworkOffline = function simulateNetworkOffline() {
    console.log('Toggle network offline in DevTools. This function is informational.')
  }

  window.simulateNetworkOnline = function simulateNetworkOnline() {
    console.log('Restore network in DevTools. This function is informational.')
  }

  window.testOfflineQueue = async function testOfflineQueue() {
    return window.simulateOfflinePrefs()
  }

  window.flushOfflineQueue = async function flushOfflineQueue() {
    if (!lf) return console.warn('LocalForage not available')
    await LF_INSTANCES.userPrefs.removeItem('unsentPrefs')
    console.log('Cleared offline preference snapshot')
  }

  window.monitorNetworkRequests = function monitorNetworkRequests() {
    console.log('Use Network tab + app logs to monitor preference API calls.')
  }

  // Performance Monitoring Tools
  window.measureCachePerformance = async function measureCachePerformance() {
    console.warn('Add app-specific timings around query fetch/reads for accurate metrics.')
  }

  window.measureStoragePerformance = async function measureStoragePerformance() {
    return window.testLocalForagePerformance()
  }

  window.measureSyncPerformance = async function measureSyncPerformance() {
    const t0 = performance.now()
    await window.testPreferenceSync()
    const t1 = performance.now()
    const res = { syncMs: t1 - t0 }
    console.log('[Sync Performance]', res)
    return res
  }

  window.generatePerformanceReport = async function generatePerformanceReport() {
    const lfPerf = await window.testLocalForagePerformance()
    const syncPerf = await window.measureSyncPerformance()
    const res = { lfPerf, syncPerf }
    console.log('[Performance Report]', res)
    return res
  }

  window.monitorMemoryUsage = function monitorMemoryUsage() {
    if (performance && performance.memory) console.log('[Memory]', performance.memory)
    else console.warn('performance.memory not supported in this browser.')
  }

  // Debugging and Diagnostics
  window.enablePersistenceDebugMode = function enablePersistenceDebugMode() {
    window.__PERSISTENCE_DEBUG__ = true
    console.log('Persistence debug mode enabled')
  }

  window.disablePersistenceDebugMode = function disablePersistenceDebugMode() {
    window.__PERSISTENCE_DEBUG__ = false
    console.log('Persistence debug mode disabled')
  }

  window.generateDiagnosticReport = async function generateDiagnosticReport() {
    const cache = await window.inspectReactQueryCache()
    const prefs = await window.inspectPreferenceState()
    const lfInt = await window.validateStorageIntegrity()
    const res = { cachePresent: !!cache, prefs, storage: lfInt }
    console.log('[Diagnostic Report]', res)
    return res
  }

  window.validateSystemHealth = async function validateSystemHealth() {
    const diag = await window.generateDiagnosticReport()
    const pass = !!diag.cachePresent && !!diag.prefs
    const res = { pass, diag }
    console.log('[System Health]', res)
    return res
  }

  window.troubleshootSyncIssues = function troubleshootSyncIssues() {
    console.log('Steps: 1) inspectPreferenceState 2) check Network tab 3) validate server auth 4) clear queues 5) retry.')
  }

  // Test Automation Helpers
  window.runPersistenceTestSuite = async function runPersistenceTestSuite() {
    const r1 = await window.validateCacheDehydration()
    const r2 = await window.validateStorageIntegrity()
    const r3 = await window.validateCrossSessionSync()
    const pass = !!(r1?.pass && r2 && r3?.pass)
    const res = { pass, results: { r1, r2, r3 } }
    console.log('[Persistence Test Suite]', res)
    return res
  }

  window.runPreferenceSyncTests = async function runPreferenceSyncTests() {
    return window.inspectPreferenceState()
  }

  window.runCacheValidationTests = async function runCacheValidationTests() {
    return window.validateCacheDehydration()
  }

  window.runCrossSessionTests = async function runCrossSessionTests() {
    return window.validateCrossSessionSync()
  }

  window.generateTestReport = async function generateTestReport() {
    const suite = await window.runPersistenceTestSuite()
    console.log('[Test Report]', suite)
    return suite
  }
})(typeof self !== 'undefined' ? self : globalThis)

/*
  Persistence Integration Test Suite
  Orchestrates all persistence-related tests and aggregates results into a unified report.

  Usage:
  - Browser: window.runPersistenceIntegrationTestSuite()
  - Node: node tests/persistence-integration-test-suite.js
*/

;(function factory(root, factoryFn) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factoryFn()
  } else {
    root.runPersistenceIntegrationTestSuite = factoryFn().runPersistenceIntegrationTestSuite
  }
})(typeof self !== 'undefined' ? self : globalThis, function create() {
  function tryRequire(path) { try { return require(path) } catch (_) { return null } }
  function getLocalForage() { if (typeof window !== 'undefined' && window.localforage) return window.localforage; try { return require('localforage') } catch { return null } }

  async function runPersistenceIntegrationTestSuite(options = {}) {
    const lf = options.localforage || getLocalForage()
    // Load component tests
    const rqValidation = tryRequire('./react-query-persistence-validation.js')
    const lfMulti = tryRequire('./localforage-multi-instance-test.js')
    const prefsSync = tryRequire('./preference-cross-session-sync-test.js')
    const offline = tryRequire('./offline-caching-validation.js')
    const storageMig = tryRequire('./storage-migration-compatibility-test.js')
    // Existing tests referenced by repo
    const rqLegacy = tryRequire('./react-query-persistence-test.js')
    const prefsLegacy = tryRequire('./preference-sync-test.js')

    const tasks = []
    if (rqValidation?.runReactQueryPersistenceValidation) tasks.push(rqValidation.runReactQueryPersistenceValidation({ localforage: lf }))
    if (lfMulti?.runLocalForageMultiInstanceTests) tasks.push(lfMulti.runLocalForageMultiInstanceTests({ localforage: lf }))
    if (prefsSync?.runPreferenceCrossSessionSyncTests) tasks.push(prefsSync.runPreferenceCrossSessionSyncTests({ localforage: lf }))
    if (offline?.runOfflineCachingValidation) tasks.push(offline.runOfflineCachingValidation({ localforage: lf }))
    if (storageMig?.runStorageMigrationCompatibilityTests) tasks.push(storageMig.runStorageMigrationCompatibilityTests({ localforage: lf }))
    if (rqLegacy?.runReactQueryPersistenceTests) tasks.push(rqLegacy.runReactQueryPersistenceTests({ localforage: lf }))
    if (prefsLegacy?.runPreferenceSyncTests) tasks.push(prefsLegacy.runPreferenceSyncTests({ localforage: lf }))

    const start = Date.now()
    const results = []
    for (const t of tasks) {
      try { results.push(await t) } catch (e) { results.push({ suite: 'unknown', pass: false, error: String(e) }) }
    }
    const durationMs = Date.now() - start
    const pass = results.every(r => r && r.pass !== false)
    const report = { suite: 'Persistence Integration Suite', pass, durationMs, timestamp: new Date().toISOString(), results }
    print(report)
    return report
  }

  function print(report) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[Persistence Integration Suite]', report)
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2))
    }
  }

  return { runPersistenceIntegrationTestSuite }
})

// CLI support
if (typeof module !== 'undefined' && !module.parent) {
  ;(async () => {
    const { runPersistenceIntegrationTestSuite } = require('./persistence-integration-test-suite.js')
    await runPersistenceIntegrationTestSuite()
  })()
}


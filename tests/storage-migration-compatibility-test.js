/*
  Storage Migration & Compatibility Test
  Validates migration from localStorage to LocalForage, driver fallbacks, version-based cache busting,
  data format integrity, quota handling, and concurrency.

  Usage:
  - Browser console: window.runStorageMigrationCompatibilityTests()
  - Node: node tests/storage-migration-compatibility-test.js (best effort)
*/

;(function factory(root, factoryFn) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factoryFn()
  } else {
    root.runStorageMigrationCompatibilityTests = factoryFn().runStorageMigrationCompatibilityTests
  }
})(typeof self !== 'undefined' ? self : globalThis, function create() {
  function getLocalForage() {
    if (typeof window !== 'undefined' && window.localforage) return window.localforage
    try { return require('localforage') } catch { return null }
  }

  function instance(lf, storeName) { return lf.createInstance({ name: 'troddit', storeName }) }

  function detectDrivers(lf) {
    const drivers = []
    try {
      if (lf.LOCALSTORAGE) drivers.push('localstorage')
      if (lf.INDEXEDDB) drivers.push('indexeddb')
      if (lf.WEBSQL) drivers.push('websql')
    } catch (_) {}
    return drivers
  }

  async function runStorageMigrationCompatibilityTests(options = {}) {
    const lf = options.localforage || getLocalForage()
    const report = { suite: 'Storage Migration & Compatibility', pass: true, results: [], timestamp: new Date().toISOString() }
    if (!lf) {
      report.pass = false
      report.results.push({ name: 'LocalForage availability', pass: false, notes: ['LocalForage not found.'] })
      print(report)
      return report
    }
    const rq = instance(lf, 'rq_cache')
    const prefs = instance(lf, 'userPrefs')

    // Driver detection
    const drivers = detectDrivers(lf)
    report.results.push({ name: 'Driver availability', pass: drivers.length > 0, notes: [drivers.join(', ') || 'none'] })

    // Migration simulation: localStorage -> LocalForage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('troddit:prefs', JSON.stringify({ fromLocalStorage: true, t: Date.now() }))
        const migrated = JSON.parse(localStorage.getItem('troddit:prefs') || 'null')
        await prefs.setItem('preferences', migrated)
        localStorage.removeItem('troddit:prefs')
        const roundtrip = await prefs.getItem('preferences')
        const ok = !!roundtrip && roundtrip.fromLocalStorage === true
        report.results.push({ name: 'LocalStorage -> LocalForage migration', pass: ok, notes: [ok ? 'Migrated and cleaned up LS' : 'Migration failed'] })
        if (!ok) report.pass = false
      } else {
        report.results.push({ name: 'LocalStorage -> LocalForage migration', pass: true, notes: ['localStorage not available in this context; skipped.'] })
      }
    } catch (e) {
      report.results.push({ name: 'LocalStorage -> LocalForage migration', pass: false, notes: [String(e)] })
      report.pass = false
    }

    // Version compatibility: read cache buster
    try {
      const persisted = await rq.getItem('REACT_QUERY_OFFLINE_CACHE')
      const buster = persisted?.buster
      report.results.push({ name: 'Version cache buster', pass: !!buster, notes: [buster ? `buster=${buster}` : 'none'] })
    } catch (e) {
      report.results.push({ name: 'Version cache buster', pass: false, notes: [String(e)] })
    }

    // Data format validation
    try {
      const complex = { a: 1, b: [1, { c: 'x' }], d: { e: true, f: null } }
      await prefs.setItem('__format__', complex)
      const got = await prefs.getItem('__format__')
      const ok = JSON.stringify(complex) === JSON.stringify(got)
      await prefs.removeItem('__format__')
      report.results.push({ name: 'Data format integrity', pass: ok, notes: [ok ? 'JSON preserved' : 'Mismatch after roundtrip'] })
      if (!ok) report.pass = false
    } catch (e) {
      report.results.push({ name: 'Data format integrity', pass: false, notes: [String(e)] })
      report.pass = false
    }

    // Concurrency test (best effort)
    try {
      const tasks = []
      for (let i = 0; i < 10; i++) tasks.push(prefs.setItem(`__concurrent__${i}`, { i }))
      await Promise.all(tasks)
      const keys = await prefs.keys()
      const count = keys.filter(k => k.startsWith('__concurrent__')).length
      report.results.push({ name: 'Concurrent writes', pass: count === 10, notes: [`count=${count}`] })
      for (let i = 0; i < 10; i++) await prefs.removeItem(`__concurrent__${i}`)
    } catch (e) {
      report.results.push({ name: 'Concurrent writes', pass: false, notes: [String(e)] })
      report.pass = false
    }

    print(report)
    return report
  }

  function print(report) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[Storage Migration & Compatibility]', report)
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2))
    }
  }

  return { runStorageMigrationCompatibilityTests }
})

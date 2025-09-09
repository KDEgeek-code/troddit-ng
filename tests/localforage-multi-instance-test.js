/*
  LocalForage Multi-Instance Test
  Validates multiple LocalForage instances used by the app for isolation, integrity, performance,
  and error handling. Designed for browser console and Node (best effort).

  Usage:
  - Browser console: window.runLocalForageMultiInstanceTests()
  - Node: node tests/localforage-multi-instance-test.js
*/

;(function factory(root, factoryFn) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factoryFn()
  } else {
    root.runLocalForageMultiInstanceTests = factoryFn().runLocalForageMultiInstanceTests
  }
})(typeof self !== 'undefined' ? self : globalThis, function create() {
  function getLocalForage() {
    if (typeof window !== 'undefined' && window.localforage) return window.localforage
    try { return require('localforage') } catch { return null }
  }

  function instance(lf, name, storeName) {
    try { return lf.createInstance({ name, storeName }) } catch (_) { return null }
  }

  async function roundtrip(lfi, key, value) {
    try {
      await lfi.setItem(key, value)
      const got = await lfi.getItem(key)
      await lfi.removeItem(key)
      return { ok: JSON.stringify(got) === JSON.stringify(value), value: got }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }

  async function measurePerformance(fn, label) {
    const t0 = performance?.now?.() || Date.now()
    const res = await fn()
    const t1 = performance?.now?.() || Date.now()
    return { label, ms: t1 - t0, res }
  }

  async function runLocalForageMultiInstanceTests(options = {}) {
    const lf = options.localforage || getLocalForage()
    const report = { suite: 'LocalForage Multi-Instance', pass: true, results: [], timestamp: new Date().toISOString() }
    if (!lf) {
      report.pass = false
      report.results.push({ name: 'LocalForage availability', pass: false, notes: ['LocalForage not found. Load it in browser context.'] })
      print(report)
      return report
    }

    const instances = {
      rq_cache: instance(lf, 'troddit', 'rq_cache'),
      userPrefs: instance(lf, 'troddit', 'userPrefs'),
      readPosts: instance(lf, 'troddit', 'readPosts'),
      seenPosts: instance(lf, 'troddit', 'seenPosts'),
      subInfoCache: instance(lf, 'troddit', 'subInfoCache'),
      subredditFilters: instance(lf, 'troddit', 'subredditFilters'),
      userFilters: instance(lf, 'troddit', 'userFilters'),
    }

    // Instance validation
    for (const [k, v] of Object.entries(instances)) {
      report.results.push({ name: `Instance ${k}`, pass: !!v, notes: [v ? 'Created' : 'Failed to create'] })
      if (!v) report.pass = false
    }

    // Isolation test
    try {
      const a = instances.userPrefs
      const b = instances.readPosts
      const key = '__lf_isolation__'
      await a.setItem(key, { a: 1 })
      const gotA = await a.getItem(key)
      const gotB = await b.getItem(key)
      await a.removeItem(key)
      const isolated = !!gotA && !gotB
      report.results.push({ name: 'Data Isolation', pass: isolated, notes: [`A has: ${!!gotA}`, `B has: ${!!gotB}`] })
      if (!isolated) report.pass = false
    } catch (e) {
      report.results.push({ name: 'Data Isolation', pass: false, notes: [String(e)] })
      report.pass = false
    }

    // Roundtrip + performance
    for (const [k, v] of Object.entries(instances)) {
      if (!v) continue
      const perf = await measurePerformance(() => roundtrip(v, '__rt__', { k, t: Date.now() }), `Roundtrip ${k}`)
      report.results.push({ name: perf.label, pass: perf.res.ok, notes: [`${perf.ms.toFixed(1)}ms`].concat(perf.res.error ? [String(perf.res.error)] : []) })
      if (!perf.res.ok) report.pass = false
    }

    // Quota / large payload best-effort test
    try {
      const large = 'x'.repeat(256 * 1024) // 256KB chunk
      const chunks = 4 // 1MB total; adjust if needed
      const payload = new Array(chunks).fill(large).join('')
      await instances.rq_cache.setItem('__quota_test__', payload)
      await instances.rq_cache.removeItem('__quota_test__')
      report.results.push({ name: 'Quota Handling', pass: true, notes: ['Stored ~1MB successfully'] })
    } catch (e) {
      report.results.push({ name: 'Quota Handling', pass: false, notes: [String(e)] })
    }

    print(report)
    return report
  }

  function print(report) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[LocalForage Multi-Instance]', report)
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(report, null, 2))
    }
  }

  return { runLocalForageMultiInstanceTests }
})


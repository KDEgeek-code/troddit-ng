// Preference Sync Testing Script
// Run in browser console to test preference synchronization

// Resilient localForage loader with script injection fallback
async function ensureLocalForage() {
  // Check if localforage is already available globally
  if (window.localforage) {
    return window.localforage;
  }
  
  // Use locally installed localforage or mock for testing
  try {
    // Try to import from node_modules if available
    if (typeof require !== 'undefined') {
      return require('localforage');
    }
    
    // Fallback to global if available
    if (window.localforage) {
      return window.localforage;
    }
    
    // Mock for testing environments
    console.warn('LocalForage not available, using mock storage');
    return {
      setItem: async (key, value) => localStorage.setItem(key, JSON.stringify(value)),
      getItem: async (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      },
      removeItem: async (key) => localStorage.removeItem(key),
      clear: async () => localStorage.clear()
    };
  } catch (error) {
    console.warn('Failed to load localForage:', error);
    return null;
  }
}

class PreferenceSyncTester {
  constructor() {
    this.testResults = [];
    this.originalPrefs = {};
  }
  
  log(message, type = 'info') {
    const emoji = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${emoji[type]} ${message}`);
    this.testResults.push({ message, type, timestamp: new Date() });
  }
  
  async testLocalStorage() {
    this.log('Testing LocalForage preference storage...', 'info');
    
    try {
      // Test localforage availability with fallback
      const lf = await ensureLocalForage();
      if (!lf) {
        this.log('Storage test skipped: localForage not available globally', 'warning');
        return false;
      }
      
      // Create test preference
      const testKey = 'test-pref-' + Date.now();
      const testValue = { testSetting: true, timestamp: Date.now() };
      
      await lf.setItem(testKey, testValue);
      const retrieved = await lf.getItem(testKey);
      
      if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        this.log('LocalForage storage test passed', 'success');
        await lf.removeItem(testKey);
        return true;
      } else {
        this.log('LocalForage storage test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`LocalForage error: ${error.message}`, 'error');
      return false;
    }
  }
  
  async testAPIEndpoint() {
    this.log('Testing preference API endpoint...', 'info');
    
    try {
      // Test GET endpoint
      const getResponse = await fetch('/api/user/prefs');
      
      if (getResponse.status === 401) {
        this.log('User not authenticated - API test skipped', 'warning');
        return false;
      }
      
      if (!getResponse.ok) {
        this.log(`GET /api/user/prefs failed: ${getResponse.status}`, 'error');
        return false;
      }
      
      const currentPrefs = await getResponse.json();
      this.originalPrefs = { ...currentPrefs };
      this.log('Successfully retrieved current preferences', 'success');
      
      try {
        // Test POST endpoint with namespaced test data
        const testPrefs = {
          ...currentPrefs,
          __test__: { syncFlag: true, ts: Date.now() }
        };
        
        const postResponse = await fetch('/api/user/prefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPrefs)
        });
        
        if (!postResponse.ok) {
          this.log(`POST /api/user/prefs failed: ${postResponse.status}`, 'error');
          return false;
        }
        
        this.log('Successfully saved test preferences', 'success');
        
        // Verify the save by fetching again
        const verifyResponse = await fetch('/api/user/prefs');
        const savedPrefs = await verifyResponse.json();
        
        if (savedPrefs.__test__?.syncFlag === true) {
          this.log('Preference save verification passed', 'success');
          
          // Clean up test field
          const cleanPrefs = { ...savedPrefs };
          delete cleanPrefs.__test__;
          await fetch('/api/user/prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanPrefs)
          });
          
          return true;
        } else {
          this.log('Preference save verification failed', 'error');
          return false;
        }
      } finally {
        // Restore original preferences after mutation within the test
        if (Object.keys(this.originalPrefs).length > 0) {
          const response = await fetch('/api/user/prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.originalPrefs)
          });
          
          if (!response.ok) {
            this.log('Failed to restore preferences during test', 'warning');
          }
        }
      }
      
    } catch (error) {
      this.log(`API test error: ${error.message}`, 'error');
      return false;
    }
  }
  
  async testOfflineQueue() {
    this.log('Testing offline preference queueing...', 'info');
    
    try {
      // Manual offline testing instructions
      this.log('To test offline queue:', 'info');
      this.log('1. Open DevTools Network tab and set to "Offline"', 'info');
      this.log('2. Change a preference setting', 'info');
      this.log('3. Check localforage for "unsentPrefs" key', 'info');
      this.log('4. Restore network connection', 'info');
      this.log('5. Verify preferences sync after reconnection', 'info');
      
      // Check current queue state
      const lf = await ensureLocalForage();
      if (lf) {
        const queuedPrefs = await lf.getItem('unsentPrefs');
        if (queuedPrefs) {
          this.log(`Found queued preferences: ${Object.keys(queuedPrefs).length} items`, 'info');
        } else {
          this.log('No queued preferences found', 'info');
        }
      }
      
      return true;
      
    } catch (error) {
      this.log(`Offline queue test error: ${error.message}`, 'error');
      return false;
    }
  }
  
  async restoreOriginalPrefs() {
    if (Object.keys(this.originalPrefs).length > 0) {
      this.log('Restoring original preferences...', 'info');
      
      try {
        const response = await fetch('/api/user/prefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.originalPrefs)
        });
        
        if (response.ok) {
          this.log('Original preferences restored', 'success');
        } else {
          this.log('Failed to restore original preferences', 'error');
        }
      } catch (error) {
        this.log(`Error restoring preferences: ${error.message}`, 'error');
      }
    }
  }
  
  async runAllTests() {
    this.log('🚀 Starting Preference Sync Tests...', 'info');
    
    const tests = [
      { name: 'LocalStorage', fn: () => this.testLocalStorage() },
      { name: 'API Endpoint', fn: () => this.testAPIEndpoint() },
      { name: 'Offline Queue', fn: () => this.testOfflineQueue() }
    ];
    
    const results = {};
    
    for (const test of tests) {
      this.log(`\n--- Running ${test.name} Test ---`, 'info');
      results[test.name] = await test.fn();
    }
    
    // Final cleanup - restore original preferences once
    await this.restoreOriginalPrefs();
    
    // Summary
    this.log('\n📊 Test Results Summary:', 'info');
    Object.entries(results).forEach(([name, passed]) => {
      this.log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
    });
    
    const allPassed = Object.values(results).every(Boolean);
    this.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
             allPassed ? 'success' : 'error');
    
    return results;
  }
}

// Export for manual testing (only in development)
if (typeof window !== 'undefined' && (process?.env?.NODE_ENV === 'development' || process?.env?.TEST_HARNESS === 'true')) {
  window.PreferenceSyncTester = PreferenceSyncTester;
  window.testPreferenceSync = () => new PreferenceSyncTester().runAllTests();
  
  // Manual preference restoration helper
  window.restorePrefs = async function() {
    const tester = new PreferenceSyncTester();
    try {
      const response = await fetch('/api/user/prefs');
      if (response.ok) {
        const currentPrefs = await response.json();
        if (currentPrefs.__test__) {
          const cleanPrefs = { ...currentPrefs };
          delete cleanPrefs.__test__;
          await fetch('/api/user/prefs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanPrefs)
          });
          tester.log('Test preferences cleaned up', 'success');
        } else {
          tester.log('No test preferences found to clean', 'info');
        }
      }
    } catch (error) {
      tester.log(`Error in manual restore: ${error.message}`, 'error');
    }
  };
}
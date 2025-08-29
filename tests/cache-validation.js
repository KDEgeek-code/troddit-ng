// Service Worker Cache Validation Script
// Run in browser console to test cache behavior

async function validateCacheStrategies() {
  console.log('🔍 Validating Service Worker Cache Strategies...');
  
  // Check if service worker is registered
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service Worker not supported');
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  console.log('✅ Service Worker registered:', registration.scope);
  
  // Check cache storage and group by URL host
  const cacheNames = await caches.keys();
  console.log('📦 Available caches:', cacheNames);
  
  const hostGroups = {};
  let totalEntries = 0;
  
  console.log('\n🔍 Analyzing cache entries by URL host...');
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    console.log(`📦 Processing cache: ${cacheName} (${keys.length} entries)`);
    
    keys.forEach(request => {
      try {
        const url = new URL(request.url);
        const host = url.host;
        
        if (!hostGroups[host]) {
          hostGroups[host] = {
            count: 0,
            urls: [],
            caches: new Set()
          };
        }
        
        hostGroups[host].count++;
        hostGroups[host].caches.add(cacheName);
        
        // Store first few URLs as examples (limit to avoid memory issues)
        if (hostGroups[host].urls.length < 3) {
          hostGroups[host].urls.push(request.url);
        }
        
        totalEntries++;
      } catch (error) {
        console.warn(`⚠️ Invalid URL in cache: ${request.url}`);
      }
    });
  }
  
  // Report by host
  console.log('\n📊 Cache Storage Analysis by URL Host:');
  console.log(`Total cached entries: ${totalEntries}`);
  console.log('─'.repeat(60));
  
  const sortedHosts = Object.entries(hostGroups)
    .sort(([,a], [,b]) => b.count - a.count);
  
  sortedHosts.forEach(([host, data]) => {
    console.log(`🌐 ${host}: ${data.count} entries`);
    console.log(`   Caches: ${Array.from(data.caches).join(', ')}`);
    if (data.urls.length > 0) {
      console.log(`   Examples: ${data.urls.slice(0, 2).join(', ')}`);
    }
    console.log('');
  });
  
  // Helper to pick a reachable API endpoint
  async function pickReachableUrl() {
    const candidateUrls = [
      '/manifest.json',
      '/api/reddit/popular.json',
      '/api/reddit/hot.json', 
      '/api/reddit/r/all.json',
      '/api/reddit/r/announcements.json',
      '/api/reddit/subreddits/popular.json'
    ];
    
    console.log('🔍 Testing candidate endpoints...');
    
    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          cache: 'no-store'
        });
        if (response.ok) {
          console.log(`✅ Found reachable endpoint: ${url}`);
          return url;
        }
      } catch (error) {
        console.log(`❌ ${url}: ${error.message}`);
      }
    }
    
    // Fallback to manifest.json if none are reachable
    console.log('⚠️ No endpoints reachable, using manifest.json fallback');
    return '/manifest.json';
  }
  
  // Test API cache (NetworkFirst)
  console.log('\n🌐 Testing API Cache (NetworkFirst)...');
  const apiUrl = await pickReachableUrl();
  
  try {
    const req = new Request(apiUrl, {credentials:'same-origin'});
    const cached = await caches.match(req);
    console.log(`📡 Response source: ${cached ? 'Cache' : 'Network'}`);
    
    const apiResponse = await fetch(apiUrl);
    console.log('✅ API request successful:', apiResponse.status);
    console.log(`🎯 Using API endpoint: ${apiUrl}`);
  } catch (error) {
    console.error('❌ API request failed:', error);
  }
  
  // Test media cache (CacheFirst) 
  console.log('\n🖼️ Testing Media Cache (CacheFirst)...');
  // Use a known asset or existing image from the page
  const testImageUrl = document.querySelector('img')?.src || '/icons/icon-192x192.png';
  try {
    const imageReq = new Request(testImageUrl);
    const cachedImage = await caches.match(imageReq);
    console.log(`🖼️ Image cache status: ${cachedImage ? 'Cached' : 'Not cached'}`);
    
    const imageResponse = await fetch(testImageUrl);
    console.log('✅ Media request successful:', imageResponse.status);
  } catch (error) {
    console.log('ℹ️ Media request failed:', error);
  }
  
  // Additional validation: Check for unexpected hosts
  console.log('\n🔍 Validation Summary:');
  const expectedHosts = [
    'www.reddit.com',
    'oauth.reddit.com', 
    'i.redd.it',
    'v.redd.it',
    'external-preview.redd.it',
    'i.imgur.com',
    'imgur.com'
  ];
  
  const foundHosts = Object.keys(hostGroups);
  const unexpectedHosts = foundHosts.filter(host => !expectedHosts.includes(host));
  
  if (unexpectedHosts.length > 0) {
    console.log('⚠️ Unexpected hosts found in cache:');
    unexpectedHosts.forEach(host => {
      console.log(`   - ${host} (${hostGroups[host].count} entries)`);
    });
  } else {
    console.log('✅ All cached hosts are expected');
  }
  
  console.log('\n✅ Cache validation complete!');
}

// Auto-run validation
validateCacheStrategies();

// Export for manual testing
window.validateCacheStrategies = validateCacheStrategies;
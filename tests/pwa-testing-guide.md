# PWA Testing Guide

This comprehensive guide provides step-by-step instructions for testing all PWA functionality in Troddit, including offline capabilities, service worker caching, installability, and preference synchronization.

## Prerequisites

Before starting PWA tests, ensure the following setup:

```bash
# Start database
docker-compose up -d db

# Install dependencies
yarn install

# Build production bundle (REQUIRED for PWA/offline/Lighthouse tests)
yarn build

# Start production server
yarn start
```

**⚠️ IMPORTANT**: PWA functionality, offline capabilities, and Lighthouse audits require a production build. Service workers and caching strategies are only fully active in production mode (`yarn build && yarn start`). Development mode (`yarn dev`) disables many PWA features for better development experience.

## 1. Offline Functionality Testing

### Service Worker Registration
- Open Chrome DevTools → Application → Service Workers
- Verify service worker is registered and active
- Check for any registration errors in console
- Ensure service worker script URL shows correct path

**Expected Results:**
- Status: "activated and is running"
- No console errors
- Service worker controls the page

### Network Throttling Tests
- DevTools → Network → Throttling → Offline
- Navigate to different pages and verify fallback.html appears
- Test navigation between cached pages
- Verify media loads from cache when available

**Test Steps:**
1. Browse to several pages while online
2. Enable offline mode in DevTools
3. Try navigating to new pages → should show fallback
4. Try navigating to previously visited pages → should load from cache
5. Check that images/media display from cache

### Fallback Page Validation
- Go offline and navigate to uncached route
- Verify fallback.html displays with proper branding
- Test "Try Again" button functionality
- Verify auto-retry when connection restored

**Expected Results:**
- Fallback page displays Troddit branding
- "Try Again" button triggers navigation retry
- Auto-retry occurs every 5 seconds when online
- Success navigation when connection restored

### Cache Strategy Verification
- DevTools → Application → Storage → Cache Storage
- Verify presence of cache buckets by pattern (names may vary by environment)
- Check cache entries for API responses and media files  
- Test cache expiration and refresh behavior

**Expected Cache Patterns:**
- Runtime cache (e.g., `workbox-runtime-https://localhost:3000/` or similar)
- API cache (containing `reddit-api-cache` or similar pattern)
- Images cache (containing `reddit-images-cache` or similar pattern)
- Videos cache (containing `reddit-videos-cache` or similar pattern)
- External media cache (containing `imgur-cache` or similar pattern)

**Note:** Cache names may differ between `http://localhost` and `https://localhost` in development. Look for the pattern rather than exact names.

## 2. PWA Installability Testing

### Lighthouse PWA Audit
- Run Lighthouse audit in Chrome DevTools
- Target score: 90+ for PWA category
- Verify all PWA criteria are met
- Check for manifest and service worker validation

**Command Line Alternative:**
```bash
# For production build testing with Lighthouse (REQUIRED)
npm run test:pwa:prod

# Alternative: existing lighthouse-only script
npm run test:lighthouse:prod

# Manual production build + test
yarn build && yarn start
# Then in another terminal:
npm run test:lighthouse
```

**Expected Results:**
- PWA score ≥ 90
- All PWA criteria pass:
  - ✅ Registers a service worker
  - ✅ Responds with a 200 when offline
  - ✅ Has a web app manifest
  - ✅ Uses HTTPS
  - ✅ Provides a valid apple-touch-icon

### Installation Flow Testing
- Test install prompt appearance in supported browsers
- Verify installation on desktop (Chrome, Edge)
- Test installation on mobile devices (Android Chrome, iOS Safari)
- Validate app icon and name display correctly

**Test Steps:**
1. Visit site in Chrome
2. Look for install prompt in address bar
3. Click install button
4. Verify app installs to desktop/home screen
5. Launch installed app
6. Verify app runs in standalone mode

### Manifest Validation
- DevTools → Application → Manifest
- Verify all manifest properties load correctly
- Test shortcuts functionality after installation
- Validate scope and start_url behavior

**Expected Manifest Properties:**
- Name: "Troddit"
- Short name: "Troddit"
- Theme color: "#FF4500"
- Background color: "#1a1a1b"
- Display: "standalone"
- Scope: "/"
- Start URL: "/"

## 3. Preference Sync Testing

### Cross-Device Synchronization
- Login on Device A, modify preferences
- Login on Device B with same account
- Verify preferences sync automatically
- Test conflict resolution (server precedence)

**Test Steps:**
1. Device A: Login and change theme to dark
2. Device A: Change auto-play setting
3. Device B: Login with same account
4. Device B: Verify theme is dark and auto-play matches
5. Device B: Change font size
6. Device A: Refresh → verify font size updated

### Offline Preference Handling
- Go offline, modify preferences
- Verify "queued" toast notification appears
- Come back online, verify automatic sync
- Check for sync success notification

**Test Steps:**
1. Go offline (DevTools Network → Offline)
2. Navigate to Settings
3. Change any preference (theme, layout, etc.)
4. Verify "Preferences queued (offline)" toast appears
5. Go online
6. Verify "Preferences synced" toast appears within 10 seconds

### Session Persistence
- Modify preferences while logged in
- Close and reopen browser
- Verify preferences persist across sessions
- Test logout/login preference retention

**Test Steps:**
1. Login and set preferences
2. Close browser completely
3. Reopen browser and navigate to site
4. Verify preferences are restored
5. Logout and login again
6. Verify server preferences override local ones

## 4. Service Worker Caching Validation

### API Caching (NetworkFirst)
- Monitor Network tab while browsing
- Verify API calls hit network first, then cache
- Test 5-minute cache expiration
- Validate offline API response from cache

**Test Steps:**
1. Clear cache and reload
2. Browse subreddits → verify API calls in Network tab
3. Refresh same subreddit → verify faster load from cache
4. Wait 6 minutes and refresh → verify network call made
5. Go offline and browse → verify cache serves responses

### Media Caching (CacheFirst)
- Load images/videos, verify cache storage
- Test offline media loading from cache
- Verify 30-day cache expiration
- Test range request support for videos

**Test Steps:**
1. Browse posts with images/videos
2. Check Cache Storage → verify media files cached
3. Go offline
4. Browse same posts → verify media loads from cache
5. Test video playback → verify range requests work

### Cache Size Management
- Fill cache to near quota limits
- Verify purgeOnQuotaError behavior
- Test maxEntries enforcement
- Monitor cache cleanup on storage pressure

**Test Steps:**
1. Browse extensively to fill caches
2. Check cache sizes in DevTools
3. Monitor for quota exceeded errors
4. Verify oldest entries purged automatically

### Service Worker Update and Cache Invalidation
Test service worker lifecycle and cache invalidation when updates occur.

**Test Steps for Service Worker Updates:**
1. Note current service worker version (DevTools → Application → Service Workers)
2. Modify service worker version in `next.config.js` or rebuild application
3. Reload the page → verify "New version available" message appears
4. Check DevTools → Service Workers → verify new SW is "waiting to activate"
5. Close all tabs and reopen → verify new SW becomes "activated"
6. Verify old caches are purged and new runtime caches are created
7. Test that clients are properly controlled by new service worker

**Expected Results:**
- Update notification appears when new SW detected
- Proper transition from old to new service worker
- Cache cleanup occurs during SW update
- All clients controlled by updated service worker
- No duplicate cache buckets after update

**Test Steps for Cache Invalidation:**
1. Load content and verify it's cached (check Cache Storage)
2. Update service worker version to trigger cache invalidation
3. Reload application with new service worker
4. Verify old cache buckets are deleted
5. Browse to same content → verify new cache entries created
6. Check that cache names/versions match new service worker

**Expected Results:**
- Old caches removed during service worker update
- New cache buckets created with updated versioning
- Content re-cached with new service worker strategies
- No stale data from previous cache versions

**Manual Testing Commands:**
```bash
# Update service worker version
# Edit next.config.js → modify workbox settings
# OR rebuild to get new SW hash

# Force service worker update
# In DevTools → Application → Service Workers → "Update on reload"
```

## 5. Database Integration Testing

### PostgreSQL Connection
- Verify database container is running
- Test connection health endpoint
- Validate user preferences table

**Test Steps:**
1. `docker-compose ps` → verify db container running
2. Check container logs: `docker-compose logs db`
3. Visit `/api/health` → verify database connection
4. Check preferences API: `/api/user/prefs`

### User Preferences CRUD
- Test creating new user preferences
- Test updating existing preferences
- Test retrieving user preferences
- Test preference validation

## 6. React Query Persistence Testing

### Feed Data Persistence
Test that React Query persists feed data across browser sessions and offline scenarios.

**Test Steps:**
1. Browse to a subreddit (e.g., `/r/popular`)
2. Scroll through several pages of posts (infinite scroll)
3. Wait for all content to load
4. Refresh the page → verify posts appear immediately from persisted cache
5. Navigate to another subreddit, then back → verify posts load from cache
6. Go offline (DevTools Network → Offline)
7. Navigate to the same subreddit → verify previously seen content still renders
8. Try scrolling to previously loaded pages → verify content available offline

**Expected Results:**
- Content loads immediately on refresh (no loading spinners for cached data)
- Previously viewed pages render completely when offline
- Infinite scroll pages remain accessible after browser restart
- No network requests for cached feed data when offline

### Query Cache Validation
Verify React Query cache is properly persisted and restored.

**Test Steps:**
1. Open DevTools → Application → IndexedDB
2. Look for React Query persistence storage (usually `react-query-offline-cache` or similar)
3. Browse several subreddits to populate cache
4. Close browser completely
5. Reopen browser and check IndexedDB → verify cache data persists
6. Navigate to previously viewed subreddit → verify instant loading from cache
7. Check Network tab → verify no duplicate API calls for cached data

**Expected Results:**
- IndexedDB contains React Query cache data
- Cache persists across browser sessions
- No redundant network calls for cached queries
- Seamless restoration of app state from persisted queries

### Offline Query Behavior
Test React Query behavior when network is unavailable.

**Test Steps:**
1. Load several subreddits while online
2. Go offline (DevTools Network → Offline)
3. Navigate between previously loaded subreddits → verify content displays
4. Try loading new subreddit → verify appropriate error/fallback handling
5. Go back online
6. Navigate to new subreddit → verify network requests resume
7. Check that cached data remains available alongside new data

**Expected Results:**
- Cached queries serve data when offline
- New queries fail gracefully with user-friendly messages
- Transition back online restores full functionality
- Cache and network data coexist properly

## 7. Error Handling Testing

### Network Error Scenarios
- Test API timeout handling
- Test server 500 error responses
- Test preference sync failures
- Test service worker update failures

### Authentication Error Handling
- Test expired token scenarios
- Test invalid authentication
- Test missing user data
- Test preference sync without auth

## Troubleshooting Common Issues

### Service Worker Not Registering
- Check for HTTPS (required for SW)
- Verify service worker script path
- Clear browser cache and storage
- Check for JavaScript errors

### PWA Install Prompt Not Showing
- Ensure all PWA criteria met
- Check manifest file validity
- Verify service worker is active
- Try in incognito mode

### Preference Sync Not Working
- Verify user is logged in
- Check API endpoints return 200
- Verify database is running
- Check for authentication errors

### Cache Not Working
- Verify service worker is active
- Check cache storage in DevTools
- Clear cache and test again
- Check for quota exceeded errors

## Performance Testing

### Core Web Vitals
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### PWA-Specific Metrics
- Service worker registration time
- Cache hit rate for API calls
- Cache hit rate for media
- Offline page load time

## Browser Compatibility

Test PWA functionality across browsers:
- ✅ Chrome 88+ (full PWA support)
- ✅ Edge 88+ (full PWA support)
- ⚠️ Firefox (service worker support, limited install)
- ⚠️ Safari 14+ (limited PWA support)
- ✅ Mobile Chrome (full PWA support)
- ⚠️ Mobile Safari (limited PWA support)

## Automated Testing Scripts

Run the provided testing scripts for comprehensive validation:

```bash
# Run all PWA tests (PRODUCTION BUILD REQUIRED)
npm run test:pwa:prod

# Run Lighthouse audit only (PRODUCTION BUILD REQUIRED)
npm run test:lighthouse:prod

# Setup test environment
npm run test:setup

# Manual production build + test
npm run build:prod && npm run start:prod
# Then in another terminal:
npm run test:lighthouse
```

Browser console scripts are available in:
- `tests/cache-validation.js`
- `tests/preference-sync-test.js`

## Success Criteria

The PWA implementation passes testing when:
- ✅ Lighthouse PWA score ≥ 90
- ✅ App installs successfully on all supported browsers
- ✅ Offline functionality works without errors
- ✅ Service worker caches resources correctly
- ✅ Preferences sync across devices reliably
- ✅ No console errors during normal operation
- ✅ Performance metrics meet Core Web Vitals thresholds
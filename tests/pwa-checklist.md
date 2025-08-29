# PWA Testing Checklist

## Pre-Testing Setup
- [ ] Start database: `docker-compose up -d db`
- [ ] **Build production bundle: `yarn build` (REQUIRED)**
- [ ] **Start production server: `yarn start` (REQUIRED)**
- [ ] Open Chrome DevTools
- [ ] Clear browser cache and storage
- [ ] Ensure test user account is available

**⚠️ CRITICAL**: PWA tests MUST use production builds (`yarn build && yarn start`). Development mode disables service workers and caching for development efficiency.

## 1. Service Worker Validation
- [ ] Service worker registers successfully
- [ ] No console errors during registration
- [ ] Service worker activates and takes control
- [ ] Service worker updates properly on code changes
- [ ] Workbox runtime caching rules are applied

## 2. Offline Functionality
- [ ] Fallback page displays when offline
- [ ] Fallback page has correct branding and styling
- [ ] "Try Again" button works
- [ ] Auto-retry on connection restore works
- [ ] Previously cached pages load offline
- [ ] Cached media displays offline
- [ ] API responses serve from cache when offline

## 3. Caching Strategies
### Reddit API Caching (NetworkFirst)
- [ ] API calls hit network first when online
- [ ] API responses cached for 5 minutes
- [ ] Stale cache serves when network fails
- [ ] Cache size limits respected (100 entries)
- [ ] Cache purges on quota error

### Media Caching (CacheFirst)
- [ ] Images cache on first load
- [ ] Videos cache with range request support
- [ ] Media serves from cache on subsequent loads
- [ ] 30-day cache expiration works
- [ ] Cache size limits respected (50-200 entries)

## 4. PWA Installability
- [ ] Lighthouse PWA score ≥ 90
- [ ] Install prompt appears in Chrome
- [ ] App installs successfully on desktop
- [ ] App installs successfully on mobile
- [ ] Installed app has correct icon and name
- [ ] App shortcuts work after installation
- [ ] App scope and start URL work correctly

## 5. Manifest Validation
- [ ] Manifest loads without errors
- [ ] All required fields present
- [ ] Icons display correctly
- [ ] Theme colors apply properly
- [ ] Shortcuts navigate correctly
- [ ] Categories and scope are valid

## 6. User Preference Sync
### Authentication Required
- [ ] Login with Reddit account
- [ ] Preferences load from server on login
- [ ] Local preferences merge with server preferences
- [ ] Server preferences take precedence on conflicts

### Cross-Device Sync
- [ ] Change preferences on Device A
- [ ] Login on Device B with same account
- [ ] Preferences sync automatically
- [ ] Changes reflect immediately

### Offline Preference Handling
- [ ] Go offline, modify preferences
- [ ] "Queued (offline)" toast appears
- [ ] Come online, preferences sync automatically
- [ ] "Preferences synced" toast appears
- [ ] No data loss during offline period

### Session Persistence
- [ ] Preferences persist across browser restarts
- [ ] Preferences persist across logout/login
- [ ] Local fallback works when server unavailable

## 7. Performance Optimization
- [ ] Preconnect links reduce connection time
- [ ] DNS prefetch improves resource loading
- [ ] React Query persistence reduces API calls
- [ ] Debounced preference saves reduce server load

## 8. Error Handling
- [ ] Network errors display appropriate messages
- [ ] Authentication errors handled gracefully
- [ ] Database errors don't crash the app
- [ ] Preference validation errors are user-friendly
- [ ] Service worker errors are logged properly

## 9. Database Integration
- [ ] PostgreSQL container starts successfully
- [ ] Database schema initializes correctly
- [ ] User preferences table created
- [ ] CRUD operations work correctly
- [ ] Data persistence across container restarts

## 10. Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## Post-Testing Cleanup
- [ ] Clear test data from database
- [ ] Reset user preferences to defaults
- [ ] Clear browser cache and storage
- [ ] Document any issues found
- [ ] Update implementation if needed

## Tools Used
- [ ] Chrome DevTools (Application, Network, Console)
- [ ] Lighthouse PWA audit
- [ ] Network throttling simulation
- [ ] Browser console testing scripts
- [ ] Cross-device testing

## Success Criteria
- All checklist items pass ✅
- Lighthouse PWA score ≥ 90
- No console errors during normal usage
- Smooth offline/online transitions
- Reliable preference synchronization
- Fast loading and responsive UI
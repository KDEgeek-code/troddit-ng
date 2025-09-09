# Media Manual Testing Guide

This guide provides step-by-step instructions for manually testing Troddit’s media functionality across video (HLS), images, controls, responsive behavior, autoplay, performance, and accessibility.

## Prerequisites and Setup
- Development environment: Node 18+, npm/yarn installed.
- Build and run: `npm run build && npm start` opens http://localhost:3000.
- Browsers: Chrome, Firefox, Safari, Edge (latest stable); mobile devices or emulators.
- Test content: Use posts with v.redd.it, image galleries, Twitter embeds, Imgur images.
- Network simulation: Chrome DevTools throttling (Slow 3G, Fast 3G); offline checkbox.
- Devices: iPhone/iPad (iOS Safari), Android (Chrome), desktop.

## HLS Video Playback Testing
- Navigate to a v.redd.it post; verify video loads with poster.
- Quality selection: Switch between full/hd/sd/min where available and observe clarity.
- Error recovery: Throttle to offline mid-playback; return online; verify resume without reload.
- Autoplay and mute: Reload page; ensure autoplay occurs according to settings; if blocked, video should mute and start.
- Cross-browser: Repeat in Chrome, Firefox, Safari, and Edge.

## Image Loading and Caching Testing
- Load posts with i.redd.it, preview.redd.it, external-preview.redd.it, i.imgur.com.
- Open DevTools Application > Cache Storage; confirm media cache entries and hits.
- Responsive selection: Resize window and verify image resolution changes sensibly.
- Gallery: Open gallery posts, navigate carousel; verify preloading and smoothness.
- Error handling: Temporarily block an image URL; ensure placeholder/fallback behavior.

## Media Controls Testing
- Play/pause: Click video area and play button; keyboard: space/k to toggle.
- Volume/mute: Adjust slider and toggle mute; confirm persistence after refresh.
- Seeking: Click and drag progress; verify accurate seeking and time display.
- Touch: On mobile, test tap to play, long press, seek gestures.

## Responsive Design Testing
- Resize viewport across 360, 640, 768, 1024, 1280 widths.
- Verify column and card style adaptations and uniform heights where configured.
- Test media modal on small screens; verify controls remain usable.
- Maintain aspect ratio across rotations and window resizes.

## Autoplay Behavior Testing
- With autoplay enabled, scroll videos into view; verify play/resume/pause with visibility.
- With hover play enabled, verify hover-to-play and audio-on-hover.
- Mobile: iOS Safari requires muted autoplay; verify mute fallback.
- Intersection thresholds: Confirm only plays when at least ~80% visible in feed.

## Performance Testing Procedures
- Enable Performance panel, record while loading posts with media.
- LCP/CLS: Ensure large media does not cause layout shifts; observe final LCP.
- Memory: Monitor for leaks during long playback or gallery navigation.
- Battery/CPU: On mobile, watch battery drain and temperature during extended usage.

## Accessibility Testing
- Keyboard: Tab through controls; verify visible focus and logical order.
- Screen reader: VoiceOver/TalkBack announcements for play/pause, mute, time updates.
- ARIA: Validate labels for play/pause and controls via axe/Lighthouse.
- Reduced motion: With prefers-reduced-motion, ensure autoplay respects user preference.

## Cross-Browser Testing
- Chrome desktop/mobile
- Safari desktop/iOS (autoplay and viewport quirks)
- Firefox (media extensions/EME differences)
- Edge (Chromium parity)

## Mobile-Specific Testing
- iOS Safari: Autoplay muted, viewport height changes on scroll; controls sizing 44x44px.
- Android Chrome: Verify autoplay and background behavior; back button navigation.
- Gestures: Swipe gallery, pinch-to-zoom images if supported.
- Network: Test on cellular-like throttling.

## Error Scenario Testing
- Network errors: Offline toggle during image/video loads; verify recovery once online.
- Service worker: Clear caches; reload; confirm CacheFirst re-populates.
- Browser crash/reload: Restore state and resume playback sensibly.
- Unsupported formats: Ensure graceful degradation with error messages.

## Integration Testing
- Full flow: Browse feed, open post, play media, switch quality, navigate gallery, open modal.
- Context switching: Toggle autoplay, hoverplay, audio-on-hover, highRes; verify immediate effect.
- Persistence: Refresh page; confirm settings persist via LocalForage.
- Real-world: Use varied subreddits with mixed content.

## Troubleshooting and Diagnostics
- Use tests/browser-console-media-debugger.js in DevTools Console for live helpers (window.*).
- Check Network panel for 206 responses on video and cache status codes/hits.
- Observe Workbox logs in console (if enabled) for cache strategies.
- Validate CSP in response headers for blocked images/frame/navigation.

## Test Documentation
- Record results with screenshots and HAR files.
- File issues with reproduction steps, URLs, browser/device info, and logs.
- Track regressions by comparing Lighthouse/Perf panel metrics across runs.
- Store artifacts in tests/reports (JSON/HTML) when possible.


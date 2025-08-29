# Task Completion Checklist

When completing any development task in the Troddit project:

## 1. Code Quality Checks
- [ ] Run linting: `yarn lint`
- [ ] Fix any linting errors or warnings
- [ ] Ensure TypeScript compilation succeeds: `yarn build`
- [ ] Test in development mode: `yarn dev`

## 2. PWA Specific Checks
- [ ] Clear browser cache/service worker if testing PWA changes
- [ ] Test offline functionality with network disabled
- [ ] Verify manifest.json changes reflect correctly
- [ ] Check service worker registration in browser DevTools

## 3. Pre-commit Verification
- [ ] Review changes with `git diff`
- [ ] Ensure no console.log statements left in production code
- [ ] Verify no sensitive data (API keys, secrets) in commits
- [ ] Test both authenticated and unauthenticated flows
- [ ] Check responsive design on mobile viewports

## 4. Documentation
- [ ] Update CLAUDE.md if architectural changes made
- [ ] Update README.md for new features
- [ ] Add comments for complex logic (sparingly)
- [ ] Update ROADMAP_PWA_PREFS.md if completing roadmap items
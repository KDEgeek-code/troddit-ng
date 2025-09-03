# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Troddit is a Next.js 14 + React 18 TypeScript app that provides an alternative Reddit web UI with PWA/offline support, media-heavy feeds, and optional server-side preference sync backed by Postgres.
- Primary packages: next, next-auth, next-pwa, @tanstack/react-query, tailwindcss, axios, pg.
- Package manager: Yarn 1 (pinned in package.json). Node 18 recommended (Docker uses node:18-alpine).

Common commands
- Install
  - yarn install
- Dev server
  - yarn dev
  - With local Postgres for dev (optional, for preference sync): docker-compose up -d db && yarn dev
  - Or: yarn dev:full (starts db via docker-compose and runs dev)
- Build and run production
  - yarn build
  - yarn start
  - Note: PWA, service worker, and Lighthouse tests must use a production build (build + start)
- Lint
  - yarn lint
- Tests and audits
  - PWA/Lighthouse (runs against http://localhost:3000):
    - Production build + run + audit: npm run test:lighthouse:prod
    - Already running prod server: npm run test:lighthouse
  - Full PWA test workflow (build, start, audit): npm run test:pwa:prod
  - Test setup helper (starts db only): npm run test:setup
  - Cache validation and preference sync “tests” are browser-console scripts:
    - tests/cache-validation.js
    - tests/preference-sync-test.js
  - Single test: there is no unit test framework; to run a single audit use npm run test:lighthouse
- Docker
  - Build and run with Compose: docker-compose up (exposes app on 3000, db on 5432 locally)
  - Build image manually: docker build . -t troddit
  - Run built image: docker run -p 3000:3000 troddit
  - Logs: docker-compose logs -f

What matters in this codebase (architecture)
- Routing and pages
  - Next.js file-based routing in src/pages. API routes live under src/pages/api (auth callbacks, Reddit proxy, preferences).
- Data access and API
  - All Reddit API consumption is centralized in src/RedditAPI.ts
    - Supports both public endpoints (www.reddit.com) and OAuth endpoints (oauth.reddit.com)
    - Respects rate limiting; switches paths based on session and premium/free flags
  - API proxy for OAuth requests: src/pages/api/reddit/[...multi].ts
    - Forwards method and Authorization header to oauth.reddit.com/api/…
- State and data fetching
  - Client/server state split with @tanstack/react-query for fetching/caching, plus custom hooks in src/hooks (e.g., useFeed, useThread, useSubreddit, useUserPrefs, etc.).
  - Global app state via React Context providers:
    - MainContext (src/MainContext.tsx): app-level UI state, feed state, local persistence, convenience actions, and orchestrates preference sync across other contexts via useUserPrefs.
    - Additional contexts in src/contexts (UIContext, MediaContext, FilterContext) hold structured user preferences for layout, media behavior, and filtering; MainContext builds a map of these for sync.
- Preferences and persistence
  - Client-side persistence: localforage instances for read/seen posts and local collections.
  - Server-side (optional, requires DB):
    - DB pool and SSL behavior: src/server/db.ts
    - Preferences API: src/pages/api/user/prefs.ts (JWT via next-auth; upsert JSONB with rate limiting). Docker Compose provides a PostgreSQL service and seeds db/init.sql.
- Authentication
  - next-auth (src/pages/api/auth/[...nextauth].ts). README documents Reddit OAuth env vars. Clerk is present as a dependency; next-auth is the primary auth path in code.
- PWA and runtime caching
  - next.config.js configures next-pwa with:
    - NetworkFirst for Reddit API (5-minute cache)
    - CacheFirst with rangeRequests for v.redd.it and other media domains (30 days)
    - Offline fallback at public/fallback.html
    - Security headers include a strict CSP, HSTS, COOP/CORP; image domains whitelisted for Next Image.
  - Analytics proxy via next-plausible rewrites.
- UI composition
  - Components organized by feature (src/components/*). Media handling (components/media), settings panels (components/settings), and card variants (components/cards). Feed composition in components/Feed.tsx with error boundaries and refresh controls.

Environment and configuration
- Copy .env.example to .env.local and set the following for auth and local development (see README for details):
  - CLIENT_ID, CLIENT_SECRET, REDDIT_REDIRECT, NEXTAUTH_SECRET, NEXTAUTH_URL, SIGNING_PRIVATE_KEY
- Preference sync DB in local/dev:
  - DATABASE_URL or PG* variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE). docker-compose sets DATABASE_URL for the app service.
  - PGSSLMODE (compose sets disable for local dev). src/server/db.ts auto-detects SSL needs by env and URL.
- Optional client flags:
  - NEXT_PUBLIC_FREE_ACCESS (default true) to gate certain premium actions
  - NEXT_PUBLIC_ENABLE_API_LOG (default false) for logging API usage

Project docs and checklists worth using
- README.md: quickstart, environment variables, Docker usage
- tests/pwa-testing-guide.md: step-by-step PWA/offline/service worker validation (requires prod build)
- tests/pwa-checklist.md: concise checklist for PWA criteria and success metrics

Other agent rules in this repo (for awareness)
- CLAUDE.md: mirrors the high-level architecture, commands (yarn dev/build/start/lint), and env requirements described above.
- Cursor rules: .cursor/rules/after_each_chat.mdc enforces that after each Cursor chat, a JSON summary is written to tmp/summary-<timestamp>.json. This is a Cursor automation and does not affect app runtime.

Notes
- Yarn v1 is pinned via package.json; prefer Yarn commands for day-to-day dev. npm scripts exist for certain test flows (e.g., test:lighthouse:prod) and can be invoked with npm run … or yarn run ….

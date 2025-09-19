Troddit is an alternative, privacy‑friendly web client for Reddit built with Next.js (React 18) and Tailwind CSS. It supports browsing in multiple layouts (columns, rows, gallery), inline media, search, and an optional login flow to enable voting, commenting, and managing subscriptions. You can also use it in an “offline mode” to follow subreddits locally without logging in. The app ships as a PWA and has Docker support for easy deployment.

Project layout (key parts):
- src/pages: Next.js routes (API routes under src/pages/api). Subreddit/user/search pages and dynamic front page routing live here.
- src/components: UI building blocks (cards, media, search, settings, toast) and collections.
- src/hooks: Reusable React hooks (including pan/zoom behavior). Contexts like MainContext.tsx and PremiumAuthContext.tsx live at src root.
- lib: Analytics and various utilities (utils.ts).
- public: Static assets, PWA manifest, favicon, and loaders.
- styles: Global Tailwind styles.
- types: Shared TypeScript declarations.
Configuration lives at next.config.js, tailwind.config.js, tsconfig.json, and postcss.config.js.

Getting started:
- Install: yarn (or npm i)
- Dev server: yarn dev (or npm run dev), then open http://localhost:3000
- Build: yarn build; Start: yarn start
- Lint: yarn lint
There is no dedicated test suite in this repository at present. For authentication, create a .env.local with CLIENT_ID, CLIENT_SECRET, REDDIT_REDIRECT, NEXTAUTH_SECRET, NEXTAUTH_URL, and SIGNING_PRIVATE_KEY (see README for details). Without these, you can still browse in offline mode.

Docker: docker-compose up to build and run, or docker build . -t troddit && docker run -p 3000:3000 troddit. See README for additional details and screenshots.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Troddit is an alternative front-end web client for Reddit built with Next.js, React, and TypeScript. It provides a modern, responsive interface for browsing Reddit content with features like PWA support, offline mode, and customizable layouts.

## Common Development Commands

```bash
# Install dependencies
yarn install

# Run development server (port 3000)
yarn dev

# Build production bundle
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript (non-strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context (MainContext, MySubs, PremiumAuthContext)
- **Data Fetching**: @tanstack/react-query with axios
- **Authentication**: NextAuth.js with Reddit OAuth & Clerk
- **PWA**: next-pwa with extensive service worker caching
- **Database**: Supabase (for premium features)

### Key Architectural Patterns

#### API Integration
- Reddit API calls are centralized in `src/RedditAPI.ts`
- Two modes: OAuth (authenticated) and public API access
- API proxy endpoints in `src/pages/api/reddit/[...multi].ts`
- Rate limiting detection and handling built-in

#### Context Providers Structure
The app uses nested context providers for different concerns:
1. **MainContext**: Global app state, settings, UI preferences
2. **MySubs**: User's subscribed subreddits management
3. **PremiumAuthContext**: Premium/free tier access control
4. **CollectionContext**: Multi-reddit collections management

#### Component Organization
- **Pages**: Next.js file-based routing in `src/pages/`
- **Components**: Organized by feature in `src/components/`
  - Core UI components (Feed, Post, Comments, Gallery)
  - Media handlers in `components/media/`
  - Settings components in `components/settings/`
  - Card variations in `components/cards/`
- **Hooks**: Custom React hooks in `src/hooks/` for data fetching and UI logic

#### PWA & Caching Strategy
- Service worker configuration in `next.config.js`
- Aggressive caching for Reddit media (30 days)
- Network-first for API calls (5 min cache)
- Offline fallback page at `public/fallback.html`

### Environment Configuration

Required environment variables for full functionality:
- `CLIENT_ID`: Reddit app ID
- `CLIENT_SECRET`: Reddit app secret
- `REDDIT_REDIRECT`: OAuth callback URL
- `NEXTAUTH_SECRET`: NextAuth encryption key
- `NEXTAUTH_URL`: Application URL
- `SIGNING_PRIVATE_KEY`: JWT signing key

Optional flags:
- `NEXT_PUBLIC_FREE_ACCESS`: Enable/disable free tier (default: true)
- `NEXT_PUBLIC_ENABLE_API_LOG`: Enable API request logging (default: false)

### Key Files to Know

- `src/RedditAPI.ts`: All Reddit API interaction logic
- `src/MainContext.tsx`: Global app state and settings
- `src/hooks/useFeed.tsx`: Main feed loading logic
- `src/components/Feed.tsx`: Feed rendering component
- `next.config.js`: PWA and caching configuration
- `src/pages/api/reddit/[...multi].ts`: API proxy endpoint
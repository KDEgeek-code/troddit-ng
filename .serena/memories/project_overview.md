# Troddit Project Overview

## Purpose
Troddit is an alternative front-end web client for Reddit built with Next.js, React, and TypeScript. It provides a modern, responsive interface for browsing Reddit content with enhanced features like PWA support, offline mode, customizable layouts, and multiple viewing modes.

## Tech Stack
- **Framework**: Next.js 14.2.30 with React 18.2.0
- **Language**: TypeScript 5.8.3 (non-strict mode)
- **Styling**: Tailwind CSS 3.0.24
- **State Management**: React Context (MainContext, MySubs, PremiumAuthContext)
- **Data Fetching**: @tanstack/react-query 4.28.0 with axios
- **Authentication**: NextAuth.js 4.22.0 with Reddit OAuth & Clerk 4.29.7
- **PWA**: next-pwa 5.6.0 with extensive service worker caching
- **Database**: Supabase for premium features (planned: self-hosted Postgres)
- **Analytics**: Plausible (via next-plausible)
- **Package Manager**: Yarn 1.22.19

## Key Architecture
- Reddit API integration centralized in `src/RedditAPI.ts`
- API proxy endpoints in `src/pages/api/reddit/[...multi].ts`
- Component organization by feature in `src/components/`
- Custom hooks in `src/hooks/` for data fetching and UI logic
- Nested context providers for different concerns
- Service worker configuration in `next.config.js` with comprehensive caching strategies
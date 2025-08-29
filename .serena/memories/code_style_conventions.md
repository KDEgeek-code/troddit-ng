# Code Style and Conventions

## Naming Conventions
- **Files**: PascalCase for components (Feed.tsx), camelCase for utilities (useFeed.tsx)
- **Variables/Functions**: camelCase (getUserData, isLoading)
- **Components**: PascalCase (MainContext, PostCard)
- **CSS Classes**: Tailwind utility classes, avoid custom CSS
- **API Routes**: kebab-case with [...param] for catch-all

## TypeScript Usage
- Non-strict mode enabled
- Prefer interfaces over types for objects
- Use type inference where possible
- Avoid `any` type, use `unknown` if type is truly unknown

## React Patterns
- Functional components with hooks (no class components)
- Custom hooks prefixed with "use" (useFeed, useSession)
- Context for global state management
- React Query for server state and caching

## File Organization
- Pages in `src/pages/` following Next.js routing
- Components grouped by feature in `src/components/`
- Shared hooks in `src/hooks/`
- API utilities in `src/RedditAPI.ts`
- Context providers at `src/` root level

## Import Style
- Absolute imports from `src/` base
- Group imports: React/Next → External libs → Internal components → Styles
- Prefer named exports for components

## Best Practices
- Keep components focused and single-responsibility
- Extract complex logic to custom hooks
- Use React Query for data fetching, not useEffect
- Implement error boundaries for robust error handling
- Optimize images with Next.js Image component where applicable
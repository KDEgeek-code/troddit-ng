# Troddit Development Startup Checklist

Use this checklist to verify that the Troddit dev server starts cleanly and core functionality works before deeper testing.

## 1. Development Server Startup

- Command: `npm run dev`
- Expect: Next.js dev server listening on `http://localhost:3000`
- Verify:
  - Console shows no build errors; warnings are noted.
  - HMR works: edit a trivial UI string and confirm hot reload applies without full refresh.
  - Health check: `curl -I http://localhost:3000` returns `200`.

## 2. Basic Page Loading

- Open: `http://localhost:3000`
- Verify:
  - Page renders without red errors in the browser console.
  - CSS loaded: layout and styles look correct on initial render.
  - Responsive behavior: test widths ~360px, 768px, 1024px, 1440px.
  - No network errors for critical assets.

## 3. Navigation Testing

- Routes: `/`, `/settings`, `/about` (and any other visible links in NavBar)
- Verify:
  - Clicking links updates the URL and loads the corresponding content.
  - Browser back/forward maintain correct UI state and content.
  - Document title updates appropriately on route change.
  - Deep-linking: paste a route URL in the address bar and load directly.

## 4. Component Rendering

- `NavBar` (src/components/NavBar.tsx)
  - Visible on pages that include it; all key interactive controls are present (menu, search, icons, etc.).
  - Interactions (e.g., menus, toggles) open/close without errors.
- `Feed` (src/components/Feed.tsx)
  - Renders initial content and loading states; shows posts.
  - Infinite scroll or pagination behaves as expected.
- `Search`
  - Typing does not error; submit triggers expected navigation or results.
- Modals
  - Any dropdowns/modals open/close; focus is trapped where appropriate.

## 5. Quick Troubleshooting Tips

- If the server doesn’t start:
  - Remove `.next/` and retry: `rm -rf .next && npm run dev`
  - Ensure env vars for dev are set if required.
- If HMR fails:
  - Hard refresh and retry; confirm no custom service worker interference in dev.
- If styles don’t load:
  - Check CSS import order and that dev CSS pipeline logs no errors.


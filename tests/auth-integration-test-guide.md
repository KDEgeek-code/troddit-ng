# Authentication Integration Manual Test Guide

This guide walks you through end-to-end manual testing of Reddit OAuth via NextAuth, token management, user preferences API behavior, and database integration in a local development environment.

## Prerequisites Setup
- Install Node.js and package manager (npm/yarn/pnpm).
- Clone the repository and install dependencies: `yarn install` or `npm install`.
- Ensure Docker and Docker Compose are installed for local PostgreSQL.
- Copy `.env.example` to `.env.local` and populate required variables (see checklist below).
- Start database: `docker-compose up -d db` and wait for health check to pass.
- Start the app: `npm run dev` and ensure it listens on `http://localhost:3000`.

## Reddit OAuth Application Setup
1. Go to https://www.reddit.com/prefs/apps and click “create app”.
2. Choose type “web app”, set a name and description.
3. Add redirect URI: `http://localhost:3000/api/auth/callback/reddit`.
4. Save and note the Client ID (under the app name) and Client Secret.
5. Enable required scopes: identity, mysubreddits, read, edit, vote, submit, report, save, subscribe, history.

## Environment Variables
- `CLIENT_ID` and `CLIENT_SECRET`: From Reddit app.
- `NEXTAUTH_URL`: `http://localhost:3000` in development.
- `NEXTAUTH_SECRET`: A strong random string (32+ chars).
- `DATABASE_URL`: PostgreSQL connection string to the Docker db.
- Optional: `PGSSLMODE=disable` for local connections if needed.

## Manual Authentication Flow Testing
1. Navigate to the app in your browser and click “Login with Reddit”.
2. Confirm redirect to Reddit authorization page; verify requested scopes match expected.
3. Approve the app; upon redirect back, verify the app creates a session (e.g., shows your username or logged-in state).
4. Refresh the page; verify the session persists.
5. Logout; verify session cookies are cleared and UI updates accordingly.

## Token Management Manual Testing
1. Open DevTools > Application > Cookies; locate session tokens related to NextAuth.
2. In DevTools Console, simulate token expiry by waiting or adjusting system time (if practical) or rely on the app’s refresh cycle.
3. Observe network calls to Reddit’s token endpoint (`/api/v1/access_token`) for refresh operations.
4. Confirm new access token issuance without user interruption.
5. If refresh fails (e.g., revoke token in Reddit settings), ensure the app gracefully handles re-authentication.

## User Preferences Manual Testing
1. With an authenticated session, use the app UI to change preferences.
2. Verify `GET /api/user/prefs` returns a JSON object containing your preferences.
3. POST updated preferences and ensure `GET` reflects changes (UPSERT behavior).
4. Trigger rate limiting by rapidly sending ~12 requests/min; verify a 429 response.
5. Send invalid JSON or oversized payload (>100KB) and verify a validation error.

## Database Integration Manual Testing
1. Run `node tests/database-setup-verification.js` to validate schema and connectivity.
2. Run `node tests/database-user-prefs-validation.js` for JSONB, triggers, and concurrency checks.
3. Manually query the db (e.g., `psql`) to inspect `user_prefs` rows for your user id.
4. Stop/start app and db; verify data persists.

## Browser Developer Tools Testing
- Network tab: Monitor `/api/auth/*` and `/api/user/prefs` requests. Check status codes, response bodies, and headers.
- Application tab: Inspect cookies and local storage (if used). Verify secure attributes (httpOnly, SameSite) in production.
- Console: Watch for auth-related logs or errors.

## Error Scenarios Testing
- Disconnect network during OAuth redirect; confirm error handling and recovery.
- Use invalid credentials in `.env.local` and verify clear server-side errors.
- Stop the database and attempt API calls; verify 5xx errors are returned gracefully.
- Exceed rate limits; ensure 429 with appropriate message and retry-after if applicable.

## Security Testing Checklist
- CSRF protection: Confirm a `state` parameter is used in the OAuth flow.
- Cookies: In production, verify `Secure`, `HttpOnly`, and `SameSite` as appropriate.
- JWT: Ensure secrets are strong and not exposed in client code.
- API auth: Confirm `/api/user/prefs` rejects unauthenticated requests and only accepts GET/POST.

## Troubleshooting
- Verify `.env.local` matches your Reddit app and db configuration.
- Confirm `docker-compose logs db` shows a healthy database and that `init.sql` ran.
- Check server logs for NextAuth or database errors.
- Use the provided test scripts under `tests/` for targeted diagnostics.


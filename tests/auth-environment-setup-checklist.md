# Authentication Environment Setup Checklist

Complete this checklist before running authentication tests.

## Environment Variables Checklist

### Reddit OAuth Configuration
- [ ] `CLIENT_ID` – Reddit application client ID
- [ ] `CLIENT_SECRET` – Reddit application client secret
- [ ] Redirect URI in Reddit app matches `NEXTAUTH_URL`
- [ ] Required scopes enabled for the Reddit app

### NextAuth Configuration
- [ ] `NEXTAUTH_SECRET` – Strong secret for JWT signing (32+ chars)
- [ ] `NEXTAUTH_URL` – App URL (e.g., `http://localhost:3000` for dev)
- [ ] `SIGNING_PRIVATE_KEY` – Private key for JWT signing (if configured)
- [ ] Issuer set/verified if using a custom issuer

### Database Configuration
- [ ] `DATABASE_URL` – PostgreSQL connection string
- [ ] Credentials match `docker-compose.yml` values
- [ ] SSL configuration appropriate for env (`PGSSLMODE=disable` for local if needed)
- [ ] Database port accessible (5432 or custom)

### Optional Environment Variables
- [ ] `DB_HOST_PORT` – Custom database port (Docker)
- [ ] `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` – Docker credentials
- [ ] `PGSSLMODE` – SSL mode (e.g., `disable` locally)
- [ ] `NODE_ENV` – Environment mode (development/production)

## Reddit Application Setup

### Reddit Developer Account
- [ ] Reddit account created and verified
- [ ] Access to https://www.reddit.com/prefs/apps
- [ ] Developer agreement accepted

### Reddit App Configuration
- [ ] App type: “web app”
- [ ] Name and description configured
- [ ] Redirect URI: `http://localhost:3000/api/auth/callback/reddit`
- [ ] Required scopes enabled: identity, mysubreddits, read, edit, vote, submit, report, save, subscribe, history
- [ ] Client ID and secret generated and saved to `.env.local`

## Database Setup Verification

### Docker Compose Database
- [ ] Docker and Docker Compose installed
- [ ] Start DB: `docker-compose up -d db`
- [ ] Health check passes (`docker-compose ps` shows healthy)
- [ ] `init.sql` runs and creates tables
- [ ] DB accessible on configured port

### Database Schema
- [ ] `user_prefs` table created successfully
- [ ] Triggers and functions installed
- [ ] Index on `updated_at` created
- [ ] Database permissions configured correctly

## Security Configuration

### JWT and Encryption
- [ ] `NEXTAUTH_SECRET` is cryptographically secure
- [ ] `SIGNING_PRIVATE_KEY` properly formatted (if used)
- [ ] Secrets not committed to version control
- [ ] `.env.local` file permissions are restricted

### Network Security
- [ ] Database only accessible from localhost in development
- [ ] Reddit OAuth redirect URI matches exactly
- [ ] No sensitive data in client-side code
- [ ] HTTPS configured for production

## Testing Prerequisites

### Development Environment
- [ ] Node.js and npm/yarn installed
- [ ] Dependencies installed (`yarn install`)
- [ ] Dev server starts (`npm run dev`)
- [ ] No startup errors in console

### Browser Configuration
- [ ] Browser allows localhost cookies
- [ ] Developer tools accessible
- [ ] Network tab monitoring enabled
- [ ] Console logging visible


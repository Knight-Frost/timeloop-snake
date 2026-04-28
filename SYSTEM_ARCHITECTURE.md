# System Architecture

## Overview

The platform is a standard MERN stack: a React SPA served as static files by Nginx, an Express REST API running on Node 20 under PM2, and a MongoDB Atlas cluster accessed through Mongoose 8. Nginx terminates TLS on port 443, proxies `/api/*` requests to the Express server on port 3000, and falls back to `index.html` for all other paths so React Router controls client-side navigation. Deployments are automated via GitHub Actions: every push to `main` builds the client, transfers artifacts and server code to EC2 over SSH, rewrites the `.env` file from repository secrets, and restarts the PM2 process.

```
Browser
  |
  | HTTPS :443
  v
Nginx (EC2)
  |
  +-- /api/*  ---------> Express :3000 --> Mongoose --> MongoDB Atlas
  |
  +-- /* (SPA) --------> client/dist/index.html
                         (React Router handles routes)

GitHub Actions runner
  |
  | SSH / rsync on push to main
  v
EC2 instance
```

## Components

**React SPA (`client/`)**
Vite 5 builds the React 18 application. React Router 6 handles all client-side routing including protected routes. `AuthContext` manages the JWT token and user object in `localStorage` and exposes `authFetch`, a fetch wrapper that injects the `Authorization` header and clears session state on a 401 response.

**Express API (`server/`)**
Node 20 / Express 4 application. Applies helmet, CORS, compression, rate limiting, mongo-sanitize, and a 10 kb JSON body limit at the top of the middleware stack. Routes are split by concern: `/api/auth`, `/api/scores`, `/api/admin`. An admin account is seeded on startup via the `seedAdmin` function in `server/index.js`.

**MongoDB Atlas**
Free-tier M0 cluster. Mongoose 8 schemas enforce types, indexes, and validation. The `User` collection has a unique index on `email`. The `Score` collection has a descending index on `score` used by the leaderboard query.

**Nginx**
Handles TLS termination, HSTS headers, HTTP-to-HTTPS redirect, reverse proxy to Express, and SPA fallback. Configuration lives in `nginx.conf` at the repo root and is copied to `/etc/nginx/sites-available/` during deploy.

**PM2**
Keeps the Express process alive across crashes and reboots. The configuration file is `server/ecosystem.config.cjs` (fork mode, 300 MB memory ceiling, `NODE_ENV=production`). The deploy workflow calls `pm2 startOrReload` with `--update-env` so environment variables are refreshed without downtime.

**GitHub Actions**
The workflow in `.github/workflows/deploy.yml` runs on every push to `main`. It builds the client, uploads the `dist` folder as an artifact, SSHes into EC2, rsyncs updated files, writes `/server/.env` from repository secrets, installs production dependencies, reloads PM2, and probes `/api/health` to confirm the API is up.

## Request flow

**Public leaderboard fetch:**

1. Browser sends `GET https://<host>/api/scores`.
2. Nginx matches the `/api/` location block and proxies to `http://127.0.0.1:3000/api/scores`.
3. Express router calls the scores controller.
4. Mongoose runs `Score.find().sort({ score: -1 }).limit(20).populate('user', 'email')` against Atlas.
5. Atlas returns the documents over a persistent TLS connection.
6. Express serializes the result as JSON and responds 200.
7. Nginx forwards the response to the browser.
8. React renders the leaderboard table from the JSON array.

**Authenticated score POST:**

1. Browser sends `POST https://<host>/api/scores` with `Authorization: Bearer <token>` and body `{score, loops_survived}`.
2. Nginx proxies to Express.
3. The `protect` middleware extracts the token, verifies the JWT signature and expiry, then fetches the full user document from MongoDB by the `id` claim. Role is read from the database, never from the token payload.
4. The scores route handler destructures only `score` and `loops_survived` from `req.body` (mass-assignment defense), sets `user: req.user._id`, and calls `Score.create(...)`.
5. The created document is returned as JSON with status 201.

## Auth flow

1. Register (`POST /api/auth/register`) or login (`POST /api/auth/login`) accepts `{email, password}`. The server normalizes the email (lowercase, trim), verifies string types explicitly, and either hashes the password with bcrypt (12 rounds) and creates the user, or compares the submitted password against the stored hash. A JWT signed with `JWT_SECRET` (7-day expiry) is returned alongside `{_id, email, role}`.
2. The client stores the token and user object in `localStorage` via `AuthContext`.
3. Every request to a protected endpoint includes the header `Authorization: Bearer <token>`.
4. The `protect` middleware verifies the JWT signature and expiry, then re-fetches the user document from MongoDB by `id`. Role is read from the database on every request so a role change takes effect immediately without requiring re-login.
5. `requireRole('admin')` compares `req.user.role` to the required value and returns 403 on mismatch.
6. Ownership-protected resources (e.g., `DELETE /api/scores/:id`) return 404 - not 403 - when the resource exists but belongs to a different user, preventing resource enumeration.
7. When the client receives a 401 response, `authFetch` clears `localStorage` and redirects to `/login`.

## Data model

### User

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | primary key |
| email | String | required, unique, lowercased, trimmed, regex-validated |
| password | String | required, bcrypt hash, select:false |
| role | String | enum [user, admin], default user |
| createdAt | Date | timestamps: true |
| updatedAt | Date | timestamps: true |

### Score

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | primary key |
| score | Number | required, min 0 |
| loops_survived | Number | required, min 0 |
| user | ObjectId | ref User, indexed |
| createdAt | Date | timestamps: true |
| updatedAt | Date | timestamps: true |

Index: `{ score: -1 }` for leaderboard sort.

## Security controls

- helmet defaults plus a custom Content-Security-Policy (`server/index.js`)
- HSTS set at both the Express layer (via helmet) and in `nginx.conf`
- JSON body limit 10 kb enforced by Express `json({ limit: '10kb' })` (`server/index.js`)
- `express-mongo-sanitize` strips `$` and `.` from request bodies and query strings, applied immediately after JSON parsing
- Explicit `typeof === 'string'` checks on `email` and `password` inputs before any processing (`server/routes/auth.js`)
- bcrypt salt rounds 12; password length validated to 6-72 characters to prevent bcrypt 72-byte silent truncation
- Mass-assignment defense by destructuring only the intended fields from `req.body`; `role` is never accepted from the request body
- `validateObjectId` middleware returns 404 for any route parameter that is not a valid MongoDB ObjectId
- Ownership check on score deletion returns 404, not 403, to avoid confirming that a resource exists
- `express-rate-limit` at 20 requests per 15 minutes on `/api/auth`
- CORS restricted to a single origin via the `CLIENT_ORIGIN` environment variable
- `trust proxy 1` so the rate limiter reads the real client IP from `X-Forwarded-For` behind Nginx
- TLS 1.2 and 1.3 only, enforced at Nginx; plain HTTP is redirected to HTTPS

## Deployment topology

```
GitHub Actions runner
  |
  | 1. npm run build (client)
  | 2. SSH + rsync server code + dist to EC2
  | 3. scp .env (written from repository secrets)
  | 4. npm ci --omit=dev
  | 5. pm2 startOrReload ecosystem.config.cjs --update-env
  | 6. curl /api/health (up to 6 retries)
  v
EC2 Ubuntu instance
  |
  +-- Nginx (port 80 -> 443, TLS, reverse proxy)
  |
  +-- PM2 -> Express :3000
                |
                v
           MongoDB Atlas (SRV connection over TLS)
```

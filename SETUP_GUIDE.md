# Setup Guide - Local Development

## Prerequisites

- Node.js 20 LTS
- npm 10
- A MongoDB Atlas cluster (free M0 tier is sufficient)

## Quick Start (One Command)

The fastest way to run the project locally is the bundled setup script. It checks prerequisites, creates the environment file, installs both dependency trees, starts both processes, and runs a health check. It is also safe to run repeatedly.

### Prerequisites you must have installed

- Node.js 20 or newer
- A MongoDB Atlas account and a free-tier (M0) cluster
- A modern terminal (the macOS Terminal or VS Code's built-in terminal both work)

### Step 1. Clone and enter the repository

```bash
git clone https://github.com/<your-username>/timeloop-snake-.git
cd timeloop-snake-
```

### Step 2. Run the setup script for the first time

```bash
npm run dev:full
```

The first run will tell you that `server/.env` was created with a placeholder, then exit with instructions. This is expected.

### Step 3. Open `server/.env` in VS Code and paste your MongoDB connection string

In VS Code, open the file `server/.env`. Find the line that begins with `MONGO_URI=` and replace its value with your Atlas connection string.

The format is exactly:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/timeloopsnake
```

For example, if your Atlas database user is `snake_user` with password `abc123XYZ` and your cluster host is `cluster0.example.mongodb.net`, the line should read:

```
MONGO_URI=mongodb+srv://snake_user:abc123XYZ@cluster0.example.mongodb.net/timeloopsnake
```

Important:
- Keep the entire line on a single line. Do not press Enter inside it. If VS Code visually soft-wraps the line, that is fine; only a hard newline (an actual Enter keypress) breaks it.
- If the password contains any of `@ : / ? # &`, change the password in Atlas to something that uses only letters and digits. URL-encoding the password works in theory but is a common source of typos.
- The query parameters `?retryWrites=true&w=majority` are optional; Mongoose 8 sets those defaults automatically. Leaving them off keeps the URI shorter and easier to paste.

Save the file with `Cmd+S` (macOS) or `Ctrl+S` (Windows / Linux).

### Step 4. Run the script again

```bash
npm run dev:full
```

You should now see all three OK lines:

```
[ok]    Backend running.
[ok]    Database connected.
[ok]    Frontend running.
```

### Step 5. Open the app

Visit `http://localhost:5173` in your browser. Register an account, click Play, finish a round, and check the Leaderboard.

### Stopping and resetting

| What you want to do | Command |
|---|---|
| Stop the running services | Press `Ctrl+C` in the script's terminal, or run `npm run stop` |
| Wipe and reinstall dependencies | `npm run reset` |

### If something goes wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| `Backend did not respond ... within 20 seconds` and `bad auth : authentication failed` in the log | The password in `MONGO_URI` does not match the one set on the Atlas user | In Atlas, go to Security > Database Access > Edit > Edit Password. Set a new alphanumeric-only password. Update the `MONGO_URI` line in `server/.env` to use the new password. Re-run. |
| `URI option "retryWrites" cannot be specified with no value` | The `MONGO_URI` line in `server/.env` got broken across two lines | Open `server/.env` in VS Code. Make sure the entire `MONGO_URI=...` value is on one line with no Enter key in the middle. |
| `MongooseServerSelectionError` after a long pause | Your laptop's IP address is not allowlisted on Atlas | In Atlas, go to Security > Network Access > Add IP Address > Add Current IP Address |
| The script ignores changes you make to `server/.env` | You may have `MONGO_URI` exported in your shell, which silently overrides the file | Run `unset MONGO_URI` in the same terminal, or open a fresh terminal |

If you would rather walk through the setup manually, continue reading the sections below.

## 1. Clone the repository

```bash
git clone https://github.com/<your-username>/timeloop-snake-.git
cd timeloop-snake-
```

## 2. Configure server environment

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in the following values:

- `MONGO_URI` - from MongoDB Atlas: Clusters -> Connect -> Drivers -> Node.js, copy the SRV connection string and replace `<password>` with your database user password.
- `JWT_SECRET` - any long random string, at least 32 characters. Generate one with:
  ```bash
  openssl rand -hex 32
  ```
- `CLIENT_ORIGIN` - set to `http://localhost:5173` for local development (the default Vite port).
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - optional. Set these if you want a seeded admin account. On startup the server will create this user or promote an existing user with that email to the admin role.
- `NODE_ENV` - leave as `production` for production-like behavior, or change to `development` for verbose error messages in API responses.

**Atlas network access:** MongoDB Atlas requires the host running the server to be in the cluster's IP allowlist. In the Atlas console, go to Security -> Network Access -> Add IP Address. Add your current IP, or `0.0.0.0/0` for development convenience. Never use `0.0.0.0/0` in production.

## 3. Install and run the server

```bash
cd server
npm install
npm run dev
```

Expected output: `MongoDB connected` followed by `Server running on port 3000`.

## 4. Install and run the client

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Expected output: Vite prints a local URL, typically `http://localhost:5173`. The Vite dev server proxies all `/api` requests to `http://localhost:3000` so you do not need any additional CORS configuration during development.

## 5. Verify the setup

- Open `http://localhost:5173` in a browser.
- Register a new account.
- Click Play and confirm the embedded Canvas game loads.
- Play a round. The game submits your score automatically on game over.
- Open `http://localhost:5173/leaderboard` and confirm your score appears.
- Hit `http://localhost:3000/api/health` directly. Expect `{"status":"ok","db":"connected"}`.

## 6. Promote yourself to admin (optional)

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` to match an existing registered account (or set them before registering). Restart the server. The seeder runs at startup and either creates the account or promotes the matching email to the `admin` role. Log in and navigate to `/admin` to confirm access.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `MONGO_URI environment variable is not set` | `server/.env` file is missing or not populated | Run `cp .env.example .env` in the `server/` directory and fill in the values |
| `MongooseServerSelectionError` | Atlas IP allowlist does not include your current IP, or the password in the connection string is wrong | Add your IP in Atlas -> Network Access, and double-check the password in `MONGO_URI` |
| 401 on protected routes | JWT token is missing or has expired (tokens last 7 days) | Log out and log back in to obtain a fresh token |
| CORS error in the browser console | `CLIENT_ORIGIN` in `server/.env` does not exactly match the browser origin | Set `CLIENT_ORIGIN=http://localhost:5173` (no trailing slash) and restart the server |

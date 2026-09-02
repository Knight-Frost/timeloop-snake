# Time Loop Snake

Every 14 seconds, a ghost of your own past run spawns on the board and replays your exact moves, step for step. The longer you survive, the more of your own history is out there working against you. Time Loop Snake is a Canvas-based Snake game built around that one twist, with a MERN-stack platform layered on top: accounts, authenticated score submission, a public leaderboard, and an admin panel, turning a single-player experiment into a full web application.

## Deployment history

This project was deployed to a live AWS EC2 instance behind Nginx, with PM2 supervising the Express process and a GitHub Actions pipeline deploying automatically on every push to `main`. That instance is no longer running, so there is currently no public URL. The deployment steps are documented in [DEPLOYMENT_GUIDE_EC2.md](DEPLOYMENT_GUIDE_EC2.md) if you want to reproduce it.

## Quick Start (One Command)

For anyone who just wants to run it locally:

```bash
git clone https://github.com/Knight-Frost/timeloop-snake.git
cd timeloop-snake
npm run dev:full
```

The first run creates `server/.env` with a placeholder and exits. Open `server/.env` in VS Code, paste your MongoDB Atlas connection string into the `MONGO_URI=` line (keep the line continuous, do not press Enter in the middle), save, then run `npm run dev:full` again.

When you see all three OK lines:

```
[ok]    Backend running.
[ok]    Database connected.
[ok]    Frontend running.
```

open http://localhost:5173 and register an account.

Detailed walkthrough including troubleshooting: [SETUP_GUIDE.md](SETUP_GUIDE.md#quick-start-one-command).

| Action | Command |
|---|---|
| Stop everything | `Ctrl+C` in the script's terminal, or `npm run stop` |
| Reinstall from scratch | `npm run reset` |

## Features

- React 18 SPA served by Nginx, routed by React Router
- Express 4 REST API with JWT auth, role-based access control, and ownership checks
- MongoDB Atlas via Mongoose 8 with validated schemas and indexes
- Public leaderboard, authenticated score submission, admin user/score management
- Self-contained Canvas mini-game embedded in /play
- Previously deployed to AWS EC2 behind Nginx, with PM2 process supervision and GitHub Actions CI/CD (see Deployment history above)

## Tech stack

| Layer | Tech |
|---|---|
| Client | React 18, React Router 6, Vite 5 |
| Server | Node 20, Express 4 |
| Database | MongoDB Atlas, Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs (12 rounds) |
| Security | helmet, CSP, HSTS, CORS allowlist, express-rate-limit, express-mongo-sanitize, body limit 10kb |
| Hosting (previously) | AWS EC2 Ubuntu, Nginx reverse proxy, PM2 |
| CI/CD | GitHub Actions, deployed on push to main |

## Manual Setup (alternative)

1. Clone the repo.

```bash
git clone https://github.com/Knight-Frost/timeloop-snake.git
cd timeloop-snake
```

2. Install and start the client.

```bash
cd client
npm install
npm run dev
```

3. In a second terminal, configure and start the server.

```bash
cd server
cp .env.example .env
# Open server/.env and fill in MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, etc.
npm install
npm run dev
```

For full local dev setup see SETUP_GUIDE.md. For the EC2 deployment steps see DEPLOYMENT_GUIDE_EC2.md. For system architecture see SYSTEM_ARCHITECTURE.md.

## Project layout

```
client/          React + Vite SPA and the embedded Canvas game
server/          Express REST API, Mongoose models, middleware, routes
docs/            Game module design documentation
nginx.conf       Nginx reverse proxy and TLS configuration
.github/         GitHub Actions CI/CD workflow
```

## Documentation

- [RUNNING.md](RUNNING.md) - Step-by-step run guide for first-time users
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Local development setup
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Architecture, data models, security controls
- [DEPLOYMENT_GUIDE_EC2.md](DEPLOYMENT_GUIDE_EC2.md) - Step-by-step guide to deploying to AWS EC2
- [docs/README.md](docs/README.md) - Canvas game module design

## Origin

This project started as a course assignment and grew into a full MERN platform beyond the original scope.

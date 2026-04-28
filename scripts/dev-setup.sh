#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT/server"
CLIENT_DIR="$ROOT/client"
ENV_FILE="$SERVER_DIR/.env"
PID_FILE="$ROOT/.dev-pids"
SERVER_LOG="$ROOT/server.log"
CLIENT_LOG="$ROOT/client.log"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()   { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
info() { printf "${BLUE}[info]${NC}  %s\n" "$1"; }
warn() { printf "${YELLOW}[warn]${NC}  %s\n" "$1"; }
err()  { printf "${RED}[err]${NC}   %s\n" "$1" 1>&2; }

# 1. Prereq check
command -v node    >/dev/null 2>&1 || { err "Node.js is not installed. Install Node 20 from https://nodejs.org/"; exit 1; }
command -v npm     >/dev/null 2>&1 || { err "npm is not installed."; exit 1; }
command -v openssl >/dev/null 2>&1 || { err "openssl is not installed."; exit 1; }
command -v curl    >/dev/null 2>&1 || { err "curl is not installed."; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  warn "Node version is $(node -v). Node 20 or newer is recommended."
fi
ok "Prerequisites present (node $(node -v), npm $(npm -v))."

# 2. Idempotent .env creation
if [ ! -f "$ENV_FILE" ]; then
  info "server/.env not found. Creating one with safe defaults..."

  if [ -n "${MONGO_URI:-}" ]; then
    MONGO_VALUE="$MONGO_URI"
    ok "Using MONGO_URI from your shell environment."
  else
    MONGO_VALUE="REPLACE_WITH_YOUR_MONGODB_ATLAS_CONNECTION_STRING"
    warn "MONGO_URI is not set in your shell. A placeholder was written to server/.env."
  fi

  JWT=$(openssl rand -hex 32)

  umask 077
  cat > "$ENV_FILE" <<ENV
PORT=3000
NODE_ENV=development
MONGO_URI=$MONGO_VALUE
JWT_SECRET=$JWT
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
ENV
  chmod 600 "$ENV_FILE"

  if [ "$MONGO_VALUE" = "REPLACE_WITH_YOUR_MONGODB_ATLAS_CONNECTION_STRING" ]; then
    err "Action required:"
    err "  1. Open server/.env in a text editor."
    err "  2. Replace MONGO_URI with your Atlas connection string."
    err "     Example: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/timeloop_snake?retryWrites=true&w=majority"
    err "     If the password contains @, encode it as %40."
    err "  3. Save and re-run this script: bash scripts/dev-setup.sh"
    exit 1
  fi
else
  ok "server/.env already exists; leaving it untouched."
fi

# 3. Install deps (npm install is a no-op if nothing changed)
info "Installing server dependencies..."
(cd "$SERVER_DIR" && npm install --no-audit --no-fund --silent)
ok "Server dependencies installed."

info "Installing client dependencies..."
(cd "$CLIENT_DIR" && npm install --no-audit --no-fund --silent)
ok "Client dependencies installed."

# 4. Pre-flight: stop any stragglers from a prior run
if [ -f "$PID_FILE" ]; then
  warn "Found a stale PID file. Cleaning up old processes..."
  bash "$ROOT/scripts/stop.sh" >/dev/null 2>&1 || true
fi

# 5. Start services in background with exec so $! is the real PID
info "Starting backend on http://localhost:3000 ..."
(cd "$SERVER_DIR" && exec node index.js) > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

info "Starting frontend on http://localhost:5173 ..."
(cd "$CLIENT_DIR" && exec npm run dev) > "$CLIENT_LOG" 2>&1 &
CLIENT_PID=$!

printf "%s %s\n" "$SERVER_PID" "$CLIENT_PID" > "$PID_FILE"

# 6. Wait for backend health
info "Waiting for backend health (up to 20 seconds)..."
HEALTH_OK=0
DB_STATE="unknown"
for i in $(seq 1 20); do
  RESP=$(curl -fsS http://localhost:3000/api/health 2>/dev/null || true)
  if [ -n "$RESP" ] && echo "$RESP" | grep -q '"status":"ok"'; then
    HEALTH_OK=1
    DB_STATE=$(echo "$RESP" | sed -n 's/.*"db":"\([^"]*\)".*/\1/p')
    break
  fi
  sleep 1
done

cleanup_and_exit() {
  err "Stopping background processes due to error..."
  kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  exit 1
}

if [ "$HEALTH_OK" -ne 1 ]; then
  err "Backend did not respond at http://localhost:3000/api/health within 20 seconds."
  err "Last 30 lines of server.log:"
  tail -30 "$SERVER_LOG" 1>&2 || true
  cleanup_and_exit
fi

ok "Backend running."

if [ "$DB_STATE" = "connected" ]; then
  ok "Database connected."
else
  warn "Database is in state: $DB_STATE (expected: connected)."
  warn "Check Atlas Network Access and the MONGO_URI in server/.env."
fi

# Frontend health: just check the port is listening
sleep 2
if curl -fsS http://localhost:5173 >/dev/null 2>&1; then
  ok "Frontend running."
else
  warn "Frontend not yet responding on http://localhost:5173. Check client.log."
fi

printf "\n"
ok "Ready to test in browser:"
ok "  http://localhost:5173            (the app)"
ok "  http://localhost:3000/api/health (backend health)"
printf "\n"
info "Logs:    tail -f server.log    or    tail -f client.log"
info "Stop:    Ctrl+C  (or run: bash scripts/stop.sh)"
printf "\n"

trap 'printf "\n"; info "Stopping..."; kill "$SERVER_PID" "$CLIENT_PID" 2>/dev/null || true; rm -f "$PID_FILE"; ok "Stopped."; exit 0' INT TERM

wait

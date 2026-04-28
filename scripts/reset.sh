#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'
ok()   { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
info() { printf "${BLUE}[info]${NC}  %s\n" "$1"; }

# Stop anything still running first
bash "$ROOT/scripts/stop.sh" >/dev/null 2>&1 || true

info "Removing node_modules and lock files..."
rm -rf "$ROOT/server/node_modules" "$ROOT/client/node_modules"
rm -f "$ROOT/server/package-lock.json" "$ROOT/client/package-lock.json"
rm -f "$ROOT/server.log" "$ROOT/client.log" "$ROOT/.dev-pids"
ok "Cleaned."

info "Reinstalling server dependencies..."
(cd "$ROOT/server" && npm install --no-audit --no-fund)
ok "Server dependencies reinstalled."

info "Reinstalling client dependencies..."
(cd "$ROOT/client" && npm install --no-audit --no-fund)
ok "Client dependencies reinstalled."

ok "Reset complete. Run: bash scripts/dev-setup.sh"

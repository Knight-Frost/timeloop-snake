#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.dev-pids"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ok()   { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
warn() { printf "${YELLOW}[warn]${NC}  %s\n" "$1"; }

if [ -f "$PID_FILE" ]; then
  PIDS=$(cat "$PID_FILE")
  for pid in $PIDS; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  rm -f "$PID_FILE"
fi

# Belt and suspenders: kill stragglers by command pattern
pkill -f "node index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

ok "Stopped backend and frontend (if they were running)."

#!/usr/bin/env bash
# Start both KREO servers and keep them alive.
# Run: bash start.sh
set -euo pipefail
cd "$(dirname "$0")"

# --- Backend (port 3001) ---
echo "Starting KREO backend..."
kill $(lsof -ti:3001 2>/dev/null) 2>/dev/null || true
cd server
# Ensure deps
[ -d node_modules ] || npm install --silent
# Start with tsx, restart on crash
(
  while true; do
    echo "[$(date)] Starting backend..."
    npx tsx src/index.ts 2>&1
    echo "[$(date)] Backend exited — restarting in 3s..."
    sleep 3
  done
) > /tmp/kreo-backend.log 2>&1 &
echo "Backend PID: $!"

# --- Frontend (port 3000) ---
echo "Starting KREO frontend..."
cd ../site
# Ensure the latest client build is served
if [ -d "../client/dist" ]; then
  rm -rf public/*
  cp -r ../client/dist/* public/
fi
# Start Bun server
(
  while true; do
    echo "[$(date)] Starting frontend..."
    bun run serve.ts 2>&1
    echo "[$(date)] Frontend exited — restarting in 3s..."
    sleep 3
  done
) > .run/server.log 2>&1 &
echo "Frontend PID: $!"

echo "KREO started. Backend: http://localhost:3001, Frontend: http://localhost:3000"

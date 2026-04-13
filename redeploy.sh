#!/usr/bin/env bash
# redeploy.sh — Pull latest code and rebuild on VPS (PM2 + standalone Next.js)
# Usage: bash /autowit/redeploy.sh [--frontend-only | --backend-only]
set -euo pipefail
cd /autowit

MODE="${1:-all}"
echo ">>> git pull"
git pull --ff-only

# ── Backend ───────────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "--backend-only" ]]; then
  echo ">>> Building backend..."
  cd /autowit/backend
  npm ci
  npm run build
  pm2 restart autowit-api
  pm2 save
  echo ">>> Backend OK"
fi

# ── Frontend ──────────────────────────────────────────────
if [[ "$MODE" == "all" || "$MODE" == "--frontend-only" ]]; then
  echo ">>> Building frontend..."
  cd /autowit/frontend
  NODE_OPTIONS='--max-old-space-size=400' npm run build

  # REQUIRED: copy static assets into standalone for Next.js output:standalone
  # Without this, client-side JS (including React components) will 404
  cp -r .next/static .next/standalone/.next/static

  # Copy public folder too if it exists
  if [[ -d public ]]; then
    cp -r public .next/standalone/public
  fi

  pm2 restart autowit-web
  pm2 save
  echo ">>> Frontend OK"
fi

echo ""
echo ">>> Deploy complete at $(date)"
curl -fsS http://127.0.0.1:3001/api/health || true

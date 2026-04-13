#!/usr/bin/env bash
# deploy.sh — Deploy Autowit to VPS
# Usage: ./deploy.sh [--skip-build]
# Requires: SSH key at ~/.ssh/id_ed25519, rsync installed

set -euo pipefail

VPS_HOST="root@103.69.190.75"
VPS_PATH="/autowit"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKIP_BUILD="${1:-}"

echo "=== Autowit Deploy Script ==="
echo "Target: $VPS_HOST:$VPS_PATH"
echo ""

# ── 1. Local build ────────────────────────────────────────
if [[ "$SKIP_BUILD" != "--skip-build" ]]; then
  echo "[1/5] Building backend…"
  cd "$LOCAL_ROOT/backend"
  npm ci
  npm run build

  echo "[2/5] Building frontend…"
  cd "$LOCAL_ROOT/frontend"
  npm ci
  npm run build
else
  echo "[1-2/5] Skipping build (--skip-build)"
fi

# ── 2. Sync files ─────────────────────────────────────────
echo "[3/5] Syncing backend to VPS…"
rsync -avz --delete \
  --exclude "node_modules/" \
  --exclude ".env" \
  "$LOCAL_ROOT/backend/" \
  "$VPS_HOST:$VPS_PATH/backend/"

echo "[3/5] Syncing frontend to VPS…"
rsync -avz --delete \
  --exclude "node_modules/" \
  --exclude ".env.local" \
  "$LOCAL_ROOT/frontend/" \
  "$VPS_HOST:$VPS_PATH/frontend/"

# Sync systemd units + nginx config
rsync -avz "$LOCAL_ROOT/systemd/" "$VPS_HOST:/etc/systemd/system/"
rsync -avz "$LOCAL_ROOT/autowit.nginx.conf" "$VPS_HOST:/etc/nginx/sites-available/autowit.me"

# ── 3. VPS setup ──────────────────────────────────────────
echo "[4/5] Setting up VPS…"
ssh "$VPS_HOST" bash <<'REMOTE'
set -euo pipefail

# Install node_modules on VPS (production only)
echo "Installing backend deps on VPS…"
cd /autowit/backend
npm ci --omit=dev

echo "Installing frontend deps on VPS…"
cd /autowit/frontend
npm ci --omit=dev

# Enable nginx site
ln -sf /etc/nginx/sites-available/autowit.me /etc/nginx/sites-enabled/autowit.me
nginx -t
systemctl reload nginx

# Enable & restart services
systemctl daemon-reload
systemctl enable autowit-api autowit-web
systemctl restart autowit-api
sleep 2
systemctl restart autowit-web

echo "--- Service status ---"
systemctl status autowit-api --no-pager -l || true
systemctl status autowit-web --no-pager -l || true
REMOTE

# ── 4. SSL (first deploy only) ───────────────────────────
echo "[5/5] Checking SSL…"
ssh "$VPS_HOST" bash <<'SSL'
if ! certbot certificates 2>/dev/null | grep -q "autowit.me"; then
  echo "Issuing Let's Encrypt certificate…"
  certbot --nginx -d autowit.me -d www.autowit.me --non-interactive --agree-tos -m admin@autowit.me
else
  echo "SSL certificate already exists — skipping"
fi
SSL

echo ""
echo "✅ Deploy complete! API: https://autowit.me/api/health"

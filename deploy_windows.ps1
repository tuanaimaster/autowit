#!/usr/bin/env pwsh
# deploy_windows.ps1 — Full automation: GitHub repo + VPS deploy + nginx + SSL
# Run: .\deploy_windows.ps1
# Requirements: gh CLI authenticated, SSH key at ~/.ssh/id_ed25519

param(
  [string]$SshKey = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$VpsHost = "103.69.190.75",
  [string]$VpsUser = "root",
  [string]$VpsPath = "/autowit",
  [string]$Domain = "autowit.me",
  [string]$GitHubUser = "mettatuan",
  [string]$RepoName = "autowit",
  [string]$AdminEmail = "mettatuan@gmail.com",
  [switch]$SkipGitHub,
  [switch]$SkipBuild,
  [switch]$SkipVps
)

$ErrorActionPreference = "Stop"
$Ssh = "ssh -i `"$SshKey`" -o StrictHostKeyChecking=no ${VpsUser}@${VpsHost}"
$ScriptDir = $PSScriptRoot

function Log($msg) { Write-Host "`n[>>] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "     ✅ $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "     ❌ $msg" -ForegroundColor Red; exit 1 }

# ─────────────────────────────────────────────────────────
# STEP 1 — Create GitHub repo (separate from freedom-wallet-bot)
# ─────────────────────────────────────────────────────────
if (-not $SkipGitHub) {
  Log "Creating GitHub repo: $GitHubUser/$RepoName"

  $ghPath = (Get-Command gh -ErrorAction SilentlyContinue)?.Source
  if (-not $ghPath) {
    $env:PATH += ";C:\Program Files\GitHub CLI"
    $ghPath = (Get-Command gh -ErrorAction SilentlyContinue)?.Source
  }
  if (-not $ghPath) { Err "gh CLI not found. Install: winget install GitHub.cli" }

  # Check if repo already exists
  $existing = gh repo view "$GitHubUser/$RepoName" --json name 2>&1
  if ($LASTEXITCODE -eq 0) {
    Ok "Repo $GitHubUser/$RepoName already exists — skipping creation"
  } else {
    gh repo create "$GitHubUser/$RepoName" `
      --public `
      --description "Autowit AI Automation Platform — NestJS + Next.js" `
      --confirm 2>&1
    if ($LASTEXITCODE -ne 0) { Err "Failed to create repo" }
    Ok "Created https://github.com/$GitHubUser/$RepoName"
  }

  # Set remote and push
  Set-Location $ScriptDir
  $remoteUrl = "git@github.com:$GitHubUser/$RepoName.git"
  $currentRemote = git remote get-url origin 2>&1
  if ($currentRemote -ne $remoteUrl) {
    git remote set-url origin $remoteUrl
    Ok "Remote set to $remoteUrl"
  }

  # Initial push (may need --force if repo was just created with README)
  git push -u origin main 2>&1
  if ($LASTEXITCODE -ne 0) {
    git push -u origin main --force 2>&1
  }
  Ok "Code pushed to https://github.com/$GitHubUser/$RepoName"
}

# ─────────────────────────────────────────────────────────
# STEP 2 — Local build (optional)
# ─────────────────────────────────────────────────────────
if (-not $SkipBuild) {
  Log "Building backend locally"
  Set-Location "$ScriptDir\backend"
  npm run build 2>&1 | Select-Object -Last 5
  Ok "Backend built"

  Log "Building frontend locally"
  Set-Location "$ScriptDir\frontend"
  npm run build 2>&1 | Select-Object -Last 5
  Ok "Frontend built"
  Set-Location $ScriptDir
}

# ─────────────────────────────────────────────────────────
# STEP 3 — VPS Setup
# ─────────────────────────────────────────────────────────
if (-not $SkipVps) {
  Log "Preparing VPS: $VpsUser@$VpsHost"

  # ── 3a. Install Node.js 22 LTS ──────────────────────────
  Log "Installing Node.js 22 LTS on VPS"
  $nodeSetup = @"
set -euo pipefail
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  echo "Node installed: \$(node --version)"
else
  echo "Node already installed: \$(node --version)"
fi
# Install PM2 globally for process management
npm list -g --depth=0 pm2 &>/dev/null || npm install -g pm2
npm list -g --depth=0 pm2-logrotate &>/dev/null || pm2 install pm2-logrotate
"@
  $nodeSetup | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "Node.js ready on VPS"

  # ── 3b. Install PostgreSQL + Redis ──────────────────────
  Log "Installing PostgreSQL + Redis on VPS"
  $dbSetup = @"
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# PostgreSQL
if ! command -v psql &>/dev/null; then
  apt-get install -y postgresql postgresql-contrib
  systemctl enable postgresql
  systemctl start postgresql
fi

# Redis
if ! command -v redis-cli &>/dev/null; then
  apt-get install -y redis-server
  systemctl enable redis-server
  systemctl start redis-server
fi

# Create DB & user (idempotent)
sudo -u postgres psql -c "CREATE USER autowit WITH PASSWORD 'autowit_pass';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE autowit_db OWNER autowit;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE autowit_db TO autowit;" 2>/dev/null || true
echo "PostgreSQL & Redis ready"
"@
  $dbSetup | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "PostgreSQL + Redis ready"

  # ── 3c. Clone / pull repo ───────────────────────────────
  Log "Cloning Autowit repo on VPS"
  $cloneScript = @"
set -euo pipefail
if [ -d "$VpsPath/.git" ]; then
  echo "Repo exists, pulling latest..."
  cd $VpsPath
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning fresh..."
  mkdir -p $VpsPath
  git clone https://github.com/$GitHubUser/$RepoName.git $VpsPath
fi
echo "Repo ready at $VpsPath"
"@
  $cloneScript | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "Repo cloned/updated on VPS"

  # ── 3d. Create .env on VPS ──────────────────────────────
  Log "Checking .env on VPS"
  $envExists = ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" "test -f $VpsPath/.env && echo yes || echo no"
  if ($envExists -eq "no") {
    # Copy .env.example as base
    $envContent = Get-Content "$ScriptDir\.env.example" -Raw
    $envContent | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" "cat > $VpsPath/.env"
    Write-Host "     ⚠️  .env created from template. Please edit $VpsPath/.env on VPS with real API keys!" -ForegroundColor Yellow
    Write-Host "         ssh root@$VpsHost 'nano $VpsPath/.env'" -ForegroundColor Yellow
  } else {
    Ok ".env already exists on VPS"
  }

  # ── 3e. Copy backend .env + build on VPS ────────────────
  Log "Installing deps & building on VPS"
  $buildScript = @"
set -euo pipefail
export NODE_ENV=production

# Copy .env to both subdirs if not exists
[ -f $VpsPath/backend/.env ] || ln -sf $VpsPath/.env $VpsPath/backend/.env
[ -f $VpsPath/frontend/.env.local ] || ln -sf $VpsPath/.env $VpsPath/frontend/.env.local

# Backend
cd $VpsPath/backend
npm ci --omit=dev
npm run build
echo "Backend built ✅"

# Frontend
cd $VpsPath/frontend
npm ci
npm run build
echo "Frontend built ✅"
"@
  $buildScript | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "Build complete on VPS"

  # ── 3f. PM2 process setup ───────────────────────────────
  Log "Setting up PM2 processes"
  $pm2Script = @"
set -euo pipefail
# Stop old processes if any
pm2 delete autowit-api 2>/dev/null || true
pm2 delete autowit-web 2>/dev/null || true

# Start backend
cd $VpsPath/backend
pm2 start dist/main.js --name autowit-api --env production \
  --max-memory-restart 512M \
  --restart-delay 3000

# Start frontend (standalone Next.js)
cd $VpsPath/frontend
pm2 start .next/standalone/server.js --name autowit-web \
  --env production \
  -e PORT=3000 \
  --max-memory-restart 256M

# Save PM2 config to survive reboots
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo env" | bash 2>/dev/null || pm2 startup | tail -1 | bash 2>/dev/null || true

echo "PM2 processes running:"
pm2 list
"@
  $pm2Script | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "PM2 processes started"

  # ── 3g. Nginx config ────────────────────────────────────
  Log "Configuring nginx for $Domain"
  $nginxConf = @"
# Autowit nginx config — $Domain
# Auto-generated by deploy_windows.ps1

map `$http_upgrade `$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name $Domain www.$Domain;

    # Redirect www to non-www
    if (`$host = www.$Domain) {
        return 301 https://$Domain`$request_uri;
    }

    # Let certbot use this for ACME challenge
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://$Domain`$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name $Domain;

    # SSL — certbot will fill these in
    # ssl_certificate     /etc/letsencrypt/live/$Domain/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$Domain/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # API + Webhook → NestJS backend :3001
    location ~ ^/(api|webhook)(/|$) {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }

    # n8n panel
    location /n8n/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
    }

    # Next.js frontend → :3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
    }
}
"@
  # Write nginx config to VPS
  $nginxConf | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" "cat > /etc/nginx/sites-available/$Domain"
  
  $nginxEnable = @"
set -euo pipefail
ln -sf /etc/nginx/sites-available/$Domain /etc/nginx/sites-enabled/$Domain
nginx -t
systemctl reload nginx
echo "Nginx configured for $Domain"
"@
  $nginxEnable | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "Nginx configured for http://$Domain"

  # ── 3h. SSL with certbot ────────────────────────────────
  Log "Setting up SSL certificate for $Domain"
  $sslScript = @"
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Install certbot if needed
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

# Check if cert already exists
if certbot certificates 2>/dev/null | grep -q "$Domain"; then
  echo "Certificate already exists — renewing if needed"
  certbot renew --quiet
else
  echo "Issuing new certificate for $Domain"
  certbot --nginx \
    -d $Domain \
    -d www.$Domain \
    --non-interactive \
    --agree-tos \
    --email $AdminEmail \
    --redirect
fi

systemctl reload nginx
echo "SSL ✅"
"@
  $sslScript | ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" bash
  Ok "SSL certificate active for https://$Domain"

  # ── 3i. Verify deployment ───────────────────────────────
  Log "Verifying deployment"
  Start-Sleep -Seconds 3
  $healthCheck = ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" "curl -sk https://$Domain/api/health 2>/dev/null || curl -s http://127.0.0.1:3001/api/health 2>/dev/null || echo 'not ready yet'"
  Write-Host "     Health check: $healthCheck" -ForegroundColor Yellow

  $pm2Status = ssh -i "$SshKey" -o StrictHostKeyChecking=no "${VpsUser}@${VpsHost}" "pm2 list --no-color 2>/dev/null | grep autowit || echo 'no pm2 processes'"
  Write-Host "     PM2 status: $pm2Status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host " ✅  DEPLOY COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host " GitHub: https://github.com/$GitHubUser/$RepoName" -ForegroundColor White
Write-Host " App:    https://$Domain" -ForegroundColor White
Write-Host " API:    https://$Domain/api/health" -ForegroundColor White
Write-Host " Admin:  https://$Domain/admin" -ForegroundColor White
Write-Host ""
Write-Host " ⚠️  Don't forget to edit .env on VPS with real API keys:" -ForegroundColor Yellow
Write-Host "     ssh root@$VpsHost 'nano $VpsPath/.env'" -ForegroundColor Yellow
Write-Host " Then restart: ssh root@$VpsHost 'pm2 restart all'" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green

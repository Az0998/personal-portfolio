#!/usr/bin/env bash
# Run on Aliyun ECS as root after repo exists at /opt/personal-portfolio
# - sets admin password
# - rebuilds Next
# - installs systemd + optional nginx :80 → :3000
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/personal-portfolio}"
APP_USER="${APP_USER:-root}"
PORT="${PORT:-3000}"
# Override: ADMIN_PASSWORD='your-secret' bash scripts/aliyun-serve.sh
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

cd "$APP_DIR"

if [[ -z "$ADMIN_PASSWORD" ]]; then
  ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
fi

umask 077
cat > .env <<EOF
DATABASE_URL="file:./prod.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
FORCE_SEED=0
EOF
chmod 600 .env

echo "==> Admin password written to $APP_DIR/.env (also printed once below)"
echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}"

npm ci
npx prisma generate
npx prisma db push
FORCE_SEED=0 npx tsx prisma/seed.ts || true
NODE_OPTIONS=--max-old-space-size=1536 npm run build

cat >/etc/systemd/system/personal-portfolio.service <<EOF
[Unit]
Description=personal-portfolio Next.js
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
# 2G box: leave headroom for OS
Environment=NODE_OPTIONS=--max-old-space-size=1024

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable personal-portfolio
systemctl restart personal-portfolio

if command -v nginx >/dev/null 2>&1 || dnf -y install nginx || yum -y install nginx; then
  cat >/etc/nginx/conf.d/personal-portfolio.conf <<'NGX'
server {
  listen 80 default_server;
  server_name _;
  client_max_body_size 32m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGX
  # Drop default conflicting server if present
  rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
  systemctl enable nginx
  systemctl restart nginx
fi

echo ""
echo "==> Health"
systemctl --no-pager --full status personal-portfolio | head -n 20 || true
ss -lntp | grep -E ':80|:3000' || true
free -h
df -h /
echo ""
echo "Open: http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_EIP)/sfl-lab"
echo "Admin: /admin  user=admin  password=${ADMIN_PASSWORD}"

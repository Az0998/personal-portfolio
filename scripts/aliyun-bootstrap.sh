#!/usr/bin/env bash
# Alibaba Cloud ECS bootstrap for personal-portfolio (2C2G friendly).
# Run as root on Alibaba Cloud Linux 3 / CentOS-like:
#   curl -fsSL ... | bash   OR   bash aliyun-bootstrap.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/personal-portfolio}"
SWAP_GB="${SWAP_GB:-2}"
NODE_MAJOR="${NODE_MAJOR:-20}"

echo "==> [1/5] SWAP ${SWAP_GB}G (recommended on 2G RAM)"
if ! swapon --show | grep -q .; then
  fallocate -l "${SWAP_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_GB * 1024))
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=30
fi
free -h

echo "==> [2/5] Packages"
if command -v dnf >/dev/null 2>&1; then
  dnf -y update
  dnf -y install git nginx
elif command -v yum >/dev/null 2>&1; then
  yum -y update
  yum -y install git nginx
else
  apt-get update -y
  apt-get install -y git nginx
fi

echo "==> [3/5] Node.js ${NODE_MAJOR}"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash - || true
  if command -v dnf >/dev/null 2>&1; then
    dnf -y install nodejs || curl -fsSL https://fnm.vercel.app/install | bash
  elif command -v yum >/dev/null 2>&1; then
    yum -y install nodejs
  else
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  fi
fi
node -v
npm -v

echo "==> [4/5] Clone / update repo"
mkdir -p "$(dirname "$APP_DIR")"
if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone https://github.com/Az0998/personal-portfolio.git "$APP_DIR"
fi
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  cat > .env <<'EOF'
DATABASE_URL="file:./prod.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me-now"
FORCE_SEED=0
EOF
  echo "Wrote .env — change ADMIN_PASSWORD before exposing publicly."
fi

echo "==> [5/5] Build (may take several minutes on 2G)"
npm ci
npx prisma generate
npx prisma db push
FORCE_SEED=0 npx tsx prisma/seed.ts || true
NODE_OPTIONS=--max-old-space-size=1536 npm run build

echo ""
echo "Bootstrap done."
echo "Start (foreground smoke test):"
echo "  cd $APP_DIR && NODE_ENV=production PORT=3000 npm start"
echo "Then open http://<公网IP>:3000  (security group must allow 3000 or put Nginx on 80)."
echo ""
echo "Optional Nginx reverse proxy snippet:"
echo "  proxy_pass http://127.0.0.1:3000;"

#!/bin/bash

# TSADA SSR Deployment Script
set -e

echo "🚀 TSADA SSR Deployment kezdése..."

# Színes output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguráció
DEPLOY_TYPE=${1:-"docker"} # docker, pm2, vagy cloud
SERVER_HOST=${2:-""}
SSH_USER=${3:-"root"}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Pre-deployment checks
check_requirements() {
    print_step "Követelmények ellenőrzése..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js nem található! Telepítsd Node.js 18+-t"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ szükséges! Jelenlegi verzió: $(node --version)"
        exit 1
    fi

    print_step "Node.js verzió OK: $(node --version)"
}

# Docker deployment
deploy_docker() {
    print_step "Docker deployment indítása..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker nem található!"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose nem található!"
        exit 1
    fi

    # Build és start
    print_step "Docker image buildelése..."
    docker-compose build tsada-ssr

    print_step "Konténerek indítása..."
    docker-compose up -d tsada-ssr

    # Health check
    print_step "Health check..."
    sleep 10
    if docker-compose ps | grep -q "Up"; then
        print_step "✅ Docker deployment sikeres!"
        echo "🌐 Alkalmazás elérhető: http://localhost:3000"
    else
        print_error "Docker deployment sikertelen!"
        docker-compose logs tsada-ssr
        exit 1
    fi
}

# PM2 deployment
deploy_pm2() {
    print_step "PM2 deployment indítása..."

    # Dependencies
    print_step "Dependencies telepítése..."
    npm ci --production

    # Build
    print_step "SSR build futtatása..."
    npm run build:ssr

    # PM2 check/install
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 telepítése..."
        npm install -g pm2
    fi

    # PM2 deployment
    print_step "PM2-vel indítás..."

    # Stop if running
    pm2 stop tsada-ssr 2>/dev/null || true
    pm2 delete tsada-ssr 2>/dev/null || true

    # Start
    NODE_ENV=production PORT=3000 pm2 start server.js --name "tsada-ssr"
    pm2 save

    print_step "✅ PM2 deployment sikeres!"
    echo "🌐 Alkalmazás elérhető: http://localhost:3000"

    # Show status
    pm2 status tsada-ssr
}

# Remote server deployment
deploy_remote() {
    if [ -z "$SERVER_HOST" ]; then
        print_error "Server host nincs megadva!"
        echo "Használat: ./deploy.sh remote your-server.com [ssh-user]"
        exit 1
    fi

    print_step "Remote deployment: $SSH_USER@$SERVER_HOST"

    # Deploy script
    REMOTE_SCRIPT="
        set -e
        echo '📦 Kód frissítése...'
        cd /var/www/tsada || { echo 'Mappa nem található!'; exit 1; }

        git pull origin main

        echo '📦 Dependencies...'
        npm ci --production

        echo '🔨 Build...'
        npm run build:ssr

        echo '🔄 PM2 restart...'
        pm2 restart tsada-ssr || pm2 start server.js --name tsada-ssr

        echo '✅ Deployment kész!'
        pm2 status tsada-ssr
    "

    ssh $SSH_USER@$SERVER_HOST "$REMOTE_SCRIPT"

    print_step "✅ Remote deployment sikeres!"
    echo "🌐 Alkalmazás elérhető: https://$SERVER_HOST"
}

# Cloud deployment
deploy_cloud() {
    print_step "Cloud deployment..."

    if command -v railway &> /dev/null; then
        print_step "Railway deployment..."
        railway up
    elif command -v vercel &> /dev/null; then
        print_step "Vercel deployment..."
        vercel --prod
    else
        print_warning "Nincs cloud CLI telepítve"
        print_step "Manuális lépések:"
        echo "1. Git push origin main"
        echo "2. Cloud platform automatikusan deploy-ol"
        echo "3. Vagy használd a platform web interface-t"
    fi
}

# Main deployment logic
main() {
    echo "🏗️  TSADA SSR Deployment"
    echo "========================"

    check_requirements

    case $DEPLOY_TYPE in
        "docker")
            deploy_docker
            ;;
        "pm2")
            deploy_pm2
            ;;
        "remote")
            deploy_remote
            ;;
        "cloud")
            deploy_cloud
            ;;
        *)
            print_error "Ismeretlen deployment típus: $DEPLOY_TYPE"
            echo ""
            echo "Használat:"
            echo "  ./deploy.sh docker                    # Local Docker deployment"
            echo "  ./deploy.sh pm2                       # Local PM2 deployment"
            echo "  ./deploy.sh remote server.com [user]  # Remote server deployment"
            echo "  ./deploy.sh cloud                     # Cloud platform deployment"
            exit 1
            ;;
    esac

    echo ""
    print_step "🎉 Deployment befejezve!"
    echo ""
    echo "📋 Hasznos parancsok:"

    if [ "$DEPLOY_TYPE" = "docker" ]; then
        echo "  docker-compose logs -f tsada-ssr  # Logs"
        echo "  docker-compose restart tsada-ssr  # Restart"
        echo "  docker-compose down               # Stop"
    elif [ "$DEPLOY_TYPE" = "pm2" ]; then
        echo "  pm2 logs tsada-ssr    # Logs"
        echo "  pm2 restart tsada-ssr # Restart"
        echo "  pm2 stop tsada-ssr    # Stop"
        echo "  pm2 monit             # Monitoring"
    fi

    echo ""
}

# Script futtatása
main "$@"
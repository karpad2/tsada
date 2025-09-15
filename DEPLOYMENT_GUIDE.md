# TSADA SSR Deployment Guide

## Deployment Opciók

### 1. Hagyományos VPS/Server (Docker nélkül)

#### Előfeltételek
```bash
# Node.js 18+ telepítése
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 telepítése (process manager)
npm install -g pm2
```

#### Deployment lépések
```bash
# 1. Kód feltöltése
git clone https://github.com/your-username/tsada.git
cd tsada

# 2. Dependencies telepítése
npm ci --production

# 3. SSR build
npm run build:ssr

# 4. PM2-vel indítás
pm2 start server.js --name "tsada-ssr"
pm2 startup
pm2 save

# 5. Nginx reverse proxy
sudo apt install nginx
```

#### Nginx konfiguráció
```nginx
# /etc/nginx/sites-available/tsada
server {
    listen 80;
    server_name tsada.edu.rs;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location /assets {
        alias /path/to/tsada/dist/client/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Docker Deployment (VPS/Cloud)

#### VPS-en Docker-rel
```bash
# 1. Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Docker Compose telepítése
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Alkalmazás deployment
git clone https://github.com/your-username/tsada.git
cd tsada

# Production build és indítás
docker-compose up -d --build

# Nginx proxy ugyanaz mint fent, de port 3000-ra
```

### 3. Cloud Platforms (Egyszerű)

#### Railway
```bash
# 1. Railway CLI telepítése
npm install -g @railway/cli

# 2. Login és deployment
railway login
railway init
railway up

# Automatikusan detectálja a Dockerfile-t
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: tsada-ssr
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

#### Vercel (Edge Functions)
```bash
# Vercel adapter szükséges
npm install @vercel/node
vercel --prod
```

### 4. Kubernetes (Nagyobb skála)

#### K8s manifests
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tsada-ssr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tsada-ssr
  template:
    metadata:
      labels:
        app: tsada-ssr
    spec:
      containers:
      - name: tsada-ssr
        image: your-registry/tsada-ssr:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
---
apiVersion: v1
kind: Service
metadata:
  name: tsada-ssr-service
spec:
  selector:
    app: tsada-ssr
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy TSADA SSR

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build SSR
      run: npm run build:ssr

    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /path/to/tsada
          git pull origin main
          npm ci --production
          npm run build:ssr
          pm2 restart tsada-ssr
```

## SSL/HTTPS Setup

### Let's Encrypt (ingyenes)
```bash
# Certbot telepítése
sudo apt install certbot python3-certbot-nginx

# SSL certificate
sudo certbot --nginx -d tsada.edu.rs

# Auto renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx HTTPS konfiguráció
```nginx
server {
    listen 443 ssl http2;
    server_name tsada.edu.rs;

    ssl_certificate /etc/letsencrypt/live/tsada.edu.rs/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tsada.edu.rs/privkey.pem;

    # SSL optimalizáció
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        # proxy headers ugyanúgy mint fent
    }
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name tsada.edu.rs;
    return 301 https://$server_name$request_uri;
}
```

## Environment Variables

### Production .env
```bash
# Server környezetében
NODE_ENV=production
PORT=3000
BASE_URL=https://tsada.edu.rs

# Appwrite konfiguráció
APPWRITE_ENDPOINT=https://your-appwrite-server/v1
APPWRITE_PROJECT_ID=your-project-id

# Analytics
GOOGLE_ANALYTICS_ID=G-FZYC1503VB
```

## Monitoring & Logs

### PM2 Monitoring
```bash
# Logs
pm2 logs tsada-ssr

# Monitoring
pm2 monit

# Restart ha crash-el
pm2 restart tsada-ssr

# Status check
pm2 status
```

### Docker Monitoring
```bash
# Logs
docker-compose logs -f tsada-ssr

# Resource usage
docker stats

# Health check
docker-compose ps
```

## Performance Optimizations

### Nginx Caching
```nginx
# Static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API response caching
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
}
```

### CDN Setup (opcionális)
```bash
# Cloudflare, AWS CloudFront, vagy egyéb CDN
# Static assets-eket CDN-re
```

## Biztonsági Beállítások

### Firewall
```bash
# ufw beállítása
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Nginx Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Backup Strategy

### Automated backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/tsada_$DATE.tar.gz /path/to/tsada
# Keep only last 7 backups
find /backups -name "tsada_*.tar.gz" -mtime +7 -delete
```

## Quick Commands Reference

```bash
# Hagyományos deployment
npm run build:ssr && pm2 restart tsada-ssr

# Docker deployment
docker-compose up -d --build

# Status check
pm2 status              # PM2
docker-compose ps       # Docker

# Logs
pm2 logs tsada-ssr     # PM2
docker-compose logs    # Docker

# SSL renewal
sudo certbot renew

# Backup
tar -czf backup.tar.gz /path/to/tsada
```

## Troubleshooting

### Port már használatban
```bash
# Más port használata
PORT=3001 pm2 start server.js --name tsada-ssr
# Nginx proxy-t frissíteni kell
```

### Build hibák
```bash
# Node modules tisztítása
rm -rf node_modules package-lock.json
npm install
npm run build:ssr
```

### SSL problémák
```bash
# Certbot renewal
sudo certbot renew --dry-run
```
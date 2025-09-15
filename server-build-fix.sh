#!/bin/bash

# Server Build Fix Script for TSADA SSR
# Run this on the server to fix build issues

echo "🔧 Fixing TSADA SSR build issues..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Navigate to project directory
cd /home/karpad/tsada || exit 1

echo -e "${YELLOW}Step 1: Fixing asset files...${NC}"

# Check if Loading.gif exists (capital L)
if [ -f "src/assets/Loading.gif" ]; then
    echo "Found Loading.gif, creating lowercase copy..."
    cp src/assets/Loading.gif src/assets/loading.gif
fi

# If still no loading.gif, create a placeholder
if [ ! -f "src/assets/loading.gif" ]; then
    echo "Creating placeholder loading.gif..."
    # Create a minimal 1x1 transparent GIF
    echo "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" | base64 -d > src/assets/loading.gif
    echo -e "${GREEN}✓ Created placeholder loading.gif${NC}"
fi

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm ci --production

echo -e "${YELLOW}Step 3: Building SSR...${NC}"
npm run build:ssr

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"

    echo -e "${YELLOW}Step 4: Starting with PM2...${NC}"

    # Stop existing if running
    pm2 stop tsada-ssr 2>/dev/null || true
    pm2 delete tsada-ssr 2>/dev/null || true

    # Start new instance
    NODE_ENV=production PORT=3000 pm2 start server.js --name "tsada-ssr"
    pm2 save

    echo -e "${GREEN}✓ Server started successfully!${NC}"
    echo "🚀 TSADA SSR is running at http://localhost:3000"

    # Show status
    pm2 status tsada-ssr
else
    echo -e "${YELLOW}Build failed. Trying alternative fix...${NC}"

    # Alternative: modify main.ts to remove image imports
    echo "Patching main.ts for SSR compatibility..."

    # Create a backup
    cp src/main.ts src/main.ts.backup

    # Simple fix: comment out the problematic imports
    sed -i 's/import Loading from "@\/assets\/Loading.gif"/\/\/ import Loading from "@\/assets\/Loading.gif"/' src/main.ts
    sed -i 's/import LoadingImg from "@\/assets\/loading.gif"/\/\/ import LoadingImg from "@\/assets\/loading.gif"/' src/main.ts

    # Retry build
    echo "Retrying build..."
    npm run build:ssr

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build successful with patch!${NC}"
        NODE_ENV=production PORT=3000 pm2 start server.js --name "tsada-ssr"
        pm2 save
    else
        echo "Build still failing. Please check the error messages above."
        exit 1
    fi
fi

echo ""
echo "📋 Useful commands:"
echo "  pm2 logs tsada-ssr     # View logs"
echo "  pm2 restart tsada-ssr  # Restart server"
echo "  pm2 monit              # Monitor performance"
echo ""
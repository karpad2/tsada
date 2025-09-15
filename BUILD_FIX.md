# Build Fix for SSR

## Problem
The build fails because of missing `loading.gif` file on the server:
```
ENOENT: no such file or directory, open '/home/karpad/tsada/src/assets/loading.gif'
```

## Quick Fix

### Option 1: Create/Copy the missing file
```bash
# On the server, create a placeholder loading.gif if missing
cd /home/karpad/tsada
touch src/assets/loading.gif
# Or copy from another location if available
```

### Option 2: Fix case sensitivity (Recommended)
The issue is case sensitivity - the file is imported as both `Loading.gif` and `loading.gif`.

1. Check actual filename:
```bash
ls -la src/assets/*.gif
```

2. If file is `Loading.gif` (capital L), rename it:
```bash
cd src/assets
mv Loading.gif loading.gif
```

3. Or update imports to match actual filename in `src/main.ts`:
```javascript
// Change line 2 from:
import Loading from "@/assets/Loading.gif"
// To:
import Loading from "@/assets/loading.gif"
```

### Option 3: Make build ignore missing assets temporarily
Create the file with any content:
```bash
# Create a minimal 1x1 GIF
echo "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" | base64 -d > src/assets/loading.gif
```

## Full Server Deployment Fix

```bash
# 1. Ensure all assets exist
cd /home/karpad/tsada

# 2. Check and fix case sensitivity
if [ -f "src/assets/Loading.gif" ]; then
    mv src/assets/Loading.gif src/assets/loading.gif
fi

# 3. If still missing, create placeholder
if [ ! -f "src/assets/loading.gif" ]; then
    echo "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" | base64 -d > src/assets/loading.gif
fi

# 4. Retry build
npm run build:ssr

# 5. Start with PM2
pm2 start server.js --name "tsada-ssr"
pm2 save
pm2 startup
```

## Prevention for Future

1. **Use consistent naming** - always lowercase for assets
2. **Add to git** - ensure all assets are committed:
```bash
git add -f src/assets/loading.gif
git commit -m "Add loading.gif asset"
git push
```

3. **Update .gitignore** if needed:
```gitignore
# Don't ignore loading images
!src/assets/loading.gif
!src/assets/Loading.gif
```

## Alternative: Remove loading image dependency for SSR

Edit `src/main.ts` to conditionally load the image:
```javascript
// Only import loading image on client side
let LoadingImg = ''
if (typeof window !== 'undefined') {
  LoadingImg = await import('@/assets/loading.gif').then(m => m.default)
}
```

This way SSR build won't fail even if the image is missing.
---
description: Check status of development and production environments
---
# Check Environment Status

Quick commands to check the status of both environments.

## Steps

### 1. Check production server status
// turbo
```bash
pm2 status finances-api
```

### 2. Check if dev server is running
// turbo
```bash
pgrep -f "node server_dev.js" && echo "Dev server is running" || echo "Dev server is NOT running"
```

### 3. Check production logs (last 50 lines)
// turbo
```bash
pm2 logs finances-api --lines 50 --nostream
```

### 4. Check current versions
// turbo
```bash
echo "=== DEV VERSION ===" && cat /root/.gemini/antigravity/scratch/finances_app/client/src/config.js | grep APP_VERSION && echo "=== PROD VERSION ===" && pm2 show finances-api | grep version
```

---
description: Deploy changes from development to production environment
---
# Deploy to Production

This workflow deploys the current development code to the production server.

## Environment Info
- **Dev Directory**: `/root/.gemini/antigravity/scratch/finances_app`
- **Prod Directory**: `/var/www/finances.tbelt.online/api`
- **PM2 Process**: `finances-api`
- **Note**: Production is NOT a git repo. Files are copied directly.

## Steps

### 1. Build the frontend
// turbo
```bash
cd /root/.gemini/antigravity/scratch/finances_app/client && npm run build
```

### 2. Commit and push changes to GitHub (dev repo)
```bash
cd /root/.gemini/antigravity/scratch/finances_app && git add -A && git commit -m "Deploy: v<version>" && git push origin master
```

### 3. Copy server files to production (excluding node_modules, .env, index.js)
**IMPORTANT**: Do NOT overwrite `index.js` in production - it has production-specific settings (PORT=3001).
// turbo
```bash
rsync -av --exclude 'node_modules' --exclude '.env' --exclude 'index.js' --exclude 'server_dev.js' /root/.gemini/antigravity/scratch/finances_app/server/ /var/www/finances.tbelt.online/api/server/
```

### 4. Copy the built frontend to production (html directory)
// turbo
```bash
rm -rf /var/www/finances.tbelt.online/html/* && cp -r /root/.gemini/antigravity/scratch/finances_app/client/dist/* /var/www/finances.tbelt.online/html/
```

### 5. Install any new dependencies (server)
// turbo
```bash
cd /var/www/finances.tbelt.online/api/server && npm install
```

### 6. Restart the production server
// turbo
```bash
pm2 restart finances-api && pm2 save
```

### 7. Verify production is running
// turbo
```bash
sleep 3 && pm2 status finances-api && curl -s https://finances.tbelt.online/api/auth/me -H "Authorization: Bearer test"
```

## Create GitHub Release (optional)
```bash
cd /root/.gemini/antigravity/scratch/finances_app && git tag -a v<version> -m "v<version>: <description>" && git push origin v<version>
```

## Rollback
If something goes wrong, restore from backup:
```bash
cp -r /var/www/finances.tbelt.online/api_backup_<date>/* /var/www/finances.tbelt.online/api/
pm2 restart finances-api
```

---
description: Deploy changes from development to production environment
---
# Deploy to Production

This workflow deploys the current development code to the production server.

## Environment Info
- **Dev Directory**: `/root/.gemini/antigravity/scratch/finances_app`
- **Prod Directory**: `/var/www/finances.tbelt.online/api`
- **PM2 Process**: `finances-api`

## Steps

### 1. Build the frontend
// turbo
```bash
cd /root/.gemini/antigravity/scratch/finances_app/client && npm run build
```

### 2. Commit and push changes to GitHub
```bash
cd /root/.gemini/antigravity/scratch/finances_app && git add -A && git commit -m "Deploy: <version>" && git push origin master
```

### 3. Pull changes in production directory
// turbo
```bash
cd /var/www/finances.tbelt.online/api && git pull origin master
```

### 4. Install any new dependencies (server)
// turbo
```bash
cd /var/www/finances.tbelt.online/api/server && npm install
```

### 5. Copy the built frontend to production
// turbo
```bash
rm -rf /var/www/finances.tbelt.online/api/dist && cp -r /root/.gemini/antigravity/scratch/finances_app/client/dist /var/www/finances.tbelt.online/api/
```

### 6. Restart the production server
// turbo
```bash
pm2 restart finances-api
```

### 7. Verify production is running
// turbo
```bash
pm2 status finances-api && curl -s https://finances.tbelt.online/api/test-loans
```

## Rollback
If something goes wrong, you can rollback with:
```bash
cd /var/www/finances.tbelt.online/api && git checkout HEAD~1 && pm2 restart finances-api
```

---
description: Start the development server for local testing
---
# Start Development Server

This workflow starts the development environment for testing changes before production.

## Environment Info
- **Dev Backend**: `http://localhost:3002`
- **Dev Frontend**: `http://localhost:5173` (Vite dev server)
- **Dev Directory**: `/root/.gemini/antigravity/scratch/finances_app`

## Steps

### 1. Start the backend server (if not running)
```bash
cd /root/.gemini/antigravity/scratch/finances_app/server && node server_dev.js
```
This runs in the background. The server uses port 3002 to avoid conflict with production (port 3001).

### 2. Start the frontend dev server (optional, for hot reload)
```bash
cd /root/.gemini/antigravity/scratch/finances_app/client && npm run dev
```
This provides hot module replacement for faster development.

## Notes
- The dev server uses `server_dev.js` which runs on port 3002
- Production uses `index.js` and runs on port 3001 via PM2
- Database is shared between dev and prod (same PostgreSQL instance)

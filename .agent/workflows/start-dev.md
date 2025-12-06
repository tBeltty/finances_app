---
description: Start the development server for local testing
---
# Start Development Server

This workflow starts the development environment for testing changes before production.

## ⚠️ IMPORTANT: Port Configuration
- **Development**: Port **3002** (via `server_dev.js`)
- **Production**: Port **3001** (via `index.js` + PM2)

**NEVER** modify `index.js` PORT in production. Development uses a separate `server_dev.js` file with PORT 3002 hardcoded to avoid conflicts.

## Environment Info
- **Dev Backend**: `http://localhost:3002`
- **Dev Frontend**: `http://localhost:5173` (Vite dev server)
- **Dev Directory**: `/root/.gemini/antigravity/scratch/finances_app`

## Steps

### 1. Start the backend server (if not running)
```bash
cd /root/.gemini/antigravity/scratch/finances_app/server && node server_dev.js
```
This runs in the background on port 3002.

### 2. Start the frontend dev server (optional, for hot reload)
```bash
cd /root/.gemini/antigravity/scratch/finances_app/client && npm run dev
```
This provides hot module replacement for faster development.

## Notes
- `server_dev.js` = Development (port 3002)
- `index.js` = Production (port 3001, managed by PM2)
- Database is shared between dev and prod (same PostgreSQL instance)
- **DO NOT** copy `server_dev.js` or modify ports in production

#!/bin/bash

PROD_DIR="/var/www/finances.tbelt.online"
API_DIR="$PROD_DIR/api"
HTML_DIR="$PROD_DIR/html"
SCRATCH_DIR="/root/.gemini/antigravity/scratch/finances_app"

echo "🚀 Starting Deployment to Production..."

# 1. Backup
echo "📦 Backing up..."
timestamp=$(date +%Y%m%d_%H%M%S)
cp -r $API_DIR "$PROD_DIR/api_backup_$timestamp"
# cp -r $HTML_DIR "$PROD_DIR/html_backup_$timestamp"

# 2. Copy Client Files (Frontend Source)
echo "📂 Copying Client files to $API_DIR..."
# We copy contents of client/ to api/
# Excluding node_modules and .git
rsync -av --exclude 'node_modules' --exclude '.git' $SCRATCH_DIR/client/ $API_DIR/

# 3. Copy Server Files (Backend Source)
echo "📂 Copying Server files to $API_DIR/server..."
# Ensure server dir exists
mkdir -p $API_DIR/server
rsync -av --exclude 'node_modules' --exclude '.git' $SCRATCH_DIR/server/ $API_DIR/server/

# 4. Install Dependencies
echo "⬇️ Installing Frontend Dependencies..."
cd $API_DIR
npm install --include=dev

echo "⬇️ Installing Backend Dependencies..."
cd $API_DIR/server
npm install

# 5. Build Frontend
echo "🏗️ Building Frontend..."
cd $API_DIR
rm -rf dist
rm -rf node_modules/.vite
npm run build

# 6. Deploy Frontend Build
echo "🚀 Deploying Frontend Build to $HTML_DIR..."
# Clear html dir (except maybe some assets if needed? No, build should replace)
# But let's be safe and just sync dist content
rsync -av --delete $API_DIR/dist/ $HTML_DIR/

# 7. Build Admin Client (Project Vano)
ADMIN_HTML_DIR="/var/www/vano.tbelt.online/html"
echo "📂 Copying Admin Client files to $API_DIR/admin_client..."
mkdir -p $API_DIR/admin_client
rsync -av --exclude 'node_modules' --exclude '.git' $SCRATCH_DIR/admin_client/ $API_DIR/admin_client/

echo "⬇️ Installing Admin Dependencies..."
cd $API_DIR/admin_client
npm install --include=dev

echo "🏗️ Building Admin Client..."
npm run build

echo "🚀 Deploying Admin Dashboard to $ADMIN_HTML_DIR..."
mkdir -p /var/www/vano.tbelt.online
mkdir -p $ADMIN_HTML_DIR
rsync -av --delete $API_DIR/admin_client/dist/ $ADMIN_HTML_DIR/

# 7. Restart Backend (PM2)
echo "🔄 Restarting Backend with PM2..."
cd $API_DIR/server

# Check if process exists in PM2
if pm2 list | grep -q "finances-server"; then
    pm2 reload "finances-server"
else
    pm2 start index.js --name "finances-server" --log ../server.log
fi

pm2 save


echo "✅ Deployment Complete!"

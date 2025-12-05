#!/bin/bash
# ============================================================
# Finances App - PostgreSQL Backup Script
# ============================================================
# This script creates compressed backups of the finances_db
# database and maintains a 14-day retention policy.
#
# Run via cron: 0 3 * * * /var/backups/finances_db/backup.sh
# ============================================================

set -e

# Configuration
DB_NAME="finances_db"
DB_USER="postgres"
BACKUP_DIR="/var/backups/finances_db"
STATUS_FILE="/tmp/finances_backup_status.json"
RETENTION_DAYS=14
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Function to update status (for frontend notification)
update_status() {
    local status=$1
    local message=$2
    echo "{\"status\": \"${status}\", \"message\": \"${message}\", \"timestamp\": \"$(date -Iseconds)\"}" > "$STATUS_FILE"
    chmod 644 "$STATUS_FILE"
}

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

# Start backup
log "========== Starting backup =========="
update_status "in_progress" "Database backup in progress..."

# Create backup with compression
log "Creating backup: ${BACKUP_FILE}"
if pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Backup completed successfully: ${BACKUP_SIZE}"
else
    log "ERROR: Backup failed!"
    update_status "error" "Backup failed"
    exit 1
fi

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
log "Deleted ${DELETED_COUNT} old backup(s)"

# List current backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Current backups: ${BACKUP_COUNT} files, Total size: ${TOTAL_SIZE}"

# Clear status after backup
sleep 2
update_status "idle" "Last backup: ${DATE}"

log "========== Backup complete =========="
exit 0

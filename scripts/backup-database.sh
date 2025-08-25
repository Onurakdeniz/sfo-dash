#!/bin/bash

# Database Backup Script
# Run this BEFORE migration!

echo "🔵 Starting database backup..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it using: export DATABASE_URL='your_connection_string'"
    exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/backup_${TIMESTAMP}.sql"

# Create backup
echo "📦 Creating backup: $BACKUP_FILE"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')
    echo "✅ Backup created successfully!"
    echo "📁 File: $BACKUP_FILE"
    echo "📊 Size: $SIZE"
    
    # Compress the backup
    echo "🗜️  Compressing backup..."
    gzip $BACKUP_FILE
    
    COMPRESSED_SIZE=$(ls -lh ${BACKUP_FILE}.gz | awk '{print $5}')
    echo "✅ Compressed to: ${BACKUP_FILE}.gz"
    echo "📊 Compressed size: $COMPRESSED_SIZE"
    
    # Keep only last 5 backups
    echo "🧹 Cleaning old backups (keeping last 5)..."
    ls -t ./backups/*.gz | tail -n +6 | xargs -r rm
    
    echo ""
    echo "🎉 Backup complete!"
    echo ""
    echo "To restore this backup later, run:"
    echo "gunzip < ${BACKUP_FILE}.gz | psql \$DATABASE_URL"
else
    echo "❌ Backup failed!"
    exit 1
fi
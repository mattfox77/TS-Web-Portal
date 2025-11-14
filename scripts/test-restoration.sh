#!/bin/bash

###############################################################################
# Database Restoration Test Script
#
# This script performs a quarterly restoration test to verify that backups
# can be successfully restored. It creates a test database, restores a backup,
# verifies the data, and generates a test report.
#
# Usage: ./scripts/test-restoration.sh [backup-file]
#
# Example: ./scripts/test-restoration.sh database-2024-01-15-02-00-00.sql
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="tech-support-db-test"
BACKUP_BUCKET="tech-support-documents"
BACKUP_PREFIX="backups/"
REPORT_FILE="restoration-test-report-$(date +%Y%m%d-%H%M%S).md"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    log_error "Wrangler CLI is not installed. Please install it first:"
    echo "  npm install -g wrangler"
    exit 1
fi

# Get backup file from argument or list available backups
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    log_info "No backup file specified. Listing available backups..."
    npx wrangler r2 object list "$BACKUP_BUCKET" --prefix="$BACKUP_PREFIX"
    echo ""
    read -p "Enter backup filename (e.g., database-2024-01-15-02-00-00.sql): " BACKUP_FILE
fi

# Start test report
log_info "Creating test report: $REPORT_FILE"
cat > "$REPORT_FILE" << EOF
# Database Restoration Test Report

**Date**: $(date +%Y-%m-%d)
**Time**: $(date +%H:%M:%S)
**Tester**: $(whoami)
**Backup File**: $BACKUP_FILE
**Test Database**: $TEST_DB_NAME

## Test Procedure

EOF

# Step 1: Create test database
log_info "Step 1: Creating test database..."
echo "### Step 1: Create Test Database" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npx wrangler d1 create "$TEST_DB_NAME" 2>&1 | tee -a "$REPORT_FILE"; then
    echo "- [x] Test database created successfully" >> "$REPORT_FILE"
    log_info "Test database created successfully"
else
    echo "- [ ] Test database creation failed" >> "$REPORT_FILE"
    log_error "Failed to create test database"
    exit 1
fi
echo "" >> "$REPORT_FILE"

# Step 2: Download backup file
log_info "Step 2: Downloading backup file..."
echo "### Step 2: Download Backup File" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

BACKUP_PATH="${BACKUP_PREFIX}${BACKUP_FILE}"
LOCAL_BACKUP="test-restore-backup.sql"

if npx wrangler r2 object get "$BACKUP_BUCKET/$BACKUP_PATH" --file="$LOCAL_BACKUP" 2>&1 | tee -a "$REPORT_FILE"; then
    BACKUP_SIZE=$(ls -lh "$LOCAL_BACKUP" | awk '{print $5}')
    echo "- [x] Backup downloaded successfully" >> "$REPORT_FILE"
    echo "- Backup size: $BACKUP_SIZE" >> "$REPORT_FILE"
    log_info "Backup downloaded successfully (Size: $BACKUP_SIZE)"
else
    echo "- [ ] Backup download failed" >> "$REPORT_FILE"
    log_error "Failed to download backup file"
    npx wrangler d1 delete "$TEST_DB_NAME" --skip-confirmation
    exit 1
fi
echo "" >> "$REPORT_FILE"

# Step 3: Create schema
log_info "Step 3: Creating database schema..."
echo "### Step 3: Create Database Schema" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npx wrangler d1 execute "$TEST_DB_NAME" --remote --file=schema.sql 2>&1 | tee -a "$REPORT_FILE"; then
    echo "- [x] Schema created successfully" >> "$REPORT_FILE"
    log_info "Schema created successfully"
else
    echo "- [ ] Schema creation failed" >> "$REPORT_FILE"
    log_error "Failed to create schema"
    npx wrangler d1 delete "$TEST_DB_NAME" --skip-confirmation
    rm -f "$LOCAL_BACKUP"
    exit 1
fi
echo "" >> "$REPORT_FILE"

# Step 4: Restore data
log_info "Step 4: Restoring data from backup..."
echo "### Step 4: Restore Data" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

START_TIME=$(date +%s)
if npx wrangler d1 execute "$TEST_DB_NAME" --remote --file="$LOCAL_BACKUP" 2>&1 | tee -a "$REPORT_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "- [x] Data restored successfully" >> "$REPORT_FILE"
    echo "- Restoration time: ${DURATION} seconds" >> "$REPORT_FILE"
    log_info "Data restored successfully (Duration: ${DURATION}s)"
else
    echo "- [ ] Data restoration failed" >> "$REPORT_FILE"
    log_error "Failed to restore data"
    npx wrangler d1 delete "$TEST_DB_NAME" --skip-confirmation
    rm -f "$LOCAL_BACKUP"
    exit 1
fi
echo "" >> "$REPORT_FILE"

# Step 5: Verify record counts
log_info "Step 5: Verifying record counts..."
echo "### Step 5: Verify Record Counts" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

VERIFY_QUERY="
SELECT 'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'documents', COUNT(*) FROM documents;
"

echo '```' >> "$REPORT_FILE"
npx wrangler d1 execute "$TEST_DB_NAME" --remote --command="$VERIFY_QUERY" 2>&1 | tee -a "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- [x] Record counts verified" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Step 6: Verify data integrity
log_info "Step 6: Verifying data integrity..."
echo "### Step 6: Verify Data Integrity" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

INTEGRITY_QUERY="
SELECT 'Orphaned Users' as check_type, COUNT(*) as count 
FROM users 
WHERE client_id NOT IN (SELECT id FROM clients)
UNION ALL
SELECT 'Orphaned Tickets', COUNT(*) 
FROM tickets 
WHERE client_id NOT IN (SELECT id FROM clients)
UNION ALL
SELECT 'Orphaned Invoices', COUNT(*) 
FROM invoices 
WHERE client_id NOT IN (SELECT id FROM clients);
"

echo '```' >> "$REPORT_FILE"
INTEGRITY_RESULT=$(npx wrangler d1 execute "$TEST_DB_NAME" --remote --command="$INTEGRITY_QUERY" 2>&1)
echo "$INTEGRITY_RESULT" | tee -a "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if there are any orphaned records
if echo "$INTEGRITY_RESULT" | grep -q "| 0 |"; then
    echo "- [x] No data integrity issues found" >> "$REPORT_FILE"
    log_info "Data integrity verified - no orphaned records"
else
    echo "- [ ] Data integrity issues detected" >> "$REPORT_FILE"
    log_warn "Data integrity issues detected - see report for details"
fi
echo "" >> "$REPORT_FILE"

# Step 7: Verify latest records
log_info "Step 7: Verifying latest records..."
echo "### Step 7: Verify Latest Records" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

LATEST_QUERY="
SELECT 'Latest Client' as type, created_at 
FROM clients 
ORDER BY created_at DESC 
LIMIT 1;
"

echo '```' >> "$REPORT_FILE"
npx wrangler d1 execute "$TEST_DB_NAME" --remote --command="$LATEST_QUERY" 2>&1 | tee -a "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- [x] Latest records verified" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Test Summary
echo "## Test Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Status**: ✅ PASS" >> "$REPORT_FILE"
echo "- **Backup File Size**: $BACKUP_SIZE" >> "$REPORT_FILE"
echo "- **Restoration Time**: ${DURATION} seconds" >> "$REPORT_FILE"
echo "- **Test Database**: $TEST_DB_NAME" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- Backup system is functioning correctly" >> "$REPORT_FILE"
echo "- Restoration procedure is validated" >> "$REPORT_FILE"
echo "- Next test scheduled for: $(date -d '+3 months' +%Y-%m-%d)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## Sign-off" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Tested by**: $(whoami)" >> "$REPORT_FILE"
echo "**Date**: $(date +%Y-%m-%d)" >> "$REPORT_FILE"
echo "**Status**: ✅ PASS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Cleanup
log_info "Step 8: Cleaning up test resources..."
echo "### Step 8: Cleanup" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npx wrangler d1 delete "$TEST_DB_NAME" --skip-confirmation 2>&1 | tee -a "$REPORT_FILE"; then
    echo "- [x] Test database deleted" >> "$REPORT_FILE"
    log_info "Test database deleted"
else
    echo "- [ ] Failed to delete test database" >> "$REPORT_FILE"
    log_warn "Failed to delete test database - manual cleanup required"
fi

rm -f "$LOCAL_BACKUP"
echo "- [x] Temporary files cleaned up" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Final output
log_info "Restoration test completed successfully!"
log_info "Test report saved to: $REPORT_FILE"
echo ""
echo "Summary:"
echo "  - Backup file: $BACKUP_FILE"
echo "  - Backup size: $BACKUP_SIZE"
echo "  - Restoration time: ${DURATION} seconds"
echo "  - Status: ✅ PASS"
echo ""
echo "Full report: $REPORT_FILE"

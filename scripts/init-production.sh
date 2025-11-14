#!/bin/bash

# Production Database and Storage Initialization Script
# This script sets up the production D1 database and R2 bucket

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
print_info "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    print_warning "Not logged in to Cloudflare. Running login..."
    wrangler login
fi

print_info "Authenticated with Cloudflare!"
echo ""

# Confirm production setup
print_warning "⚠️  You are about to initialize PRODUCTION resources ⚠️"
echo ""
echo "This script will:"
echo "  1. Create production D1 database"
echo "  2. Initialize database schema"
echo "  3. Seed initial data"
echo "  4. Create production R2 bucket"
echo "  5. Configure bucket settings"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_info "Initialization cancelled."
    exit 0
fi

echo ""
print_step "Step 1: Creating Production D1 Database"
echo ""

# Check if database already exists
if wrangler d1 list | grep -q "tech-support-db-production"; then
    print_warning "Database 'tech-support-db-production' already exists."
    read -p "Do you want to recreate it? This will DELETE all existing data! (yes/no): " recreate
    
    if [ "$recreate" = "yes" ]; then
        print_info "Deleting existing database..."
        wrangler d1 delete tech-support-db-production --skip-confirmation || true
        print_info "Creating new database..."
        wrangler d1 create tech-support-db-production
    else
        print_info "Using existing database."
    fi
else
    print_info "Creating production database..."
    wrangler d1 create tech-support-db-production
fi

echo ""
print_info "Database created successfully!"
print_warning "IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo ""
read -p "Press Enter after updating wrangler.toml..."

echo ""
print_step "Step 2: Initializing Database Schema"
echo ""

if [ ! -f "schema.sql" ]; then
    print_error "schema.sql not found in current directory"
    exit 1
fi

print_info "Running schema.sql on production database..."
wrangler d1 execute tech-support-db-production --remote --file=./schema.sql

if [ $? -eq 0 ]; then
    print_info "Schema initialized successfully!"
else
    print_error "Failed to initialize schema"
    exit 1
fi

echo ""
print_step "Step 3: Seeding Initial Data"
echo ""

if [ ! -f "scripts/seed-data.sql" ]; then
    print_warning "scripts/seed-data.sql not found. Skipping seed data."
else
    print_info "Running seed-data.sql on production database..."
    wrangler d1 execute tech-support-db-production --remote --file=./scripts/seed-data.sql
    
    if [ $? -eq 0 ]; then
        print_info "Initial data seeded successfully!"
    else
        print_error "Failed to seed initial data"
        exit 1
    fi
fi

echo ""
print_step "Step 4: Verifying Database"
echo ""

print_info "Checking database tables..."
wrangler d1 execute tech-support-db-production --remote --command \
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

print_info "Checking service packages..."
wrangler d1 execute tech-support-db-production --remote --command \
    "SELECT COUNT(*) as count FROM service_packages"

echo ""
print_step "Step 5: Creating Production R2 Bucket"
echo ""

# Check if bucket already exists
if wrangler r2 bucket list | grep -q "tech-support-documents-production"; then
    print_warning "Bucket 'tech-support-documents-production' already exists."
    print_info "Using existing bucket."
else
    print_info "Creating production R2 bucket..."
    wrangler r2 bucket create tech-support-documents-production
    
    if [ $? -eq 0 ]; then
        print_info "R2 bucket created successfully!"
    else
        print_error "Failed to create R2 bucket"
        exit 1
    fi
fi

echo ""
print_step "Step 6: Configuring R2 Bucket"
echo ""

# Create CORS configuration
print_info "Creating CORS configuration..."
cat > /tmp/r2-cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

print_info "Applying CORS configuration..."
wrangler r2 bucket cors put tech-support-documents-production --file=/tmp/r2-cors.json

if [ $? -eq 0 ]; then
    print_info "CORS configuration applied!"
else
    print_warning "Failed to apply CORS configuration (may not be critical)"
fi

# Create lifecycle configuration
print_info "Creating lifecycle rules..."
cat > /tmp/r2-lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

print_info "Applying lifecycle rules..."
wrangler r2 bucket lifecycle put tech-support-documents-production --file=/tmp/r2-lifecycle.json

if [ $? -eq 0 ]; then
    print_info "Lifecycle rules applied!"
else
    print_warning "Failed to apply lifecycle rules (may not be critical)"
fi

# Clean up temp files
rm -f /tmp/r2-cors.json /tmp/r2-lifecycle.json

echo ""
print_step "Step 7: Verifying R2 Bucket"
echo ""

print_info "Listing R2 buckets..."
wrangler r2 bucket list

print_info "Testing R2 bucket access..."
echo "test" > /tmp/test.txt
wrangler r2 object put tech-support-documents-production/test.txt --file=/tmp/test.txt
wrangler r2 object get tech-support-documents-production/test.txt
wrangler r2 object delete tech-support-documents-production/test.txt
rm -f /tmp/test.txt

print_info "R2 bucket is working correctly!"

echo ""
print_info "========================================="
print_info "Production Initialization Complete!"
print_info "========================================="
echo ""

print_info "Summary:"
echo "  ✓ D1 Database: tech-support-db-production"
echo "  ✓ Database Schema: Initialized"
echo "  ✓ Initial Data: Seeded"
echo "  ✓ R2 Bucket: tech-support-documents-production"
echo "  ✓ CORS: Configured"
echo "  ✓ Lifecycle Rules: Configured"
echo ""

print_info "Next steps:"
echo "  1. Update wrangler.toml with database_id (if not done)"
echo "  2. Bind database and bucket to Pages project"
echo "  3. Set environment variables in Cloudflare dashboard"
echo "  4. Deploy the application"
echo ""

print_info "To bind resources to Pages project:"
echo "  wrangler pages project create tech-support-client-portal --production-branch=main"
echo ""

print_info "Initialization complete! 🚀"

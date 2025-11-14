#!/bin/bash

# Create Admin User Script
# This script creates an admin user in the production database

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

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    print_error "Not logged in to Cloudflare. Run: wrangler login"
    exit 1
fi

echo ""
print_info "========================================="
print_info "Create Admin User"
print_info "========================================="
echo ""

print_warning "This script will create an admin user in the production database."
echo ""

# Get user details
read -p "Enter Clerk User ID (from Clerk dashboard): " user_id
read -p "Enter email address: " email
read -p "Enter first name: " first_name
read -p "Enter last name: " last_name

if [ -z "$user_id" ] || [ -z "$email" ]; then
    print_error "User ID and email are required!"
    exit 1
fi

echo ""
print_info "Creating admin user with:"
echo "  User ID: $user_id"
echo "  Email: $email"
echo "  Name: $first_name $last_name"
echo "  Role: admin"
echo ""

read -p "Is this correct? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_info "Cancelled."
    exit 0
fi

# Generate UUIDs for client and user
client_id=$(uuidgen | tr '[:upper:]' '[:lower:]')

print_info "Creating admin client..."

# Create admin client
wrangler d1 execute tech-support-db-production --remote --command \
    "INSERT INTO clients (id, name, email, company_name, status) 
     VALUES ('$client_id', 'Admin', '$email', 'Tech Support Computer Services', 'active')"

if [ $? -ne 0 ]; then
    print_error "Failed to create admin client"
    exit 1
fi

print_info "Admin client created with ID: $client_id"

print_info "Creating admin user..."

# Create admin user
wrangler d1 execute tech-support-db-production --remote --command \
    "INSERT INTO users (id, client_id, email, first_name, last_name, role) 
     VALUES ('$user_id', '$client_id', '$email', '$first_name', '$last_name', 'admin')"

if [ $? -ne 0 ]; then
    print_error "Failed to create admin user"
    exit 1
fi

print_info "Admin user created successfully!"

echo ""
print_info "Verifying user..."

wrangler d1 execute tech-support-db-production --remote --command \
    "SELECT u.id, u.email, u.first_name, u.last_name, u.role, c.name as client_name 
     FROM users u 
     JOIN clients c ON u.client_id = c.id 
     WHERE u.id = '$user_id'"

echo ""
print_info "========================================="
print_info "Admin User Created Successfully!"
print_info "========================================="
echo ""

print_info "Admin user details:"
echo "  User ID: $user_id"
echo "  Client ID: $client_id"
echo "  Email: $email"
echo "  Role: admin"
echo ""

print_info "Next steps:"
echo "  1. Log in to the portal with this Clerk user"
echo "  2. Verify admin access to /admin routes"
echo "  3. Create additional clients and users as needed"
echo ""

print_info "Done! 🎉"

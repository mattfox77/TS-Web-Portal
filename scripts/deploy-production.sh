#!/bin/bash

# Production Deployment Script for Tech Support Client Portal
# This script automates the deployment process to Cloudflare Pages

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

if ! command_exists wrangler; then
    print_error "Wrangler CLI is not installed. Install with: npm install -g wrangler"
    exit 1
fi

print_info "All prerequisites met!"

# Check if logged in to Cloudflare
print_info "Checking Cloudflare authentication..."
if ! wrangler whoami >/dev/null 2>&1; then
    print_warning "Not logged in to Cloudflare. Running login..."
    wrangler login
fi

print_info "Authenticated with Cloudflare!"

# Confirm production deployment
echo ""
print_warning "⚠️  You are about to deploy to PRODUCTION ⚠️"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_info "Deployment cancelled."
    exit 0
fi

# Run tests (if available)
print_info "Running tests..."
if npm run test --if-present; then
    print_info "Tests passed!"
else
    print_error "Tests failed. Aborting deployment."
    exit 1
fi

# Build the application
print_info "Building application..."
npm run pages:build

if [ $? -ne 0 ]; then
    print_error "Build failed. Aborting deployment."
    exit 1
fi

print_info "Build successful!"

# Deploy to Cloudflare Pages
print_info "Deploying to Cloudflare Pages..."
wrangler pages deploy .vercel/output/static --project-name=tech-support-client-portal --branch=main

if [ $? -ne 0 ]; then
    print_error "Deployment failed."
    exit 1
fi

print_info "Deployment successful!"

# Post-deployment checks
echo ""
print_info "Running post-deployment checks..."

# Wait a moment for deployment to propagate
sleep 5

# Check if site is accessible (requires APP_URL to be set)
if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
    print_info "Checking site accessibility..."
    if curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_APP_URL" | grep -q "200\|301\|302"; then
        print_info "Site is accessible!"
    else
        print_warning "Site may not be accessible yet. Please check manually."
    fi
fi

# Display deployment summary
echo ""
print_info "========================================="
print_info "Deployment Summary"
print_info "========================================="
print_info "Project: tech-support-client-portal"
print_info "Branch: main"
print_info "Status: Deployed"
print_info "========================================="
echo ""

print_info "Next steps:"
echo "  1. Verify the deployment in Cloudflare dashboard"
echo "  2. Test critical user flows (login, tickets, payments)"
echo "  3. Check webhook delivery in external services"
echo "  4. Monitor logs for any errors"
echo ""

print_info "Deployment complete! 🚀"

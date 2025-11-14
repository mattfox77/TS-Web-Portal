#!/bin/bash

# System Health Check Script
# This script checks the health of the production system

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

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

# Get base URL
if [ -z "$1" ]; then
    read -p "Enter your application URL (e.g., https://portal.yourdomain.com): " BASE_URL
else
    BASE_URL=$1
fi

# Remove trailing slash
BASE_URL=${BASE_URL%/}

echo ""
print_info "========================================="
print_info "System Health Check"
print_info "========================================="
print_info "Target: $BASE_URL"
print_info "Time: $(date)"
echo ""

# Check counter
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_check "Checking $name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" "$url")
    status_code=$(echo $response | cut -d: -f1)
    response_time=$(echo $response | cut -d: -f2)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} Status: $status_code (${response_time}s)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} Status: $status_code (expected $expected_status)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to check JSON response
check_json_endpoint() {
    local name=$1
    local url=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    print_check "Checking $name..."
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Status: $status_code"
        echo "  Response: $body"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} Status: $status_code"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Application Health
echo ""
print_info "Application Health"
check_json_endpoint "Health endpoint" "$BASE_URL/api/health"

# Public Pages
echo ""
print_info "Public Pages"
check_endpoint "Homepage" "$BASE_URL"
check_endpoint "Services page" "$BASE_URL/services"
check_endpoint "About page" "$BASE_URL/about"
check_endpoint "Contact page" "$BASE_URL/contact"

# Authentication Pages
echo ""
print_info "Authentication"
check_endpoint "Sign in page" "$BASE_URL/sign-in"
check_endpoint "Sign up page" "$BASE_URL/sign-up"

# API Endpoints (should require auth)
echo ""
print_info "Protected API Endpoints"
check_endpoint "User API (should be 401)" "$BASE_URL/api/auth/user" "401"
check_endpoint "Tickets API (should be 401)" "$BASE_URL/api/tickets" "401"
check_endpoint "Projects API (should be 401)" "$BASE_URL/api/projects" "401"

# Public API Endpoints
echo ""
print_info "Public API Endpoints"
check_endpoint "Service packages API" "$BASE_URL/api/service-packages"

# Webhook Endpoints (should accept POST)
echo ""
print_info "Webhook Endpoints"
check_endpoint "Clerk webhook" "$BASE_URL/api/webhooks/clerk" "405"
check_endpoint "PayPal webhook" "$BASE_URL/api/webhooks/paypal" "405"
check_endpoint "GitHub webhook" "$BASE_URL/api/webhooks/github" "405"

# Database Check (via wrangler if available)
echo ""
print_info "Database Status"
if command -v wrangler &> /dev/null; then
    if wrangler whoami &> /dev/null; then
        print_check "Checking database..."
        if wrangler d1 execute tech-support-db-production --remote --command "SELECT COUNT(*) FROM clients" &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} Database accessible"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "  ${RED}✗${NC} Database not accessible"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    else
        print_warning "Not logged in to Cloudflare (skipping database check)"
    fi
else
    print_warning "Wrangler not installed (skipping database check)"
fi

# R2 Storage Check (via wrangler if available)
echo ""
print_info "Storage Status"
if command -v wrangler &> /dev/null; then
    if wrangler whoami &> /dev/null; then
        print_check "Checking R2 storage..."
        if wrangler r2 bucket list | grep -q "tech-support-documents-production"; then
            echo -e "  ${GREEN}✓${NC} R2 bucket accessible"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "  ${RED}✗${NC} R2 bucket not found"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
fi

# SSL Certificate Check
echo ""
print_info "SSL Certificate"
print_check "Checking SSL certificate..."
if echo | openssl s_client -servername $(echo $BASE_URL | sed 's|https://||') -connect $(echo $BASE_URL | sed 's|https://||'):443 2>/dev/null | openssl x509 -noout -dates &> /dev/null; then
    expiry=$(echo | openssl s_client -servername $(echo $BASE_URL | sed 's|https://||') -connect $(echo $BASE_URL | sed 's|https://||'):443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    echo -e "  ${GREEN}✓${NC} SSL certificate valid"
    echo "  Expires: $expiry"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} SSL certificate check failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# DNS Check
echo ""
print_info "DNS Resolution"
print_check "Checking DNS..."
domain=$(echo $BASE_URL | sed 's|https://||' | sed 's|http://||')
if nslookup $domain &> /dev/null; then
    ip=$(nslookup $domain | grep "Address:" | tail -n1 | awk '{print $2}')
    echo -e "  ${GREEN}✓${NC} DNS resolves to: $ip"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "  ${RED}✗${NC} DNS resolution failed"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Summary
echo ""
print_info "========================================="
print_info "Health Check Summary"
print_info "========================================="
echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    print_info "✓ All health checks passed!"
    echo ""
    exit 0
else
    print_warning "Some health checks failed."
    echo ""
    print_info "Troubleshooting:"
    echo "  1. Check application logs: wrangler pages deployment tail"
    echo "  2. Verify environment variables are set"
    echo "  3. Check Cloudflare Analytics for errors"
    echo "  4. Review recent deployments"
    echo ""
    exit 1
fi

#!/bin/bash

# Webhook Testing Script
# This script tests webhook endpoints to ensure they're working correctly

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

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
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
print_info "Webhook Testing"
print_info "========================================="
print_info "Base URL: $BASE_URL"
echo ""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "Testing $name..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")
    
    if [ "$response" = "200" ] || [ "$response" = "405" ]; then
        echo -e "  ${GREEN}✓${NC} Endpoint accessible (HTTP $response)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} Endpoint not accessible (HTTP $response)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test Clerk webhook endpoint
echo ""
print_info "Testing Clerk Webhook..."
test_endpoint "Clerk webhook" "$BASE_URL/api/webhooks/clerk" "POST"

# Test PayPal webhook endpoint
echo ""
print_info "Testing PayPal Webhook..."
test_endpoint "PayPal webhook" "$BASE_URL/api/webhooks/paypal" "POST"

# Test GitHub webhook endpoint
echo ""
print_info "Testing GitHub Webhook..."
test_endpoint "GitHub webhook" "$BASE_URL/api/webhooks/github" "POST"

# Test health endpoint (if exists)
echo ""
print_info "Testing Application Health..."
test_endpoint "Health check" "$BASE_URL/api/health" "GET" || true

# Summary
echo ""
print_info "========================================="
print_info "Test Summary"
print_info "========================================="
echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_info "✓ All webhook endpoints are accessible!"
    echo ""
    print_info "Next steps:"
    echo "  1. Configure webhooks in external services"
    echo "  2. Test with real webhook events"
    echo "  3. Monitor webhook delivery in service dashboards"
    echo ""
    exit 0
else
    print_warning "Some webhook endpoints are not accessible."
    echo ""
    print_info "Troubleshooting:"
    echo "  1. Verify application is deployed"
    echo "  2. Check API routes exist in app/api/webhooks/"
    echo "  3. Review application logs for errors"
    echo "  4. Ensure environment variables are set"
    echo ""
    exit 1
fi

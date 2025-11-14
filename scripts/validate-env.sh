#!/bin/bash

# Environment Variables Validation Script
# This script checks if all required environment variables are set

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
MISSING=0
PRESENT=0

# Function to check if variable is set
check_var() {
    local var_name=$1
    local var_value="${!var_name}"
    local is_secret=$2
    
    TOTAL=$((TOTAL + 1))
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} $var_name - ${RED}MISSING${NC}"
        MISSING=$((MISSING + 1))
        return 1
    else
        if [ "$is_secret" = "true" ]; then
            echo -e "${GREEN}✓${NC} $var_name - ${GREEN}SET${NC} (value hidden)"
        else
            echo -e "${GREEN}✓${NC} $var_name - ${GREEN}SET${NC} ($var_value)"
        fi
        PRESENT=$((PRESENT + 1))
        return 0
    fi
}

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Environment Variables Validation${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Clerk Authentication
echo -e "${YELLOW}Clerk Authentication:${NC}"
check_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" false
check_var "CLERK_SECRET_KEY" true
check_var "CLERK_WEBHOOK_SECRET" true
check_var "NEXT_PUBLIC_CLERK_SIGN_IN_URL" false
check_var "NEXT_PUBLIC_CLERK_SIGN_UP_URL" false
check_var "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL" false
check_var "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL" false
echo ""

# PayPal Integration
echo -e "${YELLOW}PayPal Integration:${NC}"
check_var "PAYPAL_CLIENT_ID" false
check_var "PAYPAL_CLIENT_SECRET" true
check_var "PAYPAL_MODE" false
check_var "PAYPAL_WEBHOOK_ID" false
echo ""

# GitHub Integration
echo -e "${YELLOW}GitHub Integration:${NC}"
check_var "GITHUB_TOKEN" true
echo ""

# SendGrid Email
echo -e "${YELLOW}SendGrid Email Service:${NC}"
check_var "SENDGRID_API_KEY" true
check_var "SENDGRID_FROM_EMAIL" false
echo ""

# Application Configuration
echo -e "${YELLOW}Application Configuration:${NC}"
check_var "NEXT_PUBLIC_APP_URL" false
echo ""

# Summary
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Total variables checked: ${BLUE}$TOTAL${NC}"
echo -e "Variables set: ${GREEN}$PRESENT${NC}"
echo -e "Variables missing: ${RED}$MISSING${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ All required environment variables are set!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $MISSING environment variable(s) missing!${NC}"
    echo ""
    echo "Please set the missing variables before deploying."
    echo "See ENVIRONMENT_SETUP.md for detailed instructions."
    echo ""
    exit 1
fi

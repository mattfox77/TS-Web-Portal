#!/bin/bash

# Initialize Cloudflare D1 Database
# This script creates the database and runs the schema

echo "🚀 Initializing Tech Support Client Portal Database..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler is not installed"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Create local database
echo "📦 Creating local D1 database..."
wrangler d1 execute tech-support-db --local --file=./schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Local database initialized successfully"
else
    echo "❌ Failed to initialize local database"
    exit 1
fi

# Ask if user wants to initialize remote database
read -p "Do you want to initialize the remote (production) database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creating remote D1 database..."
    wrangler d1 execute tech-support-db --remote --file=./schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Remote database initialized successfully"
    else
        echo "❌ Failed to initialize remote database"
        exit 1
    fi
fi

echo "🎉 Database initialization complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Or run 'npm run preview' to test with Cloudflare Workers locally"

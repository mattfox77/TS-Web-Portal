#!/bin/bash

# Script to automatically update all API routes from Cloudflare D1 to Vercel Postgres

echo "🔧 Fixing all API routes..."

# Find all TypeScript files in app/api that import getRequestContext
files=$(grep -rl "getRequestContext" app/api --include="*.ts" --exclude-dir="__tests__")

count=0
for file in $files; do
  echo "📝 Updating: $file"
  
  # Replace the import
  sed -i '' 's/import { getRequestContext } from .@cloudflare\/next-on-pages.;/import { sql } from "@vercel\/postgres";/g' "$file"
  
  # Replace getRequestContext usage patterns
  sed -i '' 's/const { env } = getRequestContext();/\/\/ Database queries updated to use Vercel Postgres/g' "$file"
  sed -i '' 's/const db = env.DB;//g' "$file"
  
  count=$((count + 1))
done

echo "✅ Updated $count files"
echo "⚠️  Note: You'll need to manually update the SQL queries in each file"
echo "   Pattern: env.DB.prepare('SELECT...').bind(value).first()"
echo "   Replace: sql\`SELECT... WHERE col = \${value}\`"

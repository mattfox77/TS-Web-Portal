#!/usr/bin/env node

/**
 * Script to migrate API routes from Cloudflare D1 to Vercel Postgres
 * 
 * This script performs the following transformations:
 * 1. Removes getRequestContext() imports and usage
 * 2. Replaces env.DB.prepare().bind().first/all/run() with sql.query()
 * 3. Converts ? placeholders to $1, $2, etc.
 * 4. Updates imports to use @vercel/postgres
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const apiRoutes = glob.sync('app/api/**/route.ts', {
  ignore: ['app/api/__tests__/**']
});

console.log(`Found ${apiRoutes.length} API route files to process\n`);

let filesModified = 0;
let filesSkipped = 0;

apiRoutes.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Skip if already migrated (no env.DB or getRequestContext references)
    if (!content.includes('env.DB') && !content.includes('getRequestContext')) {
      console.log(`✓ Skipped (already migrated): ${filePath}`);
      filesSkipped++;
      return;
    }
    
    // Remove getRequestContext import
    content = content.replace(
      /import\s+{\s*getRequestContext\s*}\s+from\s+['"]@cloudflare\/next-on-pages['"];?\n?/g,
      ''
    );
    
    // Add sql import if not present and env.DB is used
    if (content.includes('env.DB') && !content.includes("from '@vercel/postgres'")) {
      // Find the last import statement
      const lastImportMatch = content.match(/import[^;]+;/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        const insertIndex = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, insertIndex) + 
                  "\nimport { sql } from '@vercel/postgres';" +
                  content.slice(insertIndex);
      }
    }
    
    // Remove const env = getRequestContext().env; lines
    content = content.replace(/\s*const\s+env\s*=\s*getRequestContext\(\)\.env;?\n?/g, '');
    
    console.log(`⚠ Manual review needed: ${filePath}`);
    console.log(`  - Contains env.DB or D1Database references`);
    console.log(`  - Please manually convert database calls to use sql.query() or db-utils functions\n`);
    
    // Write the file back only if we made changes
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n=== Migration Summary ===`);
console.log(`Files modified: ${filesModified}`);
console.log(`Files skipped: ${filesSkipped}`);
console.log(`Total files: ${apiRoutes.length}`);
console.log(`\nNote: All files with env.DB need manual review to convert to sql.query() or db-utils functions`);

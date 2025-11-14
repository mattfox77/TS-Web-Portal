#!/usr/bin/env node

/**
 * Automated script to migrate all API routes from Cloudflare D1 to Vercel Postgres
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting API routes migration...\n');

// Find all TypeScript files in app/api that use getRequestContext
const files = execSync(
  'find app/api -name "*.ts" -type f ! -path "*/__tests__/*" -exec grep -l "getRequestContext" {} \\;',
  { encoding: 'utf-8' }
)
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} files to migrate:\n`);

let successCount = 0;
let errorCount = 0;

files.forEach((file, index) => {
  console.log(`[${index + 1}/${files.length}] Processing: ${file}`);
  
  try {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // Replace import statement
    if (content.includes('getRequestContext')) {
      content = content.replace(
        /import\s+{\s*getRequestContext\s*}\s+from\s+['"]@cloudflare\/next-on-pages['"];?/g,
        ''
      );
      
      // Add sql import if not present
      if (!content.includes('from "@vercel/postgres"')) {
        // Find the last import statement
        const importMatch = content.match(/^import\s+.*?;$/gm);
        if (importMatch) {
          const lastImport = importMatch[importMatch.length - 1];
          content = content.replace(
            lastImport,
            lastImport + '\nimport { sql } from "@vercel/postgres";'
          );
        }
      }
      
      modified = true;
    }

    // Replace getRequestContext usage
    content = content.replace(
      /const\s+{\s*env\s*}\s*=\s*getRequestContext\(\);?\s*/g,
      '// Migrated to Vercel Postgres\n    '
    );
    
    content = content.replace(
      /const\s+db\s*=\s*env\.DB;?\s*/g,
      ''
    );

    // Replace getUserClientId calls with old signature
    content = content.replace(
      /getUserClientId\((?:env\.DB|db),\s*(\w+)\)/g,
      'getUserClientId($1)'
    );

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`  ✅ Updated\n`);
      successCount++;
    } else {
      console.log(`  ⏭️  No changes needed\n`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
    errorCount++;
  }
});

console.log('\n📊 Migration Summary:');
console.log(`   ✅ Successfully updated: ${successCount}`);
console.log(`   ❌ Errors: ${errorCount}`);
console.log(`   ⏭️  Skipped: ${files.length - successCount - errorCount}`);

console.log('\n⚠️  IMPORTANT: Manual SQL query updates still needed!');
console.log('   Each file needs its SQL queries converted from:');
console.log('   env.DB.prepare("SELECT...").bind(value).first()');
console.log('   to:');
console.log('   sql`SELECT... WHERE col = ${value}`');
console.log('\n   Run the deployment and check for errors to identify which queries need updating.');

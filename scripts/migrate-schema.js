#!/usr/bin/env node

/**
 * Database Schema Migration Script
 * Migrates the schema from Cloudflare D1 to Vercel Postgres
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function migrateSchema() {
  console.log('🚀 Starting database schema migration...\n');

  try {
    // Read the Postgres schema file
    const schemaPath = path.join(__dirname, '..', 'schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Schema file loaded');
    console.log('📊 Creating tables and indexes...\n');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await sql.query(statement + ';');
        successCount++;
        
        // Extract table/index name for logging
        const match = statement.match(/CREATE (?:TABLE|INDEX)[^(]*?(?:IF NOT EXISTS)?\s+(\w+)/i);
        if (match) {
          console.log(`✅ Created: ${match[1]}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement:`, error.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Schema migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Verify tables in Vercel dashboard');
      console.log('   2. Update API routes to use Postgres');
      console.log('   3. Test the application');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the errors above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

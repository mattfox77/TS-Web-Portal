#!/usr/bin/env node

const { readFileSync } = require('fs');
const { Client } = require('pg');

async function runSchema() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    console.log('Reading schema file...');
    const schema = readFileSync('schema-postgres.sql', 'utf8');
    
    console.log('Executing schema...');
    await client.query(schema);
    
    console.log('✅ Schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSchema();

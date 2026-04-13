const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function auditSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Auditing database schema...\n');

    // Check all tables
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'TESdb']
    );

    console.log('📊 Current Tables:');
    const tableNames = tables.map(t => t.TABLE_NAME);
    tableNames.forEach(t => console.log(`  ✓ ${t}`));

    const expectedTables = {
      'customers': ['id', 'phone', 'phone_verified', 'phone_verification_token', 'phone_verification_expires'],
      'inquiries': ['customer_id'],
      'calendar_events': ['inquiry_id'],
      'appointment_feedback': ['id', 'appointment_id', 'inquiry_id', 'customer_id', 'agent_id', 'rating', 'comment'],
      'phone_verification_attempts': ['id', 'customer_id', 'phone', 'attempt_count'],
      'phone_verification_log': ['id', 'customer_id', 'phone', 'otp_sent', 'status']
    };

    console.log('\n🔎 Checking expected tables and columns:\n');

    const missingItems = {};

    for (const [tableName, expectedCols] of Object.entries(expectedTables)) {
      if (!tableNames.includes(tableName)) {
        console.log(`  ✗ MISSING TABLE: ${tableName}`);
        missingItems[tableName] = { type: 'TABLE', columns: expectedCols };
      } else {
        console.log(`  ✓ Table exists: ${tableName}`);
        
        const [columns] = await pool.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [process.env.DB_NAME || 'TESdb', tableName]
        );

        const existingCols = columns.map(c => c.COLUMN_NAME);
        const missingCols = expectedCols.filter(col => !existingCols.includes(col));

        if (missingCols.length > 0) {
          console.log(`    ✗ Missing columns: ${missingCols.join(', ')}`);
          if (!missingItems[tableName]) {
            missingItems[tableName] = { type: 'COLUMNS', columns: missingCols };
          } else {
            missingItems[tableName].columns = missingCols;
          }
        } else {
          console.log(`    ✓ All expected columns present`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    if (Object.keys(missingItems).length > 0) {
      console.log('⚠️  MISSING ITEMS FOUND:');
      console.log(JSON.stringify(missingItems, null, 2));
    } else {
      console.log('✅ All expected tables and columns exist!');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

auditSchema();

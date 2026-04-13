const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function runMigration() {
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
    console.log('🔄 Running database migrations...\n');

    const migrationFile = path.join(__dirname, '..', 'sql', 'add_appointment_feedback.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split by semicolons and filter empty statements
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 80)}...`);
      
      try {
        await pool.query(statement);
        console.log('   ✅ Success\n');
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
          console.log('   ℹ️  Table already exists (skipping)\n');
        } else {
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully!\n');

    // Re-run the audit
    console.log('🔍 Verifying schema...\n');

    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'TESdb']
    );

    const tableNames = tables.map(t => t.TABLE_NAME);
    if (tableNames.includes('appointment_feedback')) {
      console.log('✅ appointment_feedback table created successfully!');
      
      // Show table structure
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
        [process.env.DB_NAME || 'TESdb', 'appointment_feedback']
      );

      console.log('\n📋 appointment_feedback table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ''}`);
      });
    } else {
      console.log('❌ appointment_feedback table was not created');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

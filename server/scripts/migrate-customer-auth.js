const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigration() {
  try {
    console.log('🚀 Starting customer authentication migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'sql', 'customer_auth_migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but keep multi-line statements together
    // Remove comments first
    const cleanedSQL = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolons (handles multi-line statements)
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}: ${preview}...`);
      
      try {
        await pool.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Check if error is "table already exists" - this is okay
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Table already exists (skipping)\n`);
        } else if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Column/key already exists (skipping)\n`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`);
          console.error(error.message);
          console.error('Full statement:', statement.substring(0, 200) + '...\n');
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log('  - customers table created/verified');
    console.log('  - inquiries table updated with customer_id column');
    console.log('  - customer_appointments view created\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();

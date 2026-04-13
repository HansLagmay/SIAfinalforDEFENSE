const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runPhoneVerificationMigration() {
  try {
    console.log('🚀 Starting phone verification migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'sql', 'add_phone_verification.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments first (lines starting with --)
    const linesWithoutComments = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolons and clean up
    const statements = linesWithoutComments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Filter out empty statements
        if (stmt.length === 0) return false;
        // Keep USE statements but execute them separately
        if (stmt.toUpperCase().startsWith('USE')) {
          console.log(`📌 Selecting database: ${stmt}\n`);
          return false;
        }
        return true;
      });

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}: ${preview}...`);
      
      try {
        await pool.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Check if error is "table/column already exists" - this is okay
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Already exists (skipping)\n`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`);
          console.error(error.message);
          console.log(`⚠️  Continuing with remaining statements...\n`);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Phone verification migration completed successfully!\n');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runPhoneVerificationMigration();

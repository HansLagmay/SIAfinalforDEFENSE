const pool = require('../db');

async function checkSchema() {
  try {
    console.log('🔍 Checking customers table schema...\n');
    
    const [rows] = await pool.execute('DESCRIBE customers');
    
    console.log('Customers table columns:');
    rows.forEach(r => console.log(`  - ${r.Field} (${r.Type}) ${r.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));
    
    // Check for phone verification columns
    const hasVerificationToken = rows.some(r => r.Field === 'phone_verification_token');
    const hasVerificationExpires = rows.some(r => r.Field === 'phone_verification_expires');
    
    console.log('\n📋 Phone Verification Columns:');
    console.log(`  - phone_verification_token: ${hasVerificationToken ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - phone_verification_expires: ${hasVerificationExpires ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check if phone_verification_attempts table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'phone_verification_attempts'");
    console.log(`  - phone_verification_attempts table: ${tables.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check if phone_verification_log table exists
    const [logTables] = await pool.execute("SHOW TABLES LIKE 'phone_verification_log'");
    console.log(`  - phone_verification_log table: ${logTables.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    
    await pool.end();
    
    if (!hasVerificationToken || !hasVerificationExpires) {
      console.log('\n⚠️  Missing columns detected! Run the fix script to add them.');
      process.exit(1);
    } else {
      console.log('\n✅ All phone verification columns exist!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();

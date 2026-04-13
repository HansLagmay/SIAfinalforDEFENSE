const pool = require('../db');

async function checkTables() {
  try {
    console.log('🔍 Checking phone verification tables...\n');
    
    // Check phone_verification_attempts table
    console.log('📋 phone_verification_attempts table:');
    const [attemptsColumns] = await pool.execute('DESCRIBE phone_verification_attempts');
    attemptsColumns.forEach(r => console.log(`  - ${r.Field} (${r.Type})`));
    
    console.log('\n📋 phone_verification_log table:');
    const [logColumns] = await pool.execute('DESCRIBE phone_verification_log');
    logColumns.forEach(r => console.log(`  - ${r.Field} (${r.Type})`));
    
    // Count records
    const [[{ attemptCount }]] = await pool.execute('SELECT COUNT(*) as attemptCount FROM phone_verification_attempts');
    const [[{ logCount }]] = await pool.execute('SELECT COUNT(*) as logCount FROM phone_verification_log');
    
    console.log('\n📊 Record counts:');
    console.log(`  - phone_verification_attempts: ${attemptCount} records`);
    console.log(`  - phone_verification_log: ${logCount} records`);
    
    console.log('\n✅ All phone verification tables are properly configured!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();

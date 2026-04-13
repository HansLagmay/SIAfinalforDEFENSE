const pool = require('../db');

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing phone verification columns to customers table...\n');
    
    // Check if columns already exist
    const [existingColumns] = await pool.execute('DESCRIBE customers');
    const hasToken = existingColumns.some(r => r.Field === 'phone_verification_token');
    const hasExpires = existingColumns.some(r => r.Field === 'phone_verification_expires');
    
    if (hasToken && hasExpires) {
      console.log('✅ Both columns already exist. Nothing to do!');
      await pool.end();
      return;
    }
    
    // Add phone_verification_token column
    if (!hasToken) {
      console.log('⏳ Adding phone_verification_token column...');
      await pool.execute(
        'ALTER TABLE customers ADD COLUMN phone_verification_token VARCHAR(255) DEFAULT NULL'
      );
      console.log('✅ phone_verification_token column added\n');
    } else {
      console.log('✅ phone_verification_token already exists\n');
    }
    
    // Add phone_verification_expires column
    if (!hasExpires) {
      console.log('⏳ Adding phone_verification_expires column...');
      await pool.execute(
        'ALTER TABLE customers ADD COLUMN phone_verification_expires DATETIME DEFAULT NULL'
      );
      console.log('✅ phone_verification_expires column added\n');
    } else {
      console.log('✅ phone_verification_expires already exists\n');
    }
    
    console.log('🎉 Phone verification columns setup complete!\n');
    
    // Verify
    const [updatedColumns] = await pool.execute('DESCRIBE customers');
    const verifyToken = updatedColumns.some(r => r.Field === 'phone_verification_token');
    const verifyExpires = updatedColumns.some(r => r.Field === 'phone_verification_expires');
    
    console.log('📋 Verification:');
    console.log(`  - phone_verification_token: ${verifyToken ? '✅' : '❌'}`);
    console.log(`  - phone_verification_expires: ${verifyExpires ? '✅' : '❌'}`);
    
    await pool.end();
    
    if (verifyToken && verifyExpires) {
      console.log('\n✅ All columns successfully added!');
      process.exit(0);
    } else {
      console.log('\n❌ Column verification failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addMissingColumns();

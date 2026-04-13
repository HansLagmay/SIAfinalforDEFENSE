/**
 * Clear Demo Data Script
 * Removes all inquiries and calendar events from the database
 * Run: node scripts/clearDemoData.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearDemoData() {
  let connection;

  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'TESdb',
    });

    console.log('✅ Connected to database');

    // Get counts before deletion
    const [[{ inquiryCount }]] = await connection.execute(
      'SELECT COUNT(*) as inquiryCount FROM inquiries'
    );
    const [[{ eventCount }]] = await connection.execute(
      'SELECT COUNT(*) as eventCount FROM calendar_events'
    );

    console.log(`\n📊 Current data:`);
    console.log(`   - Inquiries: ${inquiryCount}`);
    console.log(`   - Calendar Events: ${eventCount}`);

    if (inquiryCount === 0 && eventCount === 0) {
      console.log('\n✨ No data to clear!');
      return;
    }

    console.log('\n🗑️  Clearing data...');

    // Clear calendar events first (may have foreign keys to inquiries)
    await connection.execute('DELETE FROM calendar_events');
    console.log('   ✓ Cleared calendar events');

    // Clear inquiries
    await connection.execute('DELETE FROM inquiries');
    console.log('   ✓ Cleared inquiries');

    // Clear related activity logs
    await connection.execute(
      "DELETE FROM activity_log WHERE action IN ('CREATE_INQUIRY', 'CREATE_EVENT', 'ASSIGN_INQUIRY', 'CLAIM_INQUIRY', 'UPDATE_INQUIRY', 'UPDATE_EVENT', 'DELETE_EVENT')"
    );
    console.log('   ✓ Cleared related activity logs');

    // Verify deletion
    const [[{ remainingInquiries }]] = await connection.execute(
      'SELECT COUNT(*) as remainingInquiries FROM inquiries'
    );
    const [[{ remainingEvents }]] = await connection.execute(
      'SELECT COUNT(*) as remainingEvents FROM calendar_events'
    );

    console.log('\n✅ Demo data cleared successfully!');
    console.log(`   - Remaining Inquiries: ${remainingInquiries}`);
    console.log(`   - Remaining Events: ${remainingEvents}`);

  } catch (error) {
    console.error('❌ Error clearing demo data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
clearDemoData();

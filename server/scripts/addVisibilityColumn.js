const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const addVisibilityColumn = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'TESdb'
    });

    console.log('Connected to database');
    console.log('\n=== Adding visible_to_customers column ===\n');

    // Add visible_to_customers column to properties table
    try {
      await connection.execute(`
        ALTER TABLE properties 
        ADD COLUMN visible_to_customers BOOLEAN DEFAULT true COMMENT 'Controls visibility in customer portal'
      `);
      console.log('✓ Added visible_to_customers column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠ visible_to_customers column already exists');
      } else {
        throw error;
      }
    }

    // Auto-hide properties that are under-contract, sold, withdrawn, or off-market
    const [result] = await connection.execute(`
      UPDATE properties 
      SET visible_to_customers = false 
      WHERE status IN ('under-contract', 'sold', 'withdrawn', 'off-market') 
      AND visible_to_customers = true
    `);
    console.log(`✓ Auto-hidden ${result.affectedRows} properties with restrictive statuses`);

    // Add index for better query performance
    try {
      await connection.execute(`
        CREATE INDEX idx_visible_to_customers ON properties(visible_to_customers)
      `);
      console.log('✓ Added index on visible_to_customers');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('⚠ Index idx_visible_to_customers already exists');
      } else {
        throw error;
      }
    }

    console.log('\n=== Migration completed successfully ===\n');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

addVisibilityColumn();

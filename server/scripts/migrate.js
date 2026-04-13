// Migration script: Add missing columns for property tracking and calendar integration
const pool = require('../db');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  console.log('Starting database migration...\n');

  try {
    // Add missing columns to properties table
    console.log('Adding columns to properties table...');
    
    const propertiesMigrations = [
      { sql: 'ALTER TABLE properties ADD COLUMN status_history JSON DEFAULT NULL', desc: 'status_history' },
      { sql: 'ALTER TABLE properties ADD COLUMN view_count INT NOT NULL DEFAULT 0', desc: 'view_count' },
      { sql: 'ALTER TABLE properties ADD COLUMN view_history JSON DEFAULT NULL', desc: 'view_history' },
      { sql: 'ALTER TABLE properties ADD COLUMN last_viewed_at DATETIME DEFAULT NULL', desc: 'last_viewed_at' },
      { sql: 'ALTER TABLE properties ADD COLUMN sold_by VARCHAR(255) DEFAULT NULL', desc: 'sold_by' },
      { sql: 'ALTER TABLE properties ADD COLUMN sold_by_agent_id VARCHAR(36) DEFAULT NULL', desc: 'sold_by_agent_id' },
      { sql: 'ALTER TABLE properties ADD COLUMN sold_at DATETIME DEFAULT NULL', desc: 'sold_at' },
      { sql: 'ALTER TABLE properties ADD COLUMN sale_price DECIMAL(15,2) DEFAULT NULL', desc: 'sale_price' },
      { sql: 'ALTER TABLE properties ADD COLUMN commission JSON DEFAULT NULL', desc: 'commission' },
      { sql: 'ALTER TABLE properties ADD COLUMN reserved_by VARCHAR(255) DEFAULT NULL', desc: 'reserved_by' },
      { sql: 'ALTER TABLE properties ADD COLUMN reserved_at DATETIME DEFAULT NULL', desc: 'reserved_at' },
      { sql: 'ALTER TABLE properties ADD COLUMN reserved_until DATETIME DEFAULT NULL', desc: 'reserved_until' }
    ];

    for (const { sql, desc } of propertiesMigrations) {
      try {
        await pool.execute(sql);
        console.log('✓ Added column:', desc);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('- Column already exists:', desc);
        } else {
          console.error('✗ Error adding', desc + ':', err.message);
        }
      }
    }

    // Add missing columns to calendar_events table
    console.log('\nAdding columns to calendar_events table...');
    
    const calendarMigrations = [
      { sql: 'ALTER TABLE calendar_events ADD COLUMN inquiry_id VARCHAR(36) DEFAULT NULL', desc: 'inquiry_id' },
      { sql: 'ALTER TABLE calendar_events ADD COLUMN property_id VARCHAR(36) DEFAULT NULL', desc: 'property_id' }
    ];

    for (const { sql, desc } of calendarMigrations) {

          // Add property agent ownership columns
          console.log('\nAdding property agent ownership columns...');
    
          const ownershipMigrations = [
            { sql: 'ALTER TABLE properties ADD COLUMN primary_agent_id VARCHAR(36) DEFAULT NULL', desc: 'primary_agent_id' },
            { sql: 'ALTER TABLE properties ADD COLUMN assigned_to_agent_at DATETIME DEFAULT NULL', desc: 'assigned_to_agent_at' },
            { sql: 'ALTER TABLE properties ADD COLUMN assigned_by_admin_id VARCHAR(36) DEFAULT NULL', desc: 'assigned_by_admin_id' },
            { sql: 'ALTER TABLE properties ADD COLUMN assignment_reason VARCHAR(255) DEFAULT NULL', desc: 'assignment_reason' }
          ];

          for (const { sql, desc } of ownershipMigrations) {
            try {
              await pool.execute(sql);
              console.log('✓ Added column:', desc);
            } catch (err) {
              if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('- Column already exists:', desc);
              } else {
                console.error('✗ Error adding', desc + ':', err.message);
              }
            }
          }

          // Backfill primary_agent_id from created_by_user_id if not already set
          try {
            const [result] = await pool.execute(`
              UPDATE properties 
              SET primary_agent_id = created_by_user_id
              WHERE primary_agent_id IS NULL AND created_by_user_id IS NOT NULL
            `);
            if (result.affectedRows > 0) {
              console.log(`✓ Backfilled primary_agent_id for ${result.affectedRows} properties`);
            }
          } catch (err) {
            console.log('- Could not backfill primary_agent_id:', err.message);
          }
      try {
        await pool.execute(sql);
        console.log('✓ Added column:', desc);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('- Column already exists:', desc);
        } else {
          console.error('✗ Error adding', desc + ':', err.message);
        }
      }
    }

    // Create indexes
    console.log('\nCreating indexes...');
    
    const indexes = [
      { sql: 'CREATE INDEX idx_calendar_inquiry ON calendar_events(inquiry_id)', name: 'idx_calendar_inquiry' },
      { sql: 'CREATE INDEX idx_calendar_property ON calendar_events(property_id)', name: 'idx_calendar_property' },
      { sql: 'CREATE INDEX idx_properties_status ON properties(status)', name: 'idx_properties_status' },
      { sql: 'CREATE INDEX idx_properties_created_by ON properties(created_by)', name: 'idx_properties_created_by' },
      { sql: 'CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to)', name: 'idx_inquiries_assigned_to' },
      { sql: 'CREATE INDEX idx_inquiries_status ON inquiries(status)', name: 'idx_inquiries_status' },
      { sql: 'CREATE INDEX idx_properties_primary_agent ON properties(primary_agent_id)', name: 'idx_properties_primary_agent' },
    ];

    for (const { sql, name } of indexes) {
      try {
        await pool.execute(sql);
        console.log('✓ Created index:', name);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log('- Index already exists:', name);
        } else {
          console.error('✗ Error creating', name + ':', err.message);
        }
      }
    }

    // Initialize status_history for existing properties
    console.log('\nInitializing status_history for existing properties...');
    try {
      const [result] = await pool.execute(`
        UPDATE properties 
        SET status_history = JSON_ARRAY(
          JSON_OBJECT(
            'status', status,
            'changedBy', 'System',
            'changedByName', 'System Migration',
            'changedAt', created_at,
            'reason', 'Initial status'
          )
        )
        WHERE status_history IS NULL OR JSON_LENGTH(status_history) = 0
      `);
      console.log(`✓ Initialized status_history for ${result.affectedRows} properties`);
    } catch (err) {
      console.log('- Could not initialize status_history (column may not exist yet):', err.message);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

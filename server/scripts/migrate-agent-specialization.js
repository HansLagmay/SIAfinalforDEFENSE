const pool = require('../db');

async function runAgentSpecializationMigration() {
  try {
    console.log('Starting agent specialization migration...\n');
    const [columnRows] = await pool.query(
      `SELECT 1
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'specialization'
       LIMIT 1`
    );

    if (columnRows.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN specialization VARCHAR(120) DEFAULT NULL AFTER role');
      console.log('Added users.specialization column');
    } else {
      console.log('users.specialization column already exists');
    }

    const [backfillResult] = await pool.query(
      `UPDATE users
       SET specialization = COALESCE(NULLIF(specialization, ''), 'General')
       WHERE role = 'agent' AND (specialization IS NULL OR specialization = '')`
    );

    console.log(`Backfilled ${backfillResult.affectedRows || 0} agent row(s)`);

    console.log('Agent specialization migration completed successfully.');
  } catch (error) {
    console.error('Agent specialization migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runAgentSpecializationMigration();

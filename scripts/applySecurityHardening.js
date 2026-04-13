require('dotenv').config();
const mysql = require('mysql2/promise');

async function applySecurityHardening() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Applying security hardening migration...');

    await connection.query('USE TESdb');

    const ensureColumn = async (table, column, definition) => {
      const [rows] = await connection.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
         LIMIT 1`,
        [table, column]
      );

      if (rows.length === 0) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Added column ${table}.${column}`);
      }
    };

    const ensureIndex = async (table, indexName, definition) => {
      const [rows] = await connection.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
         LIMIT 1`,
        [table, indexName]
      );

      if (rows.length === 0) {
        await connection.query(`CREATE INDEX ${indexName} ON ${table} ${definition}`);
        console.log(`Created index ${indexName}`);
      }
    };

    await ensureColumn('properties', 'created_by_user_id', 'VARCHAR(36) NULL AFTER created_by');
    await ensureColumn('properties', 'archived_at', 'DATETIME NULL');
    await ensureColumn('properties', 'archived_by', 'VARCHAR(36) NULL');
    await ensureColumn('properties', 'archive_reason', 'VARCHAR(255) NULL');

    await ensureColumn('inquiries', 'archived_at', 'DATETIME NULL');
    await ensureColumn('inquiries', 'archived_by', 'VARCHAR(36) NULL');
    await ensureColumn('inquiries', 'archive_reason', 'VARCHAR(255) NULL');

    await ensureColumn('users', 'archived_at', 'DATETIME NULL');
    await ensureColumn('users', 'archived_by', 'VARCHAR(36) NULL');
    await ensureColumn('users', 'archive_reason', 'VARCHAR(255) NULL');

    await ensureColumn('customers', 'is_blocked', 'TINYINT(1) NOT NULL DEFAULT 0');
    await ensureColumn('customers', 'blocked_at', 'DATETIME NULL');
    await ensureColumn('customers', 'blocked_by', 'VARCHAR(36) NULL');
    await ensureColumn('customers', 'blocked_reason', 'VARCHAR(255) NULL');
    await ensureColumn('customers', 'archived_at', 'DATETIME NULL');
    await ensureColumn('customers', 'archived_by', 'VARCHAR(36) NULL');
    await ensureColumn('customers', 'archive_reason', 'VARCHAR(255) NULL');

    await connection.query(
      `CREATE TABLE IF NOT EXISTS customer_flags (
        id VARCHAR(36) PRIMARY KEY,
        inquiry_id VARCHAR(36) NOT NULL,
        customer_id VARCHAR(36) NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NULL,
        reported_by_agent_id VARCHAR(36) NOT NULL,
        reported_by_agent_name VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        details TEXT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        reviewed_by VARCHAR(36) NULL,
        reviewed_at DATETIME NULL,
        review_notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer_flags_status (status, created_at),
        INDEX idx_customer_flags_customer (customer_id, created_at),
        INDEX idx_customer_flags_inquiry (inquiry_id),
        CONSTRAINT fk_customer_flags_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
        CONSTRAINT fk_customer_flags_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )`
    );

    await ensureIndex('properties', 'idx_properties_created_by_user_id', '(created_by_user_id)');
    await ensureIndex('properties', 'idx_properties_archived_at', '(archived_at)');
    await ensureIndex('inquiries', 'idx_inquiries_archived_at', '(archived_at)');
    await ensureIndex('users', 'idx_users_archived_at', '(archived_at)');
    await ensureIndex('customers', 'idx_customers_blocked', '(is_blocked, blocked_at)');

    // Backfill created_by_user_id from historical created_by name where possible.
    await connection.query(
      `UPDATE properties p
       JOIN users u ON u.name = p.created_by
       SET p.created_by_user_id = u.id
       WHERE p.created_by_user_id IS NULL
         AND p.created_by IS NOT NULL
         AND p.created_by <> ''`
    );

    console.log('SUCCESS: Security hardening migration applied.');
  } catch (error) {
    console.error('ERROR: Failed to apply security hardening migration:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applySecurityHardening();

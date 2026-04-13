require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function applyFeatureExpansion() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, '../server/sql/feature_expansion_2026_04.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying feature expansion migration...');
    await connection.query(sql);

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

    await ensureColumn('users', 'license_number', 'VARCHAR(120) DEFAULT NULL');
    await ensureColumn('users', 'license_type', 'VARCHAR(80) DEFAULT NULL');
    await ensureColumn('users', 'license_issued_date', 'DATE DEFAULT NULL');
    await ensureColumn('users', 'license_expiry_date', 'DATE DEFAULT NULL');
    await ensureColumn('users', 'license_verified', 'TINYINT(1) NOT NULL DEFAULT 0');
    await ensureColumn('users', 'broker_id', 'VARCHAR(120) DEFAULT NULL');
    await ensureColumn('users', 'license_status', "VARCHAR(32) NOT NULL DEFAULT 'pending'");

    await ensureColumn('properties', 'commission_rate', 'DECIMAL(5,2) DEFAULT NULL');
    await ensureColumn('properties', 'commission_paid_at', 'DATETIME DEFAULT NULL');
    await ensureColumn('properties', 'commission_paid_by', 'VARCHAR(36) DEFAULT NULL');
    await ensureColumn('properties', 'sold_by_agent_id', 'VARCHAR(36) DEFAULT NULL');
    await ensureColumn('properties', 'sale_price', 'DECIMAL(15,2) DEFAULT NULL');

    await ensureIndex('properties', 'idx_properties_sold_agent', '(sold_by_agent_id, sold_at)');
    await ensureIndex('properties', 'idx_properties_type_location', '(type, location)');
    await ensureIndex('properties', 'idx_properties_price', '(price)');
    await ensureIndex('properties', 'idx_properties_beds_baths', '(bedrooms, bathrooms)');
    await ensureIndex('properties', 'idx_properties_area', '(area)');

    console.log('SUCCESS: Feature expansion migration applied.');
  } catch (error) {
    console.error('ERROR: Failed to apply feature expansion migration:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyFeatureExpansion();

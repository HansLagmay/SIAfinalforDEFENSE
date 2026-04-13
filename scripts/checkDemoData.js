const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function checkDemoData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    const [[propertyCount]] = await connection.query('SELECT COUNT(*) AS cnt FROM properties');
    const [[documentCount]] = await connection.query('SELECT COUNT(*) AS cnt FROM property_documents');
    const [[agentCount]] = await connection.query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'agent'");
    const [[agentLicFiles]] = await connection.query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'agent' AND license_file_path IS NOT NULL AND license_file_path <> ''");
    const [latestProperties] = await connection.query('SELECT title, type, price, location FROM properties ORDER BY created_at DESC LIMIT 5');

    console.log('properties:', propertyCount.cnt);
    console.log('property_documents:', documentCount.cnt);
    console.log('agents:', agentCount.cnt);
    console.log('agents_with_license_files:', agentLicFiles.cnt);
    console.log('latest_properties:');
    latestProperties.forEach((p) => {
      console.log(`- ${p.title} | ${p.type} | ${p.location} | ${p.price}`);
    });
  } catch (error) {
    console.error('Demo data check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

checkDemoData();

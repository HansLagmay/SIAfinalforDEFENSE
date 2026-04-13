const pool = require('../db');

async function checkAgentLicenseStatus() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, license_expiry_date
       FROM users
       WHERE role = 'agent' AND license_expiry_date IS NOT NULL`
    );

    let expiredCount = 0;
    let warningCount = 0;

    for (const row of rows) {
      const expiry = new Date(row.license_expiry_date);
      const today = new Date();
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        await pool.execute(
          "UPDATE users SET license_status = 'expired', license_verified = 0 WHERE id = ?",
          [row.id]
        );
        expiredCount += 1;
      } else if (diffDays <= 30) {
        warningCount += 1;
      }
    }

    console.log(`License status check complete. Expired updated: ${expiredCount}, expiring soon: ${warningCount}`);
  } catch (error) {
    console.error('Failed to check license statuses:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkAgentLicenseStatus();

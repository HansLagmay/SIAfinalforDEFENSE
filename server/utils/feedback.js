const FEEDBACK_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS appointment_feedback (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    inquiry_id VARCHAR(36) DEFAULT NULL,
    customer_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) DEFAULT NULL,
    rating TINYINT NOT NULL,
    comment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_appointment_feedback_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE KEY uq_appointment_feedback_appointment_customer (appointment_id, customer_id),
    INDEX idx_appointment_feedback_agent (agent_id),
    INDEX idx_appointment_feedback_customer (customer_id)
  )
`;

let tableEnsured = false;

async function ensureFeedbackTable(pool) {
  if (tableEnsured) return;
  await pool.execute(FEEDBACK_TABLE_SQL);
  tableEnsured = true;
}

module.exports = {
  ensureFeedbackTable
};

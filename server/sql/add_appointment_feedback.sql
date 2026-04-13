-- Appointment Feedback Migration
-- Adds the appointment_feedback table for customer ratings and reviews

USE TESdb;

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
  INDEX idx_appointment_feedback_customer (customer_id),
  INDEX idx_appointment_feedback_inquiry (inquiry_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

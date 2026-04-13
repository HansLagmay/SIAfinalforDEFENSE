-- Security and moderation hardening migration (April 2026)
-- Safe to run multiple times

USE TESdb;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(36) NULL AFTER created_by,
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(255) NULL;

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(255) NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(255) NULL;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS blocked_reason VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS archived_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS customer_flags (
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
);

CREATE INDEX IF NOT EXISTS idx_properties_created_by_user_id ON properties(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_properties_archived_at ON properties(archived_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_archived_at ON inquiries(archived_at);
CREATE INDEX IF NOT EXISTS idx_users_archived_at ON users(archived_at);
CREATE INDEX IF NOT EXISTS idx_customers_blocked ON customers(is_blocked, blocked_at);

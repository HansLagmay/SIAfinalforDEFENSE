-- Phone Verification Migration
-- Adds phone verification fields and tracking tables

USE TESdb;

-- Add phone verification fields to customers table
ALTER TABLE customers 
ADD COLUMN phone_verification_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN phone_verification_expires DATETIME DEFAULT NULL;

-- Create phone verification attempts table (rate limiting)
CREATE TABLE IF NOT EXISTS phone_verification_attempts (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  attempt_count INT DEFAULT 1,
  last_attempt_at DATETIME NOT NULL,
  reset_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_phone (phone),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create phone verification log table (audit trail)
CREATE TABLE IF NOT EXISTS phone_verification_log (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  otp_sent VARCHAR(10) NOT NULL,
  sent_at DATETIME NOT NULL,
  verified_at DATETIME DEFAULT NULL,
  expires_at DATETIME NOT NULL,
  status ENUM('pending', 'verified', 'expired', 'failed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  INDEX idx_phone (phone),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing customers to have phone_verified as false by default
UPDATE customers SET phone_verified = false WHERE phone_verified IS NULL;

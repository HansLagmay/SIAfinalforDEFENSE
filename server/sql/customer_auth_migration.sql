-- Customer Authentication Tables Migration
-- Run this to add customer authentication support

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expires DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_verification_token (verification_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add customer_id to inquiries table (optional - links inquiry to customer account)
ALTER TABLE inquiries 
ADD COLUMN customer_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_customer_id (customer_id),
ADD CONSTRAINT fk_inquiries_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id) 
  ON DELETE SET NULL;

-- Create customer_appointments view for easier querying
CREATE OR REPLACE VIEW customer_appointments AS
SELECT 
  ce.id,
  ce.title,
  ce.description,
  ce.type,
  ce.start_time,
  ce.end_time,
  ce.agent_id,
  ce.inquiry_id,
  ce.property_id,
  i.customer_id,
  i.name as customer_name,
  i.email as customer_email,
  i.phone as customer_phone,
  i.property_title,
  i.property_location,
  i.status as inquiry_status,
  u.name as agent_name,
  u.email as agent_email
FROM calendar_events ce
LEFT JOIN inquiries i ON ce.inquiry_id = i.id
LEFT JOIN users u ON ce.agent_id = u.id
WHERE ce.type = 'viewing';

-- Migration: Add missing columns for property tracking and calendar integration
-- Run this to add features from GitHub repo

USE TESdb;

-- Add missing columns to properties table
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS status_history JSON DEFAULT NULL COMMENT 'Track status changes with reasons',
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0 COMMENT 'Number of property views',
  ADD COLUMN IF NOT EXISTS view_history JSON DEFAULT NULL COMMENT 'Detailed view history',
  ADD COLUMN IF NOT EXISTS last_viewed_at DATETIME DEFAULT NULL COMMENT 'Last view timestamp',
  ADD COLUMN IF NOT EXISTS sold_by VARCHAR(255) DEFAULT NULL COMMENT 'Name of agent who sold',
  ADD COLUMN IF NOT EXISTS sold_by_agent_id VARCHAR(36) DEFAULT NULL COMMENT 'Agent ID who sold',
  ADD COLUMN IF NOT EXISTS sold_at DATETIME DEFAULT NULL COMMENT 'Timestamp when sold',
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(15,2) DEFAULT NULL COMMENT 'Final sale price',
  ADD COLUMN IF NOT EXISTS commission JSON DEFAULT NULL COMMENT 'Commission tracking: {rate, amount, status, paidAt, paidBy}',
  ADD COLUMN IF NOT EXISTS reserved_by VARCHAR(255) DEFAULT NULL COMMENT 'Reserved by agent/customer',
  ADD COLUMN IF NOT EXISTS reserved_at DATETIME DEFAULT NULL COMMENT 'Reservation timestamp',
  ADD COLUMN IF NOT EXISTS reserved_until DATETIME DEFAULT NULL COMMENT 'Reservation expiry';

-- Add missing columns to calendar_events table
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS inquiry_id VARCHAR(36) DEFAULT NULL COMMENT 'Link to inquiry ticket',
  ADD COLUMN IF NOT EXISTS property_id VARCHAR(36) DEFAULT NULL COMMENT 'Link to property being viewed';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_inquiry ON calendar_events(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_calendar_property ON calendar_events(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_by ON properties(created_by);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Initialize status_history for existing properties
UPDATE properties 
SET status_history = JSON_ARRAY(
  JSON_OBJECT(
    'status', status,
    'changedBy', 'System',
    'changedByName', 'System Migration',
    'changedAt', created_at,
    'reason', 'Initial status'
  )
)
WHERE status_history IS NULL;

SELECT 'Migration completed successfully!' AS message;

-- Property Agent Ownership Migration
-- Adds primary_agent_id to track which agent owns each property
-- Only properties with 0 active inquiries can be reassigned

USE TESdb;

-- Add primary_agent_id column to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS primary_agent_id VARCHAR(36) NULL,
ADD COLUMN IF NOT EXISTS assigned_to_agent_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS assigned_by_admin_id VARCHAR(36) NULL,
ADD COLUMN IF NOT EXISTS assignment_reason VARCHAR(255) NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_primary_agent ON properties(primary_agent_id);

-- Backfill existing properties with their creator as primary agent
UPDATE properties 
SET primary_agent_id = created_by_user_id
WHERE primary_agent_id IS NULL AND created_by_user_id IS NOT NULL;

-- Log
SELECT 'Property agent ownership migration completed' AS msg;

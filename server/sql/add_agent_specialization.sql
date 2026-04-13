-- Agent specialization migration
-- Adds explicit specialization to users so assignment matching is stored in the DB

USE TESdb;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS specialization VARCHAR(120) DEFAULT NULL AFTER role;

UPDATE users
SET specialization = COALESCE(NULLIF(specialization, ''), 'General')
WHERE role = 'agent' AND (specialization IS NULL OR specialization = '');

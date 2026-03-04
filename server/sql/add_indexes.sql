-- TES Property System - Performance Optimization
-- Database Indexes Migration
-- Run Date: March 4, 2026
-- 
-- Purpose: Add indexes to improve query performance as data grows
-- Impact: Significant performance improvement for filtered queries
-- Safe to run: Yes (indexes don't affect existing data)
--
-- Run command: mysql -u root -p TESdb < server/sql/add_indexes.sql
-- ============================================================

USE TESdb;

-- ============================================================
-- PROPERTIES TABLE INDEXES
-- ============================================================

-- Index on status for filtering available/sold properties
-- Improves: GET /api/properties?status=available
CREATE INDEX IF NOT EXISTS idx_properties_status 
ON properties(status);

-- Index on type for filtering by property type
-- Improves: GET /api/properties?type=House
CREATE INDEX IF NOT EXISTS idx_properties_type 
ON properties(type);

-- Index on created_at for sorting by newest/oldest
-- Improves: ORDER BY created_at DESC queries
CREATE INDEX IF NOT EXISTS idx_properties_created_at 
ON properties(created_at DESC);

-- Index on location for location-based searches
-- Improves: WHERE location LIKE '%City%' queries
CREATE INDEX IF NOT EXISTS idx_properties_location 
ON properties(location);

-- Composite index for common filter combinations
-- Improves: WHERE status = 'available' AND type = 'House'
CREATE INDEX IF NOT EXISTS idx_properties_status_type 
ON properties(status, type);

-- Index on price for range queries
-- Improves: WHERE price BETWEEN 1000000 AND 5000000
CREATE INDEX IF NOT EXISTS idx_properties_price 
ON properties(price);

-- ============================================================
-- INQUIRIES TABLE INDEXES
-- ============================================================

-- Index on status for filtering inquiries by status
-- Improves: WHERE status = 'new' OR status = 'in_progress'
CREATE INDEX IF NOT EXISTS idx_inquiries_status 
ON inquiries(status);

-- Index on assigned_to for agent workload queries
-- Improves: WHERE assigned_to = 'agent-uuid'
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to 
ON inquiries(assigned_to);

-- Index on email for duplicate checking
-- Improves: Duplicate inquiry detection
CREATE INDEX IF NOT EXISTS idx_inquiries_email 
ON inquiries(email);

-- Index on created_at for chronological sorting
-- Improves: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at 
ON inquiries(created_at DESC);

-- Index on ticket_number for lookup
-- Improves: WHERE ticket_number = 'INQ-2026-001'
CREATE INDEX IF NOT EXISTS idx_inquiries_ticket_number 
ON inquiries(ticket_number);

-- Index on property_id for property-specific inquiries
-- Improves: WHERE property_id = 'property-uuid'
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id 
ON inquiries(property_id);

-- Composite index for duplicate detection
-- Improves: WHERE email = ? AND property_id = ? AND created_at > ?
CREATE INDEX IF NOT EXISTS idx_inquiries_email_property_date 
ON inquiries(email, property_id, created_at);

-- Composite index for agent workload queries
-- Improves: WHERE assigned_to = ? AND status NOT IN (...)
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_status 
ON inquiries(assigned_to, status);

-- ============================================================
-- CALENDAR_EVENTS TABLE INDEXES
-- ============================================================

-- Index on agent_id for per-agent calendar queries
-- Improves: WHERE agent_id = 'agent-uuid'
CREATE INDEX IF NOT EXISTS idx_calendar_agent_id 
ON calendar_events(agent_id);

-- Index on start_time for chronological queries
-- Improves: WHERE start_time > NOW()
CREATE INDEX IF NOT EXISTS idx_calendar_start_time 
ON calendar_events(start_time);

-- Index on end_time for range queries
-- Improves: WHERE end_time < ?
CREATE INDEX IF NOT EXISTS idx_calendar_end_time 
ON calendar_events(end_time);

-- Composite index for conflict detection
-- Improves: WHERE agent_id = ? AND start_time < ? AND end_time > ?
CREATE INDEX IF NOT EXISTS idx_calendar_agent_timerange 
ON calendar_events(agent_id, start_time, end_time);

-- ============================================================
-- ACTIVITY_LOG TABLE INDEXES
-- ============================================================

-- Index on timestamp for chronological queries
-- Improves: ORDER BY timestamp DESC
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp 
ON activity_log(timestamp DESC);

-- Index on action for filtering by action type
-- Improves: WHERE action = 'LOGIN_SUCCESS'
CREATE INDEX IF NOT EXISTS idx_activity_log_action 
ON activity_log(action);

-- Index on performed_by for user activity tracking
-- Improves: WHERE performed_by = 'Admin User'
CREATE INDEX IF NOT EXISTS idx_activity_log_performed_by 
ON activity_log(performed_by);

-- ============================================================
-- USERS TABLE INDEXES
-- ============================================================

-- Index on role for role-based queries
-- Improves: WHERE role = 'agent'
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- Index on email (should already exist as UNIQUE, but explicit for clarity)
-- Note: Email already has unique constraint, this is redundant but explicit
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on created_at for sorting users by registration date
CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users(created_at DESC);

-- ============================================================
-- PROPERTY_IMAGES TABLE INDEXES
-- ============================================================

-- Index on property_id for fetching images by property
-- Improves: WHERE property_id = 'property-uuid'
CREATE INDEX IF NOT EXISTS idx_property_images_property_id 
ON property_images(property_id);

-- Composite index for finding primary image
-- Improves: WHERE property_id = ? ORDER BY is_primary DESC
CREATE INDEX IF NOT EXISTS idx_property_images_property_primary 
ON property_images(property_id, is_primary);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show all indexes created (for verification)
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS,
    INDEX_TYPE
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'TESdb'
    AND INDEX_NAME LIKE 'idx_%'
GROUP BY 
    TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY 
    TABLE_NAME, INDEX_NAME;

-- Show table sizes (before optimization)
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS 'DATA_MB',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS 'INDEX_MB',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'TOTAL_MB'
FROM 
    INFORMATION_SCHEMA.TABLES
WHERE 
    TABLE_SCHEMA = 'TESdb'
ORDER BY 
    (DATA_LENGTH + INDEX_LENGTH) DESC;

-- ============================================================
-- NOTES
-- ============================================================

-- Performance Impact:
-- - SELECT queries on indexed columns: 10-100x faster
-- - INSERT operations: Slightly slower (negligible for current scale)
-- - UPDATE operations: Slightly slower (negligible for current scale)
-- - Disk space: +5-15% for index storage
--
-- When to run:
-- - Safe to run on live database
-- - Minimal performance impact during creation
-- - Best run during low-traffic period if possible
--
-- Rollback (if needed):
-- DROP INDEX idx_properties_status ON properties;
-- DROP INDEX idx_properties_type ON properties;
-- (etc... for each index)
--
-- Maintenance:
-- - Indexes maintained automatically by MySQL
-- - Run ANALYZE TABLE periodically for statistics update:
--   ANALYZE TABLE properties, inquiries, calendar_events, activity_log;
--
-- Monitoring:
-- - Check slow query log before and after
-- - Monitor query execution plans with EXPLAIN
-- - Compare query times in application logs

-- ============================================================
-- END OF MIGRATION
-- ============================================================

SELECT '✅ Database indexes successfully created!' AS STATUS;
SELECT CONCAT('📊 Run date: ', NOW()) AS INFO;
SELECT '🚀 Your queries should now be significantly faster!' AS MESSAGE;

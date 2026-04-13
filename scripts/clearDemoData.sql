-- Clear Demo Inquiries and Calendar Events
-- Run this in your MySQL client or through phpMyAdmin

-- Clear all calendar events
DELETE FROM calendar_events;

-- Clear all inquiries
DELETE FROM inquiries;

-- Clear activity log entries related to inquiries and calendar
DELETE FROM activity_log WHERE action IN ('CREATE_INQUIRY', 'CREATE_EVENT', 'ASSIGN_INQUIRY', 'CLAIM_INQUIRY');

-- Optional: Reset auto-increment counters (if you want clean IDs)
-- ALTER TABLE calendar_events AUTO_INCREMENT = 1;
-- ALTER TABLE inquiries AUTO_INCREMENT = 1;

-- Show remaining counts
SELECT 'Remaining inquiries:' as Info, COUNT(*) as Count FROM inquiries
UNION ALL
SELECT 'Remaining calendar events:', COUNT(*) FROM calendar_events;

SELECT 'Demo data cleared successfully!' as Status;

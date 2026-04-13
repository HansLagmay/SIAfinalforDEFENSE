const pool = require('../db');

async function backfillCalendarInquiryId() {
  try {
    const [events] = await pool.execute(
      `SELECT id, description
       FROM calendar_events
       WHERE inquiry_id IS NULL
         AND description LIKE '%Ticket:%'`
    );

    let updated = 0;

    for (const event of events) {
      const match = String(event.description || '').match(/Ticket:\s*([A-Z0-9-]+)/i);
      if (!match) continue;

      const ticket = match[1];
      const [inquiries] = await pool.execute(
        'SELECT id FROM inquiries WHERE ticket_number = ? LIMIT 1',
        [ticket]
      );

      if (inquiries.length === 0) continue;

      await pool.execute(
        'UPDATE calendar_events SET inquiry_id = ?, updated_at = NOW() WHERE id = ?',
        [inquiries[0].id, event.id]
      );
      updated += 1;
    }

    console.log(`Backfill complete. Updated calendar events: ${updated}`);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

backfillCalendarInquiryId();

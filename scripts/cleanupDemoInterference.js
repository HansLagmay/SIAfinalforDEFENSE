require('dotenv').config();
const mysql = require('mysql2/promise');

const TERMINAL_INQUIRY_STATUSES = ['deal-successful', 'deal-cancelled', 'no-response'];
const QA_EMAIL_LIKE = 'qa.%@example.com';

const hasApplyFlag = process.argv.includes('--apply');

const toSummary = (label, value) => `${label}: ${value}`;

const makeInClause = (values) => {
  if (!values || values.length === 0) return { clause: '(NULL)', params: [] };
  return { clause: `(${values.map(() => '?').join(',')})`, params: values };
};

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('=== Demo Interference Cleanup ===');
    console.log(`Mode: ${hasApplyFlag ? 'APPLY (changes will be written)' : 'DRY RUN (no changes)'}`);

    const [qaCustomers] = await conn.execute(
      `SELECT id, email, name
       FROM customers
       WHERE archived_at IS NULL
         AND LOWER(email) LIKE ?`,
      [QA_EMAIL_LIKE]
    );

    const qaCustomerIds = qaCustomers.map((c) => c.id);
    const customerIn = makeInClause(qaCustomerIds);

    const [qaInquiriesByEmail] = await conn.execute(
      `SELECT id, property_id, email, status
       FROM inquiries
       WHERE archived_at IS NULL
         AND LOWER(email) LIKE ?`,
      [QA_EMAIL_LIKE]
    );

    let qaInquiriesByCustomer = [];
    if (qaCustomerIds.length > 0) {
      const [rows] = await conn.execute(
        `SELECT id, property_id, email, status
         FROM inquiries
         WHERE archived_at IS NULL
           AND customer_id IN ${customerIn.clause}`,
        customerIn.params
      );
      qaInquiriesByCustomer = rows;
    }

    const inquiryMap = new Map();
    [...qaInquiriesByEmail, ...qaInquiriesByCustomer].forEach((q) => inquiryMap.set(q.id, q));
    const qaInquiries = Array.from(inquiryMap.values());
    const qaInquiryIds = qaInquiries.map((q) => q.id);
    const inquiryIn = makeInClause(qaInquiryIds);

    const activeQaInquiries = qaInquiries.filter((q) => !TERMINAL_INQUIRY_STATUSES.includes(String(q.status || '').toLowerCase()));

    let calendarLinked = 0;
    if (qaInquiryIds.length > 0) {
      const [[{ cnt }]] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM calendar_events WHERE inquiry_id IN ${inquiryIn.clause}`,
        inquiryIn.params
      );
      calendarLinked = Number(cnt || 0);
    }

    const [[{ qaViewingEvents }]] = await conn.execute(
      `SELECT COUNT(*) AS qaViewingEvents
       FROM calendar_events
       WHERE title LIKE 'QA Viewing %' OR title LIKE 'QA Viewing%'`
    );

    let notificationByInquiry = 0;
    if (qaInquiryIds.length > 0) {
      const [[{ cnt }]] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM notifications WHERE related_type = 'inquiry' AND related_id IN ${inquiryIn.clause}`,
        inquiryIn.params
      );
      notificationByInquiry = Number(cnt || 0);
    }

    let customerNotifications = 0;
    if (qaCustomerIds.length > 0) {
      const [[{ cnt }]] = await conn.execute(
        `SELECT COUNT(*) AS cnt FROM notifications WHERE user_role = 'customer' AND user_id IN ${customerIn.clause}`,
        customerIn.params
      );
      customerNotifications = Number(cnt || 0);
    }

    const [[{ qaFavorites }]] = await conn.execute(
      qaCustomerIds.length > 0
        ? `SELECT COUNT(*) AS qaFavorites FROM customer_favorites WHERE customer_id IN ${customerIn.clause}`
        : 'SELECT 0 AS qaFavorites',
      qaCustomerIds.length > 0 ? customerIn.params : []
    );

    const [[{ qaPreferences }]] = await conn.execute(
      qaCustomerIds.length > 0
        ? `SELECT COUNT(*) AS qaPreferences FROM customer_preferences WHERE customer_id IN ${customerIn.clause}`
        : 'SELECT 0 AS qaPreferences',
      qaCustomerIds.length > 0 ? customerIn.params : []
    );

    const [[{ qaPhoneAttempts }]] = await conn.execute(
      qaCustomerIds.length > 0
        ? `SELECT COUNT(*) AS qaPhoneAttempts FROM phone_verification_attempts WHERE customer_id IN ${customerIn.clause}`
        : 'SELECT 0 AS qaPhoneAttempts',
      qaCustomerIds.length > 0 ? customerIn.params : []
    );

    const [[{ qaPhoneLogs }]] = await conn.execute(
      qaCustomerIds.length > 0
        ? `SELECT COUNT(*) AS qaPhoneLogs FROM phone_verification_log WHERE customer_id IN ${customerIn.clause}`
        : 'SELECT 0 AS qaPhoneLogs',
      qaCustomerIds.length > 0 ? customerIn.params : []
    );

    console.log(toSummary('QA customers found', qaCustomerIds.length));
    console.log(toSummary('QA inquiries found', qaInquiryIds.length));
    console.log(toSummary('QA active inquiries (can lock reassignment)', activeQaInquiries.length));
    console.log(toSummary('Calendar events linked to QA inquiries', calendarLinked));
    console.log(toSummary('QA-titled viewing events', Number(qaViewingEvents || 0)));
    console.log(toSummary('Notifications linked to QA inquiries', notificationByInquiry));
    console.log(toSummary('Customer notifications for QA customers', customerNotifications));
    console.log(toSummary('QA favorites', Number(qaFavorites || 0)));
    console.log(toSummary('QA preferences', Number(qaPreferences || 0)));
    console.log(toSummary('QA phone attempt records', Number(qaPhoneAttempts || 0)));
    console.log(toSummary('QA phone verification logs', Number(qaPhoneLogs || 0)));

    if (!hasApplyFlag) {
      console.log('\nDry run complete. Re-run with --apply to perform cleanup.');
      return;
    }

    await conn.beginTransaction();

    if (qaInquiryIds.length > 0) {
      await conn.execute(
        `DELETE FROM calendar_events WHERE inquiry_id IN ${inquiryIn.clause}`,
        inquiryIn.params
      );

      await conn.execute(
        `DELETE FROM notifications WHERE related_type = 'inquiry' AND related_id IN ${inquiryIn.clause}`,
        inquiryIn.params
      );

      await conn.execute(
        `DELETE FROM inquiries WHERE id IN ${inquiryIn.clause}`,
        inquiryIn.params
      );
    }

    await conn.execute(
      `DELETE FROM calendar_events WHERE title LIKE 'QA Viewing %' OR title LIKE 'QA Viewing%'`
    );

    if (qaCustomerIds.length > 0) {
      await conn.execute(
        `DELETE FROM notifications WHERE user_role = 'customer' AND user_id IN ${customerIn.clause}`,
        customerIn.params
      );

      await conn.execute(
        `DELETE FROM phone_verification_attempts WHERE customer_id IN ${customerIn.clause}`,
        customerIn.params
      );

      await conn.execute(
        `DELETE FROM phone_verification_log WHERE customer_id IN ${customerIn.clause}`,
        customerIn.params
      );

      // Favorites/preferences cascade on customer delete, but explicit cleanup keeps intent clear.
      await conn.execute(
        `DELETE FROM customer_favorites WHERE customer_id IN ${customerIn.clause}`,
        customerIn.params
      );

      await conn.execute(
        `DELETE FROM customer_preferences WHERE customer_id IN ${customerIn.clause}`,
        customerIn.params
      );

      await conn.execute(
        `DELETE FROM customers WHERE id IN ${customerIn.clause}`,
        customerIn.params
      );
    }

    await conn.commit();

    const [postLocks] = await conn.execute(
      `SELECT p.title, COUNT(i.id) AS active_count
       FROM properties p
       LEFT JOIN inquiries i ON i.property_id = p.id
         AND i.archived_at IS NULL
         AND i.status NOT IN ('deal-successful','deal-cancelled','no-response')
       WHERE p.archived_at IS NULL
       GROUP BY p.id, p.title
       HAVING active_count > 0
       ORDER BY active_count DESC, p.title ASC
       LIMIT 10`
    );

    console.log('\nCleanup applied successfully.');
    console.log(toSummary('Properties still with active inquiries (top 10)', postLocks.length));
    if (postLocks.length > 0) {
      postLocks.forEach((row) => {
        console.log(` - ${row.title}: ${row.active_count}`);
      });
    }
  } catch (error) {
    try {
      await conn.rollback();
    } catch (_) {
      // ignore rollback failures
    }
    console.error('Cleanup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();

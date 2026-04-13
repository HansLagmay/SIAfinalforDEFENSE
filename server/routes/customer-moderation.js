const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { validateParams, uuidParamSchema } = require('../middleware/validators');
const logActivity = require('../middleware/logger');

const router = express.Router();

// GET flagged customer reports (admin)
router.get('/customer-flags', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const status = String(req.query.status || 'pending').trim();
    const allowed = new Set(['pending', 'reviewed', 'blocked', 'dismissed', 'all']);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    const where = status === 'all' ? '' : 'WHERE cf.status = ?';
    const params = status === 'all' ? [] : [status];

    const [rows] = await pool.execute(
      `SELECT
        cf.id,
        cf.inquiry_id,
        cf.customer_id,
        cf.customer_name,
        cf.customer_email,
        cf.customer_phone,
        cf.reported_by_agent_id,
        cf.reported_by_agent_name,
        cf.reason,
        cf.details,
        cf.status,
        cf.reviewed_by,
        cf.reviewed_at,
        cf.review_notes,
        cf.created_at,
        c.is_blocked,
        c.blocked_at,
        c.blocked_reason
       FROM customer_flags cf
       LEFT JOIN customers c ON c.id = cf.customer_id
       ${where}
       ORDER BY cf.created_at DESC`,
      params
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Failed to fetch customer flags:', error);
    return res.status(500).json({ error: 'Failed to fetch customer flags' });
  }
});

// POST mark flag reviewed/dismissed (admin)
router.post('/customer-flags/:id/review', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), sanitizeBody, async (req, res) => {
  try {
    const status = req.body.status === 'dismissed' ? 'dismissed' : 'reviewed';
    const reviewNotes = String(req.body.reviewNotes || '').trim();

    const [rows] = await pool.execute('SELECT id FROM customer_flags WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Flag report not found' });
    }

    await pool.execute(
      `UPDATE customer_flags
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, req.user.id, reviewNotes || null, req.params.id]
    );

    await logActivity('REVIEW_CUSTOMER_FLAG', `Reviewed customer report ${req.params.id} as ${status}`, req.user.name);
    return res.json({ message: `Report marked as ${status}` });
  } catch (error) {
    console.error('Failed to review customer flag:', error);
    return res.status(500).json({ error: 'Failed to review customer report' });
  }
});

// POST block customer from a report (admin)
router.post('/customer-flags/:id/block', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), sanitizeBody, async (req, res) => {
  try {
    const blockReason = String(req.body.blockReason || '').trim() || 'Blocked by admin after report review';

    const [rows] = await pool.execute(
      'SELECT id, customer_id, customer_email FROM customer_flags WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Flag report not found' });
    }

    let customerId = rows[0].customer_id;
    if (!customerId && rows[0].customer_email) {
      const [customers] = await pool.execute(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER(?) LIMIT 1',
        [rows[0].customer_email]
      );
      customerId = customers[0]?.id || null;
    }

    if (!customerId) {
      return res.status(404).json({ error: 'Customer account not found for this report' });
    }

    await pool.execute(
      `UPDATE customers
       SET is_blocked = 1,
           blocked_at = NOW(),
           blocked_by = ?,
           blocked_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, blockReason, customerId]
    );

    await pool.execute(
      `UPDATE customer_flags
       SET status = 'blocked', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, blockReason, req.params.id]
    );

    await logActivity('BLOCK_CUSTOMER', `Blocked customer ${customerId} from flag ${req.params.id}`, req.user.name);
    return res.json({ message: 'Customer blocked successfully', customerId });
  } catch (error) {
    console.error('Failed to block customer:', error);
    return res.status(500).json({ error: 'Failed to block customer' });
  }
});

// DELETE remove customer account (admin)
router.delete('/customers/:id/remove', authenticateToken, requireRole(['admin']), validateParams(uuidParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, name FROM customers WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await pool.execute(
      `UPDATE customers
       SET archived_at = NOW(), archived_by = ?, archive_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, 'Removed by admin after moderation', req.params.id]
    );

    await pool.execute(
      `UPDATE customer_flags
       SET status = 'blocked', reviewed_by = ?, reviewed_at = NOW(), review_notes = COALESCE(review_notes, 'Customer removed by admin'), updated_at = NOW()
       WHERE customer_id = ? AND status IN ('pending', 'reviewed')`,
      [req.user.id, req.params.id]
    );

    await logActivity('REMOVE_CUSTOMER_ACCOUNT', `Archived customer account ${rows[0].email}`, req.user.name);
    return res.json({ message: 'Customer account removed (archived) successfully' });
  } catch (error) {
    console.error('Failed to remove customer account:', error);
    return res.status(500).json({ error: 'Failed to remove customer account' });
  }
});

module.exports = router;
